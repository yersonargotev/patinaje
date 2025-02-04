mod audio;
mod db;

use audio::ThreadSafeAudioPlayer;
use db::{Athlete, Database, Evaluation};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Manager;
use tauri::State;

struct AudioState(Arc<ThreadSafeAudioPlayer>);
struct DbState(Arc<Database>);

#[tauri::command]
async fn save_evaluation_data(
    athlete: Athlete,
    completed_periods: String,
    total_time: i32,
    status: String,
    db_state: State<'_, DbState>,
) -> Result<String, String> {
    let evaluation = Evaluation {
        id: None,
        athlete_id: 0, // Will be set by the database
        completed_periods,
        total_time,
        date: chrono::Local::now().to_rfc3339(),
        status,
    };

    match db_state.0.save_evaluation_data(&athlete, &evaluation) {
        Ok((athlete_id, eval_id)) => Ok(format!(
            "Saved evaluation {} for athlete {}",
            eval_id, athlete_id
        )),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn get_athlete_evaluations(
    athlete_id: i64,
    db_state: State<'_, DbState>,
) -> Result<Vec<Evaluation>, String> {
    db_state
        .0
        .get_athlete_evaluations(athlete_id)
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

#[tauri::command]
async fn export_all_evaluations(
    path: PathBuf,
    db_state: State<'_, DbState>,
) -> Result<String, String> {
    db_state
        .0
        .export_all_evaluations_to_csv(path)
        .map(|_| "Evaluaciones exportadas exitosamente".to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_athlete_evaluations(
    athlete_id: i64,
    path: PathBuf,
    db_state: State<'_, DbState>,
) -> Result<String, String> {
    db_state
        .0
        .export_athlete_evaluations_to_csv(athlete_id, path)
        .map(|_| "Evaluaciones del atleta exportadas exitosamente".to_string())
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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
            save_evaluation_data,
            get_athlete_evaluations,
            export_all_evaluations,
            export_athlete_evaluations
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
