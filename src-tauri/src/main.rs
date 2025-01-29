mod audio;
mod db;

use audio::ThreadSafeAudioPlayer;
use db::{Athlete, Database, Evaluation};
use std::sync::Arc;
use tauri::State;
use tauri::Manager;

struct AudioState(Arc<ThreadSafeAudioPlayer>);
struct DbState(Arc<Database>);


#[tauri::command]
async fn save_evaluation_data(
    athlete: Athlete,
    completed_periods: String,
    total_time: i32,
    db_state: State<'_, DbState>,
) -> Result<i64, String> {
    // Save athlete first
    let athlete_id = db_state
        .0
        .save_athlete(&athlete)
        .map_err(|e| e.to_string())?;

    // Create and save evaluation
    let evaluation = Evaluation {
        id: None,
        athlete_id,
        completed_periods,
        total_time,
        date: chrono::Local::now().to_rfc3339(),
    };

    db_state
        .0
        .save_evaluation(&evaluation)
        .map_err(|e| e.to_string())
}

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
            let database = Database::new().expect("Failed to initialize database");
            
            app.manage(AudioState(Arc::new(audio_player)));
            app.manage(DbState(Arc::new(database)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            play_sound,
            stop_all_sounds,
            save_evaluation_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}