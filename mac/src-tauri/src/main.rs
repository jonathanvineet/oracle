// Oracle — macOS Tauri app
// Lightweight always-on-top window that displays an MJPEG stream from the Android app.
// No Electron. No Node runtime. ~40MB memory footprint.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();

            // Always on top — acts like a floating widget
            window.set_always_on_top(true).ok();

            // Start at a reasonable size for a camera preview
            window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                width: 380.0,
                height: 320.0,
            })).ok();

            // Position: top-right corner (will be overridden by user dragging)
            if let Ok(monitor) = window.current_monitor() {
                if let Some(monitor) = monitor {
                    let screen = monitor.size();
                    let scale  = monitor.scale_factor();
                    let w = 380.0 * scale;
                    let h = 320.0 * scale;
                    let x = screen.width as f64 - w - 20.0 * scale;
                    let y = 40.0 * scale;
                    window.set_position(tauri::Position::Physical(
                        tauri::PhysicalPosition { x: x as i32, y: y as i32 }
                    )).ok();
                }
            }

            // Allow window to be dragged by its background area
            window.set_decorations(false).ok();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run Oracle");
}
