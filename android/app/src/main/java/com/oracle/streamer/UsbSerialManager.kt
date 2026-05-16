package com.oracle.streamer

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbManager
import android.util.Log
import com.hoho.android.usbserial.driver.UsbSerialDriver
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Low-level USB serial communication manager.
 * Handles connection, reading, writing, and permission requests.
 */
class UsbSerialManager(private val context: Context) {
    private val TAG = "UsbSerialManager"
    private var port: UsbSerialPort? = null
    private var connection: UsbDeviceConnection? = null

    private val listeners = CopyOnWriteArrayList<SerialListener>()

    companion object {
        const val ACTION_USB_PERMISSION = "com.oracle.streamer.USB_PERMISSION"
    }

    interface SerialListener {
        fun onLineReceived(line: String)
        fun onConnectionChanged(connected: Boolean)
        fun onError(message: String)
    }

    /**
     * Find and connect to the first available 3D printer (USB serial).
     * Requires USB permission to be granted.
     */
    fun connect(onResult: (success: Boolean, message: String) -> Unit) {
        try {
            val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
            val drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager)

            if (drivers.isEmpty()) {
                onResult(false, "No USB printer found")
                listeners.forEach { it.onError("No USB devices found") }
                return
            }

            val driver = drivers[0]
            val device = driver.device

            if (!usbManager.hasPermission(device)) {
                val permissionIntent = PendingIntent.getBroadcast(
                    context,
                    0,
                    Intent(ACTION_USB_PERMISSION),
                    PendingIntent.FLAG_IMMUTABLE
                )
                usbManager.requestPermission(device, permissionIntent)
                onResult(false, "Requesting USB permission...")
                return
            }

            val conn = usbManager.openDevice(device)
                ?: throw Exception("Cannot open USB device")

            port = driver.ports[0]
            connection = conn

            port?.open(conn)
            port?.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)

            Log.i(TAG, "Connected to printer: ${device.manufacturerName} ${device.productName}")
            listeners.forEach { it.onConnectionChanged(true) }
            onResult(true, "Connected")
        } catch (e: Exception) {
            Log.e(TAG, "Connection error: ${e.message}")
            listeners.forEach { it.onError("Connection failed: ${e.message}") }
            onResult(false, e.message ?: "Unknown error")
        }
    }

    /**
     * Disconnect from USB device.
     */
    fun disconnect() {
        try {
            port?.close()
            connection?.close()
            port = null
            connection = null
            Log.i(TAG, "Disconnected")
            listeners.forEach { it.onConnectionChanged(false) }
        } catch (e: Exception) {
            Log.e(TAG, "Disconnect error: ${e.message}")
        }
    }

    /**
     * Check if connected.
     */
    fun isConnected(): Boolean {
        return port != null && connection != null
    }

    /**
     * Send a command (G-code) to the printer.
     * Automatically appends newline.
     */
    fun sendCommand(command: String) {
        if (port == null || connection == null) {
            listeners.forEach { it.onError("Not connected") }
            return
        }

        try {
            val cmd = "$command\n".toByteArray()
            port?.write(cmd, 1000) // 1 second timeout
            Log.d(TAG, "Sent: $command")
        } catch (e: Exception) {
            Log.e(TAG, "Send error: ${e.message}")
            listeners.forEach { it.onError("Send failed: ${e.message}") }
        }
    }

    /**
     * Read serial data in a background loop.
     * Call in a separate coroutine.
     */
    fun readLoop() {
        if (port == null) return

        try {
            val buffer = ByteArray(4096)
            val sb = StringBuilder()

            while (port != null && connection != null) {
                try {
                    val numBytes = port?.read(buffer, 100) ?: 0
                    if (numBytes > 0) {
                        val data = buffer.copyOf(numBytes).toString(Charsets.UTF_8)
                        sb.append(data)

                        // Process complete lines
                        val lines = sb.toString().split("\n")
                        for (i in 0 until lines.size - 1) {
                            val line = lines[i].trim()
                            if (line.isNotEmpty()) {
                                Log.d(TAG, "Received: $line")
                                listeners.forEach { it.onLineReceived(line) }
                            }
                        }
                        sb.clear()
                        if (lines.last().isNotEmpty()) {
                            sb.append(lines.last())
                        }
                    }
                } catch (e: Exception) {
                    if (port != null) {
                        Log.e(TAG, "Read error: ${e.message}")
                        listeners.forEach { it.onError("Read failed: ${e.message}") }
                    }
                    break
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Read loop error: ${e.message}")
        }
    }

    fun addListener(listener: SerialListener) {
        listeners.add(listener)
    }

    fun removeListener(listener: SerialListener) {
        listeners.remove(listener)
    }
}
