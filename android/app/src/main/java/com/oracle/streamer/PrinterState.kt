package com.oracle.streamer

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
    val baudRate: Int = 115200
)
