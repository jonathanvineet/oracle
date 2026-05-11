package com.oracle.streamer

import android.util.Log
import kotlinx.coroutines.*
import java.io.BufferedOutputStream
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Embedded MJPEG HTTP server.
 *
 * Serves multipart/x-mixed-replace — the standard MJPEG format.
 * Any browser, <img> tag, VLC, ffplay, or QuickTime can consume it directly.
 *
 * No base64. No JSON. No WebSocket. Raw JPEG bytes over a persistent TCP connection.
 *
 * Usage:
 *   val server = MjpegServer()
 *   server.start()
 *   server.pushFrame(jpegByteArray)   // call from CameraX analyzer
 *   server.stop()
 *
 * Stream URL: http://PHONE_IP:8080/stream
 */
class MjpegServer {

    private val TAG = "MjpegServer"
    private val clients = CopyOnWriteArrayList<ClientConnection>()
    private var serverJob: Job? = null
    private var serverSocket: ServerSocket? = null

    data class ClientConnection(
        val socket: Socket,
        val out: BufferedOutputStream
    )

    fun start() {
        serverJob = CoroutineScope(Dispatchers.IO).launch {
            try {
                val ss = ServerSocket(StreamConfig.PORT)
                serverSocket = ss
                Log.i(TAG, "MJPEG server listening on :${StreamConfig.PORT}")

                while (isActive) {
                    val socket = try {
                        ss.accept()
                    } catch (e: Exception) {
                        break
                    }
                    launch { handleClient(socket) }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Server error: ${e.message}")
            }
        }
    }

    private suspend fun handleClient(socket: Socket) = withContext(Dispatchers.IO) {
        val remoteAddr = socket.remoteSocketAddress
        Log.i(TAG, "Client connected: $remoteAddr")

        try {
            socket.tcpNoDelay = true
            val input = socket.getInputStream().bufferedReader()
            val out = BufferedOutputStream(socket.getOutputStream(), 256 * 1024)

            // Read HTTP request line (we only need the path)
            val requestLine = input.readLine() ?: return@withContext
            Log.d(TAG, "Request: $requestLine")

            when {
                requestLine.startsWith("GET /stream") -> {
                    // Send MJPEG stream headers
                    val header = buildString {
                        append("HTTP/1.1 200 OK\r\n")
                        append("Content-Type: multipart/x-mixed-replace;boundary=${StreamConfig.BOUNDARY}\r\n")
                        append("Cache-Control: no-cache, no-store\r\n")
                        append("Connection: close\r\n")
                        append("Access-Control-Allow-Origin: *\r\n")
                        append("\r\n")
                    }
                    out.write(header.toByteArray())
                    out.flush()

                    val client = ClientConnection(socket, out)
                    clients.add(client)

                    // Keep connection alive until client disconnects or we stop
                    try {
                        while (!socket.isClosed && isActive) {
                            delay(500)
                        }
                    } finally {
                        clients.remove(client)
                        Log.i(TAG, "Client disconnected: $remoteAddr (${clients.size} remaining)")
                    }
                }

                requestLine.startsWith("GET /") -> {
                    // Status page — useful for debugging
                    val body = """
                        <!DOCTYPE html>
                        <html>
                        <head><title>Oracle Stream</title>
                        <style>body{background:#0f1724;color:#fff;font-family:monospace;padding:40px}
                        a{color:#06b6d4}img{max-width:100%;border-radius:8px;margin-top:20px}</style></head>
                        <body>
                        <h2>🎬 Oracle MJPEG Stream</h2>
                        <p>Clients connected: <strong>${clients.size}</strong></p>
                        <p>Stream URL: <a href="/stream">/stream</a></p>
                        <img src="/stream" alt="Live stream" />
                        </body></html>
                    """.trimIndent().toByteArray()

                    val response = buildString {
                        append("HTTP/1.1 200 OK\r\n")
                        append("Content-Type: text/html\r\n")
                        append("Content-Length: ${body.size}\r\n")
                        append("Connection: close\r\n")
                        append("\r\n")
                    }
                    out.write(response.toByteArray())
                    out.write(body)
                    out.flush()
                }

                else -> {
                    val response = "HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n"
                    out.write(response.toByteArray())
                    out.flush()
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "Client error ($remoteAddr): ${e.message}")
        } finally {
            try { socket.close() } catch (_: Exception) {}
        }
    }

    /**
     * Push a JPEG frame to all connected clients.
     * Called from CameraX ImageAnalysis analyzer on every frame.
     * Thread-safe via CopyOnWriteArrayList.
     */
    fun pushFrame(jpegBytes: ByteArray) {
        if (clients.isEmpty()) return

        // Build MJPEG frame wrapper
        val header = buildString {
            append("--${StreamConfig.BOUNDARY}\r\n")
            append("Content-Type: image/jpeg\r\n")
            append("Content-Length: ${jpegBytes.size}\r\n")
            append("\r\n")
        }.toByteArray()

        val tail = "\r\n".toByteArray()

        val deadClients = mutableListOf<ClientConnection>()
        clients.forEach { client ->
            try {
                synchronized(client.out) {
                    client.out.write(header)
                    client.out.write(jpegBytes)
                    client.out.write(tail)
                    client.out.flush()
                }
            } catch (e: Exception) {
                deadClients.add(client)
            }
        }

        // Clean up broken connections
        deadClients.forEach { dead ->
            clients.remove(dead)
            try { dead.socket.close() } catch (_: Exception) {}
        }
    }

    fun stop() {
        serverJob?.cancel()
        clients.forEach { try { it.socket.close() } catch (_: Exception) {} }
        clients.clear()
        try { serverSocket?.close() } catch (_: Exception) {}
        Log.i(TAG, "MJPEG server stopped")
    }

    val clientCount: Int get() = clients.size
}
