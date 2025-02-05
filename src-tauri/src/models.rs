use serde::{Deserialize, Serialize};
use chrono::prelude::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Athlete {
    pub id: Option<i64>,
    pub name: String,
    pub age: i32,
    pub weight: f32,
    pub height: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Evaluation {
    pub id: Option<i64>,
    pub athlete_id: i64,
    pub completed_periods: String,
    pub total_time: i32,
    pub date: String,
    pub status: String,
}

impl Evaluation {
    pub fn new(
        id: Option<i64>,
        athlete_id: i64,
        completed_periods: String,
        total_time: i32,
        status: String,
    ) -> Self {
        Self {
            id,
            athlete_id,
            completed_periods,
            total_time,
            date: Local::now().to_rfc3339(),
            status,
        }
    }
} 