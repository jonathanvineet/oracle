package com.oracle.streamer

/**
 * Single place to change streaming parameters.
 * No scattered constants, no config files on Android.
 */
object StreamConfig {
    /** Port the MJPEG HTTP server listens on */
    const val PORT = 8080

    /** JPEG quality 0-100. 30 = ultra-fast encoding, smooth motion, <10KB per frame */
    const val JPEG_QUALITY = 30

    /** Target resolution. CameraX will pick the closest available. */
    /** 640x360 = fastest encode, best latency consistency */
    const val TARGET_WIDTH = 640
    const val TARGET_HEIGHT = 360

    /** MJPEG boundary string */
    const val BOUNDARY = "oracleframe"
}
