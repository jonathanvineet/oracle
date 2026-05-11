package com.oracle.streamer

/**
 * Single place to change streaming parameters.
 * No scattered constants, no config files on Android.
 */
object StreamConfig {
    /** Port the MJPEG HTTP server listens on */
    const val PORT = 8080

    /** JPEG quality 0-100. 60 = ~50-80KB per frame at 720p — good balance */
    const val JPEG_QUALITY = 60

    /** Target resolution. CameraX will pick the closest available. */
    const val TARGET_WIDTH = 1280
    const val TARGET_HEIGHT = 720

    /** MJPEG boundary string */
    const val BOUNDARY = "oracleframe"
}
