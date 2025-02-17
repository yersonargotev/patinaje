use serde::{Deserialize, Serialize};
use chrono::prelude::*;
use crate::db;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Athlete {
    pub id: Option<i64>,
    pub name: String,
    pub age: i32,
    pub weight: f32,
    pub height: f32,
    pub observations: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EvaluationTemplate {
    pub id: Option<i64>,
    pub completed_periods: String,
    pub total_time: i32,
    pub date: String,
    pub total_distance: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AthleteEvaluation {
    pub id: Option<i64>,
    pub athlete_id: i64,
    pub template_id: i64,
    pub status: String,
    pub date: String,
}

impl AthleteEvaluation {
    pub fn new(
        id: Option<i64>,
        athlete_id: i64,
        template_id: i64,
        status: String,
    ) -> Self {
        Self {
            id,
            athlete_id,
            template_id,
            status,
            date: Local::now().to_rfc3339(),
        }
    }
}

impl From<db::Athlete> for Athlete {
    fn from(athlete: db::Athlete) -> Self {
        Self {
            id: athlete.id,
            name: athlete.name,
            age: athlete.age,
            weight: athlete.weight,
            height: athlete.height,
            observations: athlete.observations,
        }
    }
}

impl From<db::EvaluationTemplate> for EvaluationTemplate {
    fn from(template: db::EvaluationTemplate) -> Self {
        Self {
            id: template.id,
            completed_periods: template.completed_periods,
            total_time: template.total_time,
            date: template.date,
            total_distance: template.total_distance,
        }
    }
}

impl From<db::AthleteEvaluation> for AthleteEvaluation {
    fn from(eval: db::AthleteEvaluation) -> Self {
        Self {
            id: eval.id,
            athlete_id: eval.athlete_id,
            template_id: eval.template_id,
            status: eval.status,
            date: eval.date,
        }
    }
} 