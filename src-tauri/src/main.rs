mod audio;

use audio::AudioPlayer;
use std::sync::Arc;
use tauri::State;

struct AudioState(Arc<AudioPlayer>);

#[tauri::command]
async fn play_sound(sound_type: String, state: State<'_, AudioState>) -> Result<(), String> {
    state.0.play_sound(&sound_type).map_err(|e| e.to_string())
}

#[tauri::command]
async fn stop_all_sounds(state: State<'_, AudioState>) -> Result<(), String> {
    state.0.stop_all().map_err(|e| e.to_string())
}

fn main() {
    let audio_player = AudioPlayer::new().expect("Failed to initialize audio player");
    let audio_state = AudioState(Arc::new(audio_player));

    tauri::Builder::default()
        .manage(audio_state)
        .invoke_handler(tauri::generate_handler![play_sound, stop_all_sounds])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}