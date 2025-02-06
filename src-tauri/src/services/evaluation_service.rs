use std::path::PathBuf;
use std::sync::Arc;
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
        status: String,
    ) -> Result<(i64, i64, i64), String> {
        let template = EvaluationTemplate {
            id: None,
            completed_periods,
            total_time,
            date: chrono::Local::now().to_rfc3339(),
            total_distance: 0.0,
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
} 