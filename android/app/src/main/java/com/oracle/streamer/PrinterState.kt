package com.oracle.streamer

/**
 * Printer mode controls adaptive polling and command behavior.
 */
enum class PrinterMode {
    IDLE,        // Normal polling (M105 every 1.5s, position rarely)
    MOVING,      // Only poll position (M114), skip temperature spam
    HOMING,      // Only poll position (M114), skip temperature
    HEATING,     // Only poll temperature (M105), skip position
    PRINTING     // Poll both temps and position for progress
}

/**
 * Immutable state snapshot of the connected 3D printer.
 * Updated continuously from polling loop.
 */
data class PrinterState(
    val connected: Boolean = false,
    val firmware: String = "",
    val nozzleTemp: Float = 0f,
    val nozzleTarget: Float = 0f,
    val bedTemp: Float = 0f,
    val bedTarget: Float = 0f,
    val x: Float = 0f,
    val y: Float = 0f,
    val z: Float = 0f,
    val fanPercent: Int = 0,
    val busy: Boolean = false,
    val lastMessage: String = "",
    val mode: PrinterMode = PrinterMode.IDLE,
    val baudRate: Int = 115200
)
