use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct Athlete {
    pub id: Option<i64>,
    pub name: String,
    pub age: i32,
    pub weight: f32,
    pub height: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Evaluation {
    pub id: Option<i64>,
    pub athlete_id: i64,
    pub completed_periods: String, // JSON array as string
    pub total_time: i32,          // in seconds
    pub date: String,             // ISO date string
}

pub struct Database {
    pub connection: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self> {
        let conn = Connection::open("patinaje.db")?;
        
        // Create tables if they don't exist
        conn.execute(
            "CREATE TABLE IF NOT EXISTS athletes (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                weight REAL NOT NULL,
                height REAL NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS evaluations (
                id INTEGER PRIMARY KEY,
                athlete_id INTEGER NOT NULL,
                completed_periods TEXT NOT NULL,
                total_time INTEGER NOT NULL,
                date TEXT NOT NULL,
                FOREIGN KEY (athlete_id) REFERENCES athletes (id)
            )",
            [],
        )?;

        Ok(Database {
            connection: Mutex::new(conn),
        })
    }

    pub fn save_athlete(&self, athlete: &Athlete) -> Result<i64> {
        let conn = self.connection.lock().unwrap();
        conn.execute(
            "INSERT INTO athletes (name, age, weight, height) VALUES (?1, ?2, ?3, ?4)",
            [
                &athlete.name,
                &athlete.age.to_string(),
                &athlete.weight.to_string(),
                &athlete.height.to_string(),
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn save_evaluation(&self, evaluation: &Evaluation) -> Result<i64> {
        let conn = self.connection.lock().unwrap();
        conn.execute(
            "INSERT INTO evaluations (athlete_id, completed_periods, total_time, date) 
             VALUES (?1, ?2, ?3, ?4)",
            [
                &evaluation.athlete_id.to_string(),
                &evaluation.completed_periods,
                &evaluation.total_time.to_string(),
                &evaluation.date,
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }
}