use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::State;
use tokio::net::TcpStream;
use tokio_tungstenite::{connect_async, WebSocketStream};
use futures::{SinkExt, StreamExt};

// Shared state for WebSocket connection
pub struct AppState {
    ws: Arc<Mutex<Option<WebSocketStream<TcpStream>>>>,
    connected: Arc<Mutex<bool>>,
    last_frame: Arc<Mutex<Option<String>>>,
}

impl AppState {
    fn new() -> Self {
        AppState {
            ws: Arc::new(Mutex::new(None)),
            connected: Arc::new(Mutex::new(false)),
            last_frame: Arc::new(Mutex::new(None)),
        }
    }
}

// Connect to WebSocket server on Android
#[tauri::command]
pub async fn connect_to_stream(url: String, state: State<'_, AppState>) -> Result<String, String> {
    let ws_url = format!("ws://{}/", url.trim_start_matches("ws://"));
    
    match connect_async(&ws_url).await {
        Ok((ws_stream, _)) => {
            *state.ws.lock().unwrap() = Some(ws_stream);
            *state.connected.lock().unwrap() = true;
            
            // Start listening for frames
            let ws_clone = state.ws.clone();
            let last_frame_clone = state.last_frame.clone();
            
            thread::spawn(move || {
                tokio::runtime::Runtime::new().unwrap().block_on(async {
                    if let Some(mut ws) = ws_clone.lock().unwrap().take() {
                        while let Some(msg) = ws.next().await {
                            match msg {
                                Ok(tokio_tungstenite::tungstenite::Message::Text(frame_data)) => {
                                    *last_frame_clone.lock().unwrap() = Some(frame_data);
                                }
                                Ok(tokio_tungstenite::tungstenite::Message::Binary(data)) => {
                                    let base64_frame = format!("data:image/jpeg;base64,{}", 
                                        base64::encode(&data));
                                    *last_frame_clone.lock().unwrap() = Some(base64_frame);
                                }
                                Err(_) => break,
                                _ => {}
                            }
                        }
                    }
                });
            });
            
            Ok("Connected to stream".to_string())
        }
        Err(e) => Err(format!("Failed to connect: {}", e))
    }
}

// Get the latest frame
#[tauri::command]
pub fn get_latest_frame(state: State<AppState>) -> Option<String> {
    state.last_frame.lock().unwrap().clone()
}

// Check connection status
#[tauri::command]
pub fn is_connected(state: State<AppState>) -> bool {
    *state.connected.lock().unwrap()
}

// Disconnect from stream
#[tauri::command]
pub fn disconnect_from_stream(state: State<AppState>) {
    *state.ws.lock().unwrap() = None;
    *state.connected.lock().unwrap() = false;
}
