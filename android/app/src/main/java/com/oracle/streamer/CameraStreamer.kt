package com.oracle.streamer

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
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
    private val TAG = "CameraStreamer"
    private val mjpegServer = MjpegServer()
    private val analysisExecutor = Executors.newSingleThreadExecutor()

    private var lastFpsUpdate = System.currentTimeMillis()
    private var frameCountSinceUpdate = 0
    private val frameTimestamp = AtomicLong(0)

    fun start(
        onFrame: (fps: Int) -> Unit,
        onError: (msg: String) -> Unit
    ) {
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
                Log.i(TAG, "CameraX bound successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Camera bind failed: ${e.message}")
                onError("Camera failed: ${e.message}")
            }

        }, ContextCompat.getMainExecutor(context))
    }

    private fun processFrame(imageProxy: ImageProxy, onFrame: (fps: Int) -> Unit) {
        try {
            val jpegBytes = imageProxy.toJpeg(StreamConfig.JPEG_QUALITY)
            mjpegServer.pushFrame(jpegBytes)

            // FPS counter — update every second
            frameCountSinceUpdate++
            val now = System.currentTimeMillis()
            if (now - lastFpsUpdate >= 1000) {
                val fps = frameCountSinceUpdate
                frameCountSinceUpdate = 0
                lastFpsUpdate = now
                onFrame(fps)
            }
        } finally {
            // Always close — CameraX will not deliver next frame until this is called
            imageProxy.close()
        }
    }

    fun stop() {
        try {
            val cameraProvider = ProcessCameraProvider.getInstance(context).get()
            cameraProvider.unbindAll()
        } catch (_: Exception) {}
        mjpegServer.stop()
        analysisExecutor.shutdown()
        Log.i(TAG, "CameraStreamer stopped")
    }

    val clientCount: Int get() = mjpegServer.clientCount
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
    val out = ByteArrayOutputStream()
    yuvImage.compressToJpeg(Rect(0, 0, width, height), quality, out)
    return out.toByteArray()
}
