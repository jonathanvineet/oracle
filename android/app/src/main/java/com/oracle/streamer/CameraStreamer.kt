package com.oracle.streamer

import android.content.Context
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import android.util.Log
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.io.ByteArrayOutputStream
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicReference

/**
 * CameraStreamer — connects CameraX to the MjpegServer.
 *
 * Uses ImageAnalysis with STRATEGY_KEEP_ONLY_LATEST:
 * - If the server is busy writing a frame, newer frames are DROPPED (not queued)
 * - This prevents memory buildup and keeps latency low
 * - CameraX delivers YUV_420_888 frames; we convert to JPEG in the analyzer thread
 *
 * No Expo. No takePictureAsync. No polling. Real frame pipeline.
 */
class CameraStreamer(
    private val context: Context,
    private val previewView: PreviewView
) {
    private val tag = "CameraStreamer"
    private val mjpegServer = MjpegServer()
    // Single thread for encoding — prevents CPU thrashing
    private val analysisExecutor = Executors.newSingleThreadExecutor()
    // Atomic reference to LATEST frame only — no queue, no historical latency
    // When encoder reads it, it gets current frame. Old frames immediately garbage collected.
    private val latestFrame = AtomicReference<ByteArray>(null)
    private val serverThread = Thread { frameStreamWorker() }.apply { isDaemon = true }
    private var isRunning = false

    private var lastFpsUpdate = System.currentTimeMillis()
    private var frameCountSinceUpdate = 0
    
    // Frame skipping: target 30fps exactly
    private var frameCounter = 0
    private val frameSkip = 0  // 0 = no skipping

    private fun frameStreamWorker() {
        while (isRunning) {
            val frame = latestFrame.getAndSet(null)  // Get latest, clear it
            if (frame != null) {
                mjpegServer.pushFrame(frame)
            } else {
                Thread.sleep(10)  // No frame yet, wait briefly
            }
        }
    }

    fun start(
        onFrame: (fps: Int) -> Unit,
        onError: (msg: String) -> Unit
    ) {
        isRunning = true
        serverThread.start()
        mjpegServer.start()

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            // Camera preview — shows viewfinder on screen
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

            // Frame analysis — this is where we get actual pixel data
            val imageAnalysis = ImageAnalysis.Builder()
                .setTargetResolution(Size(StreamConfig.TARGET_WIDTH, StreamConfig.TARGET_HEIGHT))
                // KEY: drop frames we can't process fast enough — never queue up
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
                .build()

            imageAnalysis.setAnalyzer(analysisExecutor) { imageProxy ->
                processFrame(imageProxy, onFrame)
            }

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    context as LifecycleOwner,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    imageAnalysis
                )
                Log.i(tag, "CameraX bound successfully")
            } catch (e: Exception) {
                Log.e(tag, "Camera bind failed: ${e.message}")
                onError("Camera failed: ${e.message}")
            }

        }, ContextCompat.getMainExecutor(context))
    }

    private fun processFrame(imageProxy: ImageProxy, onFrame: (fps: Int) -> Unit) {
        imageProxy.use { proxy ->
            // Skip frames if configured
            frameCounter++
            if (frameCounter % (frameSkip + 1) != 0) {
                return
            }
            
            // JPEG compression on analyzer thread
            val jpegBytes = proxy.toJpeg(StreamConfig.JPEG_QUALITY)
            
            // Atomic reference — overwrites stale frame, no queueing
            // Server thread picks up latest whenever ready
            latestFrame.set(jpegBytes)

            // FPS counter — update every second
            frameCountSinceUpdate++
            val now = System.currentTimeMillis()
            if (now - lastFpsUpdate >= 1000) {
                val fps = frameCountSinceUpdate
                frameCountSinceUpdate = 0
                lastFpsUpdate = now
                onFrame(fps)
            }
        }
    }

    fun stop() {
        try {
            val cameraProvider = ProcessCameraProvider.getInstance(context).get()
            cameraProvider.unbindAll()
        } catch (_: Exception) {}
        isRunning = false
        mjpegServer.stop()
        analysisExecutor.shutdown()
        serverThread.interrupt()
        Log.i(tag, "CameraStreamer stopped")
    }
}

/**
 * Extension: convert CameraX ImageProxy (YUV_420_888) to JPEG bytes.
 * Uses Android's built-in YuvImage — no external library needed.
 */
fun ImageProxy.toJpeg(quality: Int): ByteArray {
    val yPlane = planes[0]
    val uPlane = planes[1]
    val vPlane = planes[2]

    val yBuffer = yPlane.buffer
    val uBuffer = uPlane.buffer
    val vBuffer = vPlane.buffer

    val ySize = width * height
    val chromaSize = width * height / 2

    // Reconstruct a tightly packed NV21 buffer from CameraX's YUV_420_888 planes.
    // CameraX planes often contain row padding and chroma pixelStride > 1, so we
    // must copy row-by-row instead of assuming the buffers are already contiguous.
    val nv21 = ByteArray(ySize + chromaSize)

    var outputOffset = 0
    for (row in 0 until height) {
        val rowStart = row * yPlane.rowStride
        for (col in 0 until width) {
            nv21[outputOffset++] = yBuffer.get(rowStart + col * yPlane.pixelStride)
        }
    }

    val chromaHeight = height / 2
    val chromaWidth = width / 2
    for (row in 0 until chromaHeight) {
        val uRowStart = row * uPlane.rowStride
        val vRowStart = row * vPlane.rowStride
        for (col in 0 until chromaWidth) {
            nv21[outputOffset++] = vBuffer.get(vRowStart + col * vPlane.pixelStride)
            nv21[outputOffset++] = uBuffer.get(uRowStart + col * uPlane.pixelStride)
        }
    }

    val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
    val out = ByteArrayOutputStream(ySize / 2)  // Pre-allocate reasonable size
    yuvImage.compressToJpeg(Rect(0, 0, width, height), quality, out)
    return out.toByteArray()
}
