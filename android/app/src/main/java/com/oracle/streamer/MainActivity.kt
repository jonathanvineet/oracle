package com.oracle.streamer

import android.Manifest
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.os.Bundle
import android.os.PowerManager
import android.view.View
import android.widget.SeekBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.oracle.streamer.databinding.ActivityMainBinding
import java.net.NetworkInterface

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraStreamer: CameraStreamer
    private lateinit var printerController: PrinterController
    private lateinit var wakeLock: PowerManager.WakeLock
    private var isStreaming = false

    companion object {
        private const val REQUEST_CAMERA = 100
        private const val REQUEST_USB = 101
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Keep screen on while streaming
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK, "oracle:streaming")

        cameraStreamer = CameraStreamer(this, binding.cameraPreview)

        // Initialize printer controller
        printerController = PrinterController(UsbSerialManager(this))
        setupPrinterUI()

        updateUI(streaming = false)
        detectAndShowIP()

        binding.btnToggle.setOnClickListener {
            if (isStreaming) stopStreaming() else requestCameraAndStart()
        }
    }

    private fun requestCameraAndStart() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED) {
            startStreaming()
        } else {
            ActivityCompat.requestPermissions(
                this, arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CAMERA &&
            grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
            startStreaming()
        } else {
            Toast.makeText(this, "Camera permission required", Toast.LENGTH_LONG).show()
        }
    }

    private fun startStreaming() {
        isStreaming = true
        if (!wakeLock.isHeld) wakeLock.acquire(60 * 60 * 1000L) // 1hr max
        cameraStreamer.start(
            onFrame = { fps ->
                runOnUiThread { binding.tvFps.text = "$fps FPS" }
            },
            onError = { msg ->
                runOnUiThread {
                    Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
                    stopStreaming()
                }
            }
        )
        updateUI(streaming = true)
    }

    private fun stopStreaming() {
        isStreaming = false
        if (wakeLock.isHeld) wakeLock.release()
        cameraStreamer.stop()
        updateUI(streaming = false)
    }

    private fun updateUI(streaming: Boolean) {
        if (streaming) {
            binding.btnToggle.text = "⏹ Stop"
            binding.btnToggle.setBackgroundColor(0xFFDC2626.toInt())
            binding.statusDot.setBackgroundResource(R.drawable.dot_green)
            binding.tvStatus.text = "STREAMING"
            binding.tvInstructions.visibility = View.GONE
        } else {
            binding.btnToggle.text = "▶ Start Streaming"
            binding.btnToggle.setBackgroundColor(0xFF06B6D4.toInt())
            binding.statusDot.setBackgroundResource(R.drawable.dot_red)
            binding.tvStatus.text = "IDLE"
            binding.tvFps.text = "— FPS"
            binding.tvInstructions.visibility = View.VISIBLE
        }
    }

    private fun detectAndShowIP() {
        val tailscaleIP = getTailscaleIP()
        val localIP = if (tailscaleIP != null) tailscaleIP else getLocalIP()
        val port = StreamConfig.PORT
        val isTailscale = tailscaleIP != null
        
        val displayText = if (isTailscale) {
            "🔗 Tailnet: http://$localIP:$port/stream"
        } else {
            "Local: http://$localIP:$port/stream"
        }
        
        binding.tvStreamUrl.text = displayText
        binding.tvStreamUrl.setOnClickListener {
            val clipboard = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val url = "http://$localIP:$port/stream"
            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("url", url))
            Toast.makeText(this, "URL copied!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun getTailscaleIP(): String? {
        try {
            NetworkInterface.getNetworkInterfaces()?.toList()?.forEach { iface ->
                // Tailscale typically uses tun interfaces on Android
                if (iface.name.contains("tun", ignoreCase = true)) {
                    iface.inetAddresses.toList().forEach { addr ->
                        val hostAddr = addr.hostAddress ?: return@forEach
                        // Tailscale IPs are in 100.64.0.0/10 range
                        if (hostAddr.startsWith("100.") && addr is java.net.Inet4Address) {
                            return hostAddr
                        }
                    }
                }
            }
        } catch (_: Exception) {}
        return null
    }

    private fun getLocalIP(): String {
        try {
            NetworkInterface.getNetworkInterfaces()?.toList()?.forEach { iface ->
                if (iface.isLoopback || !iface.isUp) return@forEach
                iface.inetAddresses.toList().forEach { addr ->
                    if (!addr.isLoopbackAddress && addr is java.net.Inet4Address) {
                        return addr.hostAddress ?: "?"
                    }
                }
            }
        } catch (_: Exception) {}
        return "?"
    }

    override fun onDestroy() {
        super.onDestroy()
        stopStreaming()
        printerController.close()
    }

    /**
     * Setup all printer console UI controls and listeners.
     */
    private fun setupPrinterUI() {
        // Connect button
        binding.btnConnectPrinter.setOnClickListener {
            printerController.connect { success, msg ->
                runOnUiThread {
                    if (success) {
                        Toast.makeText(this, "Printer connected", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }

        // Preheat buttons
        binding.btnPLA.setOnClickListener { printerController.preheatPLA() }
        binding.btnPLAPlus.setOnClickListener { printerController.preheatPLAPlus() }
        binding.btnPETG.setOnClickListener { printerController.preheatPETG() }
        binding.btnABS.setOnClickListener { printerController.preheatABS() }
        binding.btnTPU.setOnClickListener { printerController.preheatTPU() }

        // Motion controls
        binding.btnHomeAll.setOnClickListener { printerController.homeAll() }
        binding.btnXPlus.setOnClickListener { printerController.moveX(1f, relative = true) }
        binding.btnXMinus.setOnClickListener { printerController.moveX(-1f, relative = true) }
        binding.btnYPlus.setOnClickListener { printerController.moveY(1f, relative = true) }
        binding.btnYMinus.setOnClickListener { printerController.moveY(-1f, relative = true) }
        binding.btnZPlus.setOnClickListener { printerController.moveZ(1f, relative = true) }
        binding.btnZMinus.setOnClickListener { printerController.moveZ(-1f, relative = true) }
        binding.btnDisableSteppers.setOnClickListener { printerController.disableSteppers() }
        binding.btnEmergencyStop.setOnClickListener { printerController.emergencyStop() }

        // Sliders
        binding.sliderFan.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar, progress: Int, fromUser: Boolean) {
                if (fromUser) printerController.setFanPercent(progress)
                binding.tvFanValue.text = "$progress%"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar) {}
            override fun onStopTrackingTouch(seekBar: SeekBar) {}
        })

        binding.sliderFeedrate.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar, progress: Int, fromUser: Boolean) {
                if (fromUser) printerController.setFeedrate(progress)
                binding.tvFeedrateValue.text = "$progress%"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar) {}
            override fun onStopTrackingTouch(seekBar: SeekBar) {}
        })

        binding.sliderFlow.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar, progress: Int, fromUser: Boolean) {
                if (fromUser) printerController.setFlow(progress)
                binding.tvFlowValue.text = "$progress%"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar) {}
            override fun onStopTrackingTouch(seekBar: SeekBar) {}
        })

        // Listen to state changes
        printerController.addListener(object : PrinterController.StateListener {
            override fun onStateChanged(newState: PrinterState) {
                runOnUiThread { updatePrinterUI(newState) }
            }
        })
    }

    /**
     * Update printer UI with current state.
     */
    private fun updatePrinterUI(state: PrinterState) {
        // Connection status
        if (state.connected) {
            binding.printerStatusDot.setBackgroundResource(R.drawable.dot_green)
            binding.tvPrinterStatus.text = "Connected"
            binding.tvPrinterStatus.setTextColor(0xFF34D399.toInt())
            binding.btnConnectPrinter.text = "✓ Connected"
        } else {
            binding.printerStatusDot.setBackgroundResource(R.drawable.dot_red)
            binding.tvPrinterStatus.text = "Disconnected"
            binding.tvPrinterStatus.setTextColor(0xFFF87171.toInt())
            binding.btnConnectPrinter.text = "⚡ Connect Printer"
        }

        // Firmware
        if (state.firmware.isNotEmpty()) {
            binding.tvFirmware.text = state.firmware.take(30)
        }

        // Temperatures
        binding.tvNozzleTemp.text = String.format("%.0f°C", state.nozzleTemp)
        binding.tvNozzleTarget.text = String.format("→%.0f", state.nozzleTarget)
        binding.tvBedTemp.text = String.format("%.0f°C", state.bedTemp)
        binding.tvBedTarget.text = String.format("→%.0f", state.bedTarget)

        // Position
        binding.tvPositionX.text = String.format("%.2f", state.x)
        binding.tvPositionY.text = String.format("%.2f", state.y)
        binding.tvPositionZ.text = String.format("%.2f", state.z)

        // Status
        binding.tvLastMessage.text = state.lastMessage
    }

}
