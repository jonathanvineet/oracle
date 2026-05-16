package com.oracle.streamer

import android.util.Log
import kotlinx.coroutines.*
import java.util.*
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicReference

/**
 * Printer control via serial command queue.
 * 
 * Implements the fundamental Marlin protocol:
 * 1. Send command
 * 2. Wait for "ok"
 * 3. Send next command
 * 
 * This ensures deterministic, professional printer control.
 * No buffering, no collisions, no state desyncs.
 */
class PrinterController(
    private val usbManager: UsbSerialManager
) {
    private val TAG = "PrinterController"
    private val scope = CoroutineScope(Dispatchers.Default + Job())
    private val state = AtomicReference(PrinterState())

    private val queue = ArrayDeque<String>()
    private var isBusy = false
    private var pollingJob: Job? = null
    private val listeners = CopyOnWriteArrayList<StateListener>()

    interface StateListener {
        fun onStateChanged(newState: PrinterState)
    }

    init {
        usbManager.addListener(object : UsbSerialManager.SerialListener {
            override fun onLineReceived(line: String) {
                handleResponse(line)
            }

            override fun onConnectionChanged(connected: Boolean) {
                updateState { it.copy(connected = connected) }
                if (connected) {
                    startPolling()
                } else {
                    stopPolling()
                }
            }

            override fun onError(message: String) {
                updateState { it.copy(lastMessage = message) }
            }
        })
    }

    /**
     * Connect to printer.
     */
    fun connect(onResult: (success: Boolean, message: String) -> Unit) {
        scope.launch {
            usbManager.connect { success, msg ->
                onResult(success, msg)
            }
        }
    }

    /**
     * Close connection and cleanup.
     */
    fun close() {
        stopPolling()
        usbManager.disconnect()
        scope.cancel()
    }

    /**
     * Send raw G-code command.
     * Queued for sequential transmission — waits for "ok" before sending next.
     */
    fun send(command: String) {
        synchronized(queue) {
            queue.add(command)
            processQueue()
        }
    }

    /**
     * Process queued commands.
     * Only sends one command at a time, waiting for "ok" response.
     */
    private fun processQueue() {
        if (isBusy) return
        if (queue.isEmpty()) return

        isBusy = true
        val cmd = queue.removeFirst()
        
        Log.d(TAG, "Sending: $cmd")
        usbManager.sendCommand(cmd)
    }

    /**
     * Handle printer response.
     * Detects "ok" to release queue for next command.
     */
    private fun handleResponse(line: String) {
        // Check for "ok" — releases queue for next command
        if (line.startsWith("ok")) {
            synchronized(queue) {
                isBusy = false
                processQueue()
            }
        }

        // Parse telemetry
        parse(line)
    }

    /**
     * Parse Marlin response and update state.
     */
    private fun parse(line: String) {
        when {
            line.startsWith("T:") -> MarlinParser.parseTemperature(line)?.let { result ->
                updateState { it.copy(
                    nozzleTemp = result.nozzleTemp,
                    nozzleTarget = result.nozzleTarget,
                    bedTemp = result.bedTemp,
                    bedTarget = result.bedTarget
                )}
            }
            line.startsWith("X:") -> MarlinParser.parsePosition(line)?.let { result ->
                updateState { it.copy(x = result.x, y = result.y, z = result.z) }
            }
            line.contains("FIRMWARE_NAME:") -> {
                MarlinParser.parseFirmware(line)?.let { version ->
                    updateState { it.copy(firmware = version) }
                }
            }
            line.startsWith("echo:") || line.startsWith("error:") -> {
                updateState { it.copy(lastMessage = line) }
            }
        }
    }

    /**
     * Start polling loop — queries temps & position every 1 second.
     */
    private fun startPolling() {
        stopPolling()
        pollingJob = scope.launch {
            while (isActive) {
                delay(1000) // 1 second polling
                send("M105") // Temperature
                send("M114") // Position
            }
        }
    }

    /**
     * Stop polling.
     */
    private fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }

    /**
     * Update printer state atomically.
     */
    private fun updateState(block: (PrinterState) -> PrinterState) {
        val old = state.get()
        val new = block(old)
        state.set(new)
        listeners.forEach { it.onStateChanged(new) }
    }

    /**
     * Add listener for state changes.
     */
    fun addListener(listener: StateListener) {
        listeners.add(listener)
        listener.onStateChanged(state.get())
    }

    fun removeListener(listener: StateListener) {
        listeners.remove(listener)
    }

    /**
     * Get current state.
     */
    fun getState(): PrinterState = state.get()

    // ─── Simple GCODE builders ────────────────────────────────────────

    fun homeAll() = send("G28")
    fun homeX() = send("G28 X")
    fun homeY() = send("G28 Y")
    fun homeZ() = send("G28 Z")

    fun moveX(mm: Float, relative: Boolean = false) {
        if (relative) send("G91")
        send("G1 X${String.format("%.2f", mm)} F3000")
        if (relative) send("G90")
    }

    fun moveY(mm: Float, relative: Boolean = false) {
        if (relative) send("G91")
        send("G1 Y${String.format("%.2f", mm)} F3000")
        if (relative) send("G90")
    }

    fun moveZ(mm: Float, relative: Boolean = false) {
        if (relative) send("G91")
        send("G1 Z${String.format("%.2f", mm)} F3000")
        if (relative) send("G90")
    }

    fun setNozzleTemp(celsius: Int) = send("M104 S$celsius")
    fun setBedTemp(celsius: Int) = send("M140 S$celsius")

    fun preheatPLA() {
        send("M104 S200")
        send("M140 S60")
    }

    fun preheatPLAPlus() {
        send("M104 S220")
        send("M140 S60")
    }

    fun preheatPETG() {
        send("M104 S230")
        send("M140 S80")
    }

    fun preheatABS() {
        send("M104 S240")
        send("M140 S100")
    }

    fun preheatTPU() {
        send("M104 S220")
        send("M140 S60")
    }

    fun setFanPercent(percent: Int) {
        val pwm = (percent * 255 / 100).coerceIn(0, 255)
        send("M106 S$pwm")
    }

    fun setFeedrate(percent: Int) = send("M220 S$percent")

    fun setFlow(percent: Int) = send("M221 S$percent")

    fun disableSteppers() = send("M18")

    fun emergencyStop() = send("M112")
}
