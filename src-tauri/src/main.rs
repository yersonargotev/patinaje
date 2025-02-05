mod audio;
mod db;
mod models;
mod services;

use audio::ThreadSafeAudioPlayer;
use db::Database;
use models::{Athlete, Evaluation};
use services::evaluation_service::EvaluationService;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Manager;
use tauri::State;

#[allow(dead_code)]
struct AudioState(Arc<ThreadSafeAudioPlayer>);
#[allow(dead_code)]
struct DbState(Arc<Database>);
#[allow(dead_code)]
struct ServiceState(Arc<EvaluationService>);

#[tauri::command]
async fn save_evaluation_data(
    athlete: Athlete,
    completed_periods: String,
    total_time: i32,
    status: String,
    state: State<'_, ServiceState>,
) -> Result<String, String> {
    let evaluation = Evaluation::new(
        None,
        0,
        completed_periods,
        total_time,
        status,
    );

    state.0.save_evaluation(athlete, evaluation)
        .await
        .map(|(athlete_id, eval_id)| {
            format!("Saved evaluation {} for athlete {}", eval_id, athlete_id)
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_athlete_evaluations(
    athlete_id: i64,
    state: State<'_, ServiceState>,
) -> Result<Vec<Evaluation>, String> {
    state.0.get_athlete_evaluations(athlete_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn play_sound(sound_type: String, state: State<'_, AudioState>) -> Result<(), String> {
    state.0.play_sound(&sound_type).map_err(|e| e.to_string())
}

#[tauri::command]
async fn stop_all_sounds(state: State<'_, AudioState>) -> Result<(), String> {
    state.0.stop_all().map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_all_evaluations(
    path: PathBuf,
    state: State<'_, ServiceState>,
) -> Result<String, String> {
    state.0.export_all_evaluations(path)
        .await
        .map(|_| "Evaluaciones exportadas exitosamente".to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_athlete_evaluations(
    athlete_id: i64,
    path: PathBuf,
    state: State<'_, ServiceState>,
) -> Result<String, String> {
    state.0.export_athlete_evaluations(athlete_id, path)
        .await
        .map(|_| "Evaluaciones del atleta exportadas exitosamente".to_string())
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            let audio_player = ThreadSafeAudioPlayer::new(app_handle.clone());
            let database = Arc::new(Database::new().expect("Failed to initialize database"));
            let evaluation_service = Arc::new(EvaluationService::new(database.clone()));

            app.manage(AudioState(Arc::new(audio_player)));
            app.manage(DbState(database));
            app.manage(ServiceState(evaluation_service));
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
