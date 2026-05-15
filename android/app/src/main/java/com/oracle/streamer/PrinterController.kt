package com.oracle.streamer

import android.util.Log
import kotlinx.coroutines.*
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicReference

/**
 * High-level printer control and state management.
 * Sends G-code safely, maintains polling loop, parses responses.
 */
class PrinterController(
    private val usbManager: UsbSerialManager
) {
    private val TAG = "PrinterController"
    private val scope = CoroutineScope(Dispatchers.Default + Job())
    private val state = AtomicReference(PrinterState())

    private var pollingJob: Job? = null
    private var readJob: Job? = null
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
        usbManager.connect { success, msg ->
            if (success) {
                // Start read loop in background
                readJob = scope.launch {
                    withContext(Dispatchers.IO) {
                        usbManager.readLoop()
                    }
                }
            }
            onResult(success, msg)
        }
    }

    /**
     * Disconnect from printer.
     */
    fun disconnect() {
        stopPolling()
        readJob?.cancel()
        usbManager.disconnect()
        updateState { PrinterState() }
    }

    /**
     * Get current printer state.
     */
    fun getState(): PrinterState = state.get()

    /**
     * Send a G-code command safely (must go through controller).
     */
    fun sendCommand(command: String) {
        if (!usbManager.isConnected()) {
            Log.w(TAG, "Not connected, command ignored: $command")
            return
        }
        scope.launch {
            usbManager.sendCommand(command)
        }
    }

    /**
     * Movement commands.
     */
    fun homeAll() = sendCommand("G28")
    fun moveX(mm: Float, relative: Boolean = false) {
        if (relative) sendCommand("G91")
        sendCommand("G1 X$mm F1500")
        if (relative) sendCommand("G90")
    }

    fun moveY(mm: Float, relative: Boolean = false) {
        if (relative) sendCommand("G91")
        sendCommand("G1 Y$mm F1500")
        if (relative) sendCommand("G90")
    }

    fun moveZ(mm: Float, relative: Boolean = false) {
        if (relative) sendCommand("G91")
        sendCommand("G1 Z$mm F1500")
        if (relative) sendCommand("G90")
    }

    fun disableSteppers() = sendCommand("M84")

    /**
     * Temperature commands (preheating).
     */
    fun preheatPLA() {
        sendCommand("M104 S200")
        sendCommand("M140 S60")
    }

    fun preheatPLAPlus() {
        sendCommand("M104 S210")
        sendCommand("M140 S70")
    }

    fun preheatPETG() {
        sendCommand("M104 S235")
        sendCommand("M140 S80")
    }

    fun preheatABS() {
        sendCommand("M104 S240")
        sendCommand("M140 S100")
    }

    fun preheatTPU() {
        sendCommand("M104 S220")
        sendCommand("M140 S50")
    }

    fun setNozzleTemp(celsius: Int) {
        sendCommand("M104 S$celsius")
    }

    fun setBedTemp(celsius: Int) {
        sendCommand("M140 S$celsius")
    }

    /**
     * Fan & speed commands.
     */
    fun setFanPercent(percent: Int) {
        val pwm = (percent * 255 / 100).coerceIn(0, 255)
        sendCommand("M106 S$pwm")
    }

    fun setFeedrate(percent: Int) {
        sendCommand("M220 S$percent")
    }

    fun setFlow(percent: Int) {
        sendCommand("M221 S$percent")
    }

    /**
     * Safety.
     */
    fun emergencyStop() = sendCommand("M112")

    /**
     * State observer.
     */
    fun addListener(listener: StateListener) {
        listeners.add(listener)
        // Immediately notify with current state
        listener.onStateChanged(state.get())
    }

    fun removeListener(listener: StateListener) {
        listeners.remove(listener)
    }

    /**
     * Polling loop — every 500ms send M105/M114, every 10s send M115.
     */
    private fun startPolling() {
        if (pollingJob?.isActive == true) return

        pollingJob = scope.launch {
            var count = 0
            while (isActive && usbManager.isConnected()) {
                try {
                    // Every iteration: M105 (temp), M114 (position)
                    sendCommand("M105")
                    delay(50)
                    sendCommand("M114")

                    // Every 20 iterations (10s): M115 (firmware)
                    if (count % 20 == 0) {
                        sendCommand("M115")
                    }

                    count++
                    delay(500)
                } catch (e: Exception) {
                    Log.e(TAG, "Polling error: ${e.message}")
                    break
                }
            }
        }
    }

    private fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }

    /**
     * Handle serial response from printer.
     */
    private fun handleResponse(line: String) {
        val currentState = state.get()
        var newState = currentState

        // Parse temperature
        MarlinParser.parseTemperature(line)?.let {
            newState = newState.copy(
                nozzleTemp = it.nozzleTemp,
                nozzleTarget = it.nozzleTarget,
                bedTemp = it.bedTemp,
                bedTarget = it.bedTarget
            )
        }

        // Parse position
        MarlinParser.parsePosition(line)?.let {
            newState = newState.copy(x = it.x, y = it.y, z = it.z)
        }

        // Parse firmware
        MarlinParser.parseFirmware(line)?.let {
            newState = newState.copy(firmware = it)
        }

        // Check busy status
        if (MarlinParser.isBusy(line)) {
            newState = newState.copy(busy = true, lastMessage = "Busy")
        } else if (MarlinParser.isOk(line)) {
            newState = newState.copy(busy = false)
        }

        // Always update lastMessage
        newState = newState.copy(lastMessage = line.take(50))

        updateState { newState }
    }

    private fun updateState(transform: (PrinterState) -> PrinterState) {
        val oldState = state.getAndUpdate(transform)
        val newState = state.get()

        if (oldState != newState) {
            listeners.forEach { it.onStateChanged(newState) }
        }
    }

    fun close() {
        scope.cancel()
        disconnect()
    }
}
