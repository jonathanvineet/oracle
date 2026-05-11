// Prevents additional console window on Windows in release builds
#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

mod lib;
use lib::{AppState, connect_to_stream, get_latest_frame, is_connected, disconnect_from_stream};

fn main() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            connect_to_stream,
            get_latest_frame,
            is_connected,
            disconnect_from_stream
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
