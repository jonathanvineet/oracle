package com.oracle.streamer

/**
 * Single place to change streaming parameters.
 * No scattered constants, no config files on Android.
 */
object StreamConfig {
    /** Port the MJPEG HTTP server listens on */
    const val PORT = 8080

    /** JPEG quality 0-100. 45 = fast encoding, <30KB per frame at 540p for 30fps */
    const val JPEG_QUALITY = 45

    /** Target resolution. CameraX will pick the closest available. Lower = faster encode */
    const val TARGET_WIDTH = 960
    const val TARGET_HEIGHT = 540

    /** MJPEG boundary string */
    const val BOUNDARY = "oracleframe"
}
