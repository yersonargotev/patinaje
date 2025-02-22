use std::path::PathBuf;
use std::sync::Arc;
use rusqlite::params;
use crate::db::{self, Database};
use crate::models::{Athlete, AthleteEvaluation, EvaluationTemplate};

pub struct EvaluationService {
    db: Arc<Database>,
}

impl From<Athlete> for db::Athlete {
    fn from(athlete: Athlete) -> Self {
        db::Athlete {
            id: athlete.id,
            name: athlete.name,
            age: athlete.age,
            weight: athlete.weight,
            height: athlete.height,
            observations: athlete.observations,
        }
    }
}

impl From<EvaluationTemplate> for db::EvaluationTemplate {
    fn from(template: EvaluationTemplate) -> Self {
        db::EvaluationTemplate {
            id: template.id,
            completed_periods: template.completed_periods,
            total_time: template.total_time,
            date: template.date,
            total_distance: template.total_distance,
        }
    }
}

impl From<AthleteEvaluation> for db::AthleteEvaluation {
    fn from(eval: AthleteEvaluation) -> Self {
        db::AthleteEvaluation {
            id: eval.id,
            athlete_id: eval.athlete_id,
            template_id: eval.template_id,
            status: eval.status,
            date: eval.date,
        }
    }
}

impl EvaluationService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub async fn save_evaluation(
        &self,
        athlete: Athlete,
        completed_periods: String,
        total_time: i32,
        total_distance: f32,
        status: String,
    ) -> Result<(i64, i64, i64), String> {
        let current_date = chrono::Local::now().to_rfc3339();
        let template = EvaluationTemplate {
            id: None,
            completed_periods,
            total_time,
            date: current_date.clone(),
            total_distance,
        };

        let athlete_evaluation = AthleteEvaluation::new(
            None,
            0, // Will be set by the database
            0, // Will be set by the database
            status,
        );

        self.db.save_evaluation_data(&athlete.into(), &template.into(), &athlete_evaluation.into())
            .map_err(|e| e.to_string())
    }

    pub async fn get_athlete_evaluations(
        &self,
        athlete_id: i64,
    ) -> Result<Vec<(AthleteEvaluation, EvaluationTemplate)>, String> {
        self.db.get_athlete_evaluations(athlete_id)
            .map(|evals| evals.into_iter().map(|(eval, template)| (eval.into(), template.into())).collect())
            .map_err(|e| e.to_string())
    }

    pub async fn export_all_evaluations(
        &self,
        path: PathBuf,
    ) -> Result<(), String> {
        self.db.export_all_evaluations_to_csv(path)
            .map_err(|e| e.to_string())
    }

    pub async fn export_athlete_evaluations(
        &self,
        athlete_id: i64,
        path: PathBuf,
    ) -> Result<(), String> {
        self.db.export_athlete_evaluations_to_csv(athlete_id, path)
            .map_err(|e| e.to_string())
    }

    pub async fn get_all_evaluations(&self) -> Result<Vec<(AthleteEvaluation, EvaluationTemplate, Athlete)>, String> {
        self.db.get_all_evaluations()
            .map(|evals| evals.into_iter().map(|(eval, template, athlete)| 
                (eval.into(), template.into(), athlete.into())).collect())
            .map_err(|e| e.to_string())
    }

    pub async fn update_evaluation_observations(
        &self,
        evaluation_id: i64,
        observations: String,
    ) -> Result<(), String> {
        self.db.update_evaluation_observations(evaluation_id, observations)
            .map_err(|e| e.to_string())
    }

    pub async fn export_all_evaluations_to_xlsx(
        &self,
        path: PathBuf,
    ) -> Result<(), String> {
        self.db.export_all_evaluations_to_xlsx(path)
            .map_err(|e| e.to_string())
    }

    pub async fn export_athlete_evaluations_to_xlsx(
        &self,
        athlete_id: i64,
        path: PathBuf,
    ) -> Result<(), String> {
        self.db.export_athlete_evaluations_to_xlsx(athlete_id, path)
            .map_err(|e| e.to_string())
    }

    pub async fn save_batch_evaluations(
    &self,
    evaluations: Vec<(Athlete, String, i32, f32, String)>,
) -> Result<Vec<(i64, i64, i64)>, String> {
    let current_date = chrono::Local::now().to_rfc3339();
    let mut conn = self.db.connection.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let mut results = Vec::with_capacity(evaluations.len());

    for (athlete, completed_periods, total_time, total_distance, status) in evaluations {
        // Validate athlete data
        if athlete.age <= 0 || athlete.age >= 150 {
            tx.rollback().map_err(|e| e.to_string())?;
            return Err("Invalid age".to_string());
        }
        if athlete.weight <= 0.0 || athlete.height <= 0.0 {
            tx.rollback().map_err(|e| e.to_string())?;
            return Err("Invalid weight or height".to_string());
        }

        // Insert athlete
        tx.execute(
            "INSERT INTO athletes (name, age, weight, height, observations) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                athlete.name,
                athlete.age,
                athlete.weight,
                athlete.height,
                athlete.observations,
            ],
        ).map_err(|e| e.to_string())?;
        let athlete_id = tx.last_insert_rowid();

        // Insert template
        tx.execute(
            "INSERT INTO evaluation_templates (completed_periods, total_time, date, total_distance) VALUES (?1, ?2, ?3, ?4)",
            params![
                completed_periods,
                total_time,
                current_date,
                total_distance,
            ],
        ).map_err(|e| e.to_string())?;
        let template_id = tx.last_insert_rowid();

        // Insert evaluation
        tx.execute(
            "INSERT INTO athlete_evaluations (athlete_id, template_id, status, date) VALUES (?1, ?2, ?3, ?4)",
            params![athlete_id, template_id, status, current_date],
        ).map_err(|e| e.to_string())?;
        let eval_id = tx.last_insert_rowid();

        results.push((athlete_id, template_id, eval_id));
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(results)
}
} 