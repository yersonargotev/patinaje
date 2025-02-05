use std::path::PathBuf;
use std::sync::Arc;
use crate::db::{self, Database};
use crate::models::{Athlete, Evaluation};

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
        }
    }
}

impl From<Evaluation> for db::Evaluation {
    fn from(eval: Evaluation) -> Self {
        db::Evaluation {
            id: eval.id,
            athlete_id: eval.athlete_id,
            completed_periods: eval.completed_periods,
            total_time: eval.total_time,
            date: eval.date,
            status: eval.status,
        }
    }
}

impl From<db::Evaluation> for Evaluation {
    fn from(eval: db::Evaluation) -> Self {
        Evaluation {
            id: eval.id,
            athlete_id: eval.athlete_id,
            completed_periods: eval.completed_periods,
            total_time: eval.total_time,
            date: eval.date,
            status: eval.status,
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
        evaluation: Evaluation,
    ) -> Result<(i64, i64), String> {
        self.db.save_evaluation_data(&athlete.into(), &evaluation.into())
            .map_err(|e| e.to_string())
    }

    pub async fn get_athlete_evaluations(
        &self,
        athlete_id: i64,
    ) -> Result<Vec<Evaluation>, String> {
        self.db.get_athlete_evaluations(athlete_id)
            .map(|evals| evals.into_iter().map(Into::into).collect())
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
} 