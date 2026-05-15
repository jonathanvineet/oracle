package com.oracle.streamer

import android.util.Log

/**
 * Parse responses from Marlin firmware.
 * Handles M105, M114, M115, ok, busy, etc.
 */
object MarlinParser {
    private const val TAG = "MarlinParser"

    /**
     * Parse M105 temperature response.
     * Format: ok T:20.5 /200.0 B:22.3 /60.0 T0:20.5 /200.0 @:0 B@:0
     */
    fun parseTemperature(line: String): TemperatureData? {
        if (!line.contains("T:")) return null

        val data = TemperatureData()

        // Nozzle temp (T:)
        extractFloat(line, "T:").let { data.nozzleTemp = it }
        extractFloat(line, "T:", "/").let { data.nozzleTarget = it }

        // Bed temp (B:)
        extractFloat(line, "B:").let { data.bedTemp = it }
        extractFloat(line, "B:", "/").let { data.bedTarget = it }

        return data
    }

    /**
     * Parse M114 position response.
     * Format: X:10.50 Y:20.00 Z:5.25 E:0.00 Count X:1234 Y:2000 Z:1050
     */
    fun parsePosition(line: String): PositionData? {
        if (!line.contains("X:")) return null

        val data = PositionData()
        data.x = extractFloat(line, "X:")
        data.y = extractFloat(line, "Y:")
        data.z = extractFloat(line, "Z:")
        return data
    }

    /**
     * Parse M115 firmware response.
     * Format: FIRMWARE_NAME:Marlin 2.1.2 PROTOCOL_VERSION:1.0
     */
    fun parseFirmware(line: String): String? {
        if (!line.contains("FIRMWARE_NAME:")) return null
        val start = line.indexOf("FIRMWARE_NAME:") + "FIRMWARE_NAME:".length
        val end = line.indexOf(" PROTOCOL", start).takeIf { it > 0 } ?: line.length
        return line.substring(start, end).trim()
    }

    /**
     * Check if printer is busy.
     * Look for "busy: processing" in the line.
     */
    fun isBusy(line: String): Boolean {
        return line.contains("busy:", ignoreCase = true)
    }

    /**
     * Check if command was accepted (ok).
     */
    fun isOk(line: String): Boolean {
        return line.trim() == "ok" || line.startsWith("ok")
    }

    /**
     * Extract a float value after a prefix and before optional end marker.
     * Example: "T:20.5 /200.0" with prefix "T:" and end "/" returns 20.5
     */
    private fun extractFloat(line: String, prefix: String, endMarker: String? = null): Float {
        val start = line.indexOf(prefix)
        if (start < 0) return 0f

        val valueStart = start + prefix.length
        val endIdx = if (endMarker != null) {
            line.indexOf(endMarker, valueStart).takeIf { it > valueStart } ?: line.length
        } else {
            // Find next space or end of line
            (line.indexOf(" ", valueStart).takeIf { it > valueStart } ?: line.length)
        }

        return try {
            line.substring(valueStart, endIdx).trim().toFloat()
        } catch (e: Exception) {
            0f
        }
    }

    data class TemperatureData(
        var nozzleTemp: Float = 0f,
        var nozzleTarget: Float = 0f,
        var bedTemp: Float = 0f,
        var bedTarget: Float = 0f
    )

    data class PositionData(
        var x: Float = 0f,
        var y: Float = 0f,
        var z: Float = 0f
    )
}
