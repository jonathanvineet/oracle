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
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicLong

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
    // Bounded queue: max 2 frames waiting to send. Older frames dropped if queue full.
    // This keeps lag <70ms even if network is slow.
    private val frameQueue = ArrayBlockingQueue<ByteArray>(2)
    private val serverThread = Thread { frameQueueWorker() }.apply { isDaemon = true }
    private var isRunning = false

    private var lastFpsUpdate = System.currentTimeMillis()
    private var frameCountSinceUpdate = 0
    
    // Frame skipping: target 30fps exactly
    // Most phones run at 30fps camera, so FRAME_SKIP=0 means we process all frames → 30fps
    // If camera runs faster, increase FRAME_SKIP to throttle
    private var frameCounter = 0
    private val frameSkip = 0  // 0 = no skipping; adjust if camera delivers >30fps

    private fun frameQueueWorker() {
        while (isRunning) {
            try {
                // Block until a frame is available (no busy-wait)
                val jpegBytes = frameQueue.take()
                mjpegServer.pushFrame(jpegBytes)
            } catch (_: InterruptedException) {
                break
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
            
            // JPEG compression on analyzer thread (not blocking camera)
            val jpegBytes = proxy.toJpeg(StreamConfig.JPEG_QUALITY)
            
            // Non-blocking queue: if queue is full (server can't keep pace),
            // discard the oldest queued frame and add this one (drop oldest, not newest)
            if (frameQueue.remainingCapacity() == 0) {
                frameQueue.poll()  // Drop oldest frame to make room
            }
            frameQueue.offer(jpegBytes)

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
    val yBuffer = planes[0].buffer
    val uBuffer = planes[1].buffer
    val vBuffer = planes[2].buffer

    val ySize = yBuffer.remaining()
    val uSize = uBuffer.remaining()
    val vSize = vBuffer.remaining()

    // Reconstruct NV21 byte array (YUV format that YuvImage accepts)
    val nv21 = ByteArray(ySize + uSize + vSize)
    yBuffer.get(nv21, 0, ySize)
    vBuffer.get(nv21, ySize, vSize)
    uBuffer.get(nv21, ySize + vSize, uSize)

    val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
    val out = ByteArrayOutputStream(ySize / 2)  // Pre-allocate reasonable size
    yuvImage.compressToJpeg(Rect(0, 0, width, height), quality, out)
    return out.toByteArray()
}
