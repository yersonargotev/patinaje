mod audio;

use audio::ThreadSafeAudioPlayer;
use std::sync::Arc;
use tauri::State;
use tauri::Manager;

struct AudioState(Arc<ThreadSafeAudioPlayer>);

#[tauri::command]
async fn play_sound(sound_type: String, state: State<'_, AudioState>) -> Result<(), String> {
    println!("Command received to play sound: {}", sound_type);
    state.0.play_sound(&sound_type).map_err(|e| e.to_string())
}

#[tauri::command]
async fn stop_all_sounds(state: State<'_, AudioState>) -> Result<(), String> {
    state.0.stop_all().map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            let audio_player = ThreadSafeAudioPlayer::new(app_handle);
            app.manage(AudioState(Arc::new(audio_player)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![play_sound, stop_all_sounds])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}