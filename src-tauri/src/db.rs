use chrono::NaiveDateTime;
use csv::Writer;
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;

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
                age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
                weight REAL NOT NULL CHECK (weight > 0),
                height REAL NOT NULL CHECK (height > 0)
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
                status TEXT NOT NULL CHECK (status IN ('completed', 'cancelled')),
                FOREIGN KEY (athlete_id) REFERENCES athletes (id)
            )",
            [],
        )?;

        Ok(Database {
            connection: Mutex::new(conn),
        })
    }

    pub fn save_evaluation_data(
        &self,
        athlete: &Athlete,
        evaluation: &Evaluation,
    ) -> Result<(i64, i64)> {
        let mut conn = self.connection.lock().unwrap();
        let tx = conn.transaction()?;

        // Save athlete
        tx.execute(
            "INSERT INTO athletes (name, age, weight, height) VALUES (?1, ?2, ?3, ?4)",
            [
                &athlete.name,
                &athlete.age.to_string(),
                &athlete.weight.to_string(),
                &athlete.height.to_string(),
            ],
        )?;

        let athlete_id = tx.last_insert_rowid();

        // Validate date format
        if NaiveDateTime::parse_from_str(&evaluation.date, "%Y-%m-%dT%H:%M:%S%.f%z").is_err() {
            return Err(rusqlite::Error::InvalidParameterName(
                "Invalid date format".into(),
            ));
        }

        // Save evaluation with the new athlete_id
        tx.execute(
            "INSERT INTO evaluations (athlete_id, completed_periods, total_time, date, status) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            [
                &athlete_id.to_string(),
                &evaluation.completed_periods,
                &evaluation.total_time.to_string(),
                &evaluation.date,
                &evaluation.status,
            ],
        )?;

        let eval_id = tx.last_insert_rowid();

        // Commit the transaction
        tx.commit()?;

        Ok((athlete_id, eval_id))
    }

    pub fn get_athlete_evaluations(&self, athlete_id: i64) -> Result<Vec<Evaluation>> {
        let conn = self.connection.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, athlete_id, completed_periods, total_time, date, status 
             FROM evaluations 
             WHERE athlete_id = ?1 
             ORDER BY date DESC",
        )?;

        let evals = stmt.query_map([athlete_id], |row| {
            Ok(Evaluation {
                id: Some(row.get(0)?),
                athlete_id: row.get(1)?,
                completed_periods: row.get(2)?,
                total_time: row.get(3)?,
                date: row.get(4)?,
                status: row.get(5)?,
            })
        })?;

        evals.collect()
    }

    pub fn export_all_evaluations_to_csv<P: AsRef<Path>>(
        &self,
        path: P,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.connection.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT e.id, e.athlete_id, a.name, e.completed_periods, e.total_time, e.date, e.status 
             FROM evaluations e 
             JOIN athletes a ON e.athlete_id = a.id 
             ORDER BY e.date DESC"
        )?;

        let mut wtr = Writer::from_path(path)?;
        wtr.write_record(&[
            "ID",
            "Atleta ID",
            "Nombre del Atleta",
            "Periodos Completados",
            "Tiempo Total (s)",
            "Fecha",
            "Estado",
        ])?;

        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, i32>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
            ))
        })?;

        for row in rows {
            let (id, athlete_id, name, periods, time, date, status) = row?;
            wtr.write_record(&[
                id.to_string(),
                athlete_id.to_string(),
                name,
                periods,
                time.to_string(),
                date,
                status,
            ])?;
        }

        wtr.flush()?;
        Ok(())
    }

    pub fn export_athlete_evaluations_to_csv<P: AsRef<Path>>(
        &self,
        athlete_id: i64,
        path: P,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.connection.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT e.id, e.athlete_id, a.name, e.completed_periods, e.total_time, e.date, e.status 
             FROM evaluations e 
             JOIN athletes a ON e.athlete_id = a.id 
             WHERE e.athlete_id = ?1
             ORDER BY e.date DESC"
        )?;

        let mut wtr = Writer::from_path(path)?;
        wtr.write_record(&[
            "ID",
            "Atleta ID",
            "Nombre del Atleta",
            "Periodos Completados",
            "Tiempo Total (s)",
            "Fecha",
            "Estado",
        ])?;

        let rows = stmt.query_map([athlete_id], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, i32>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
            ))
        })?;

        for row in rows {
            let (id, athlete_id, name, periods, time, date, status) = row?;
            wtr.write_record(&[
                id.to_string(),
                athlete_id.to_string(),
                name,
                periods,
                time.to_string(),
                date,
                status,
            ])?;
        }

        wtr.flush()?;
        Ok(())
    }
}
