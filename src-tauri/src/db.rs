use chrono::NaiveDateTime;
use csv::Writer;
use rusqlite::{Connection, Result, params};
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
                height REAL NOT NULL CHECK (height > 0),
                observations TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS evaluation_templates (
                id INTEGER PRIMARY KEY,
                completed_periods TEXT NOT NULL,
                total_time INTEGER NOT NULL,
                date TEXT NOT NULL,
                total_distance REAL NOT NULL DEFAULT 0
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS athlete_evaluations (
                id INTEGER PRIMARY KEY,
                athlete_id INTEGER NOT NULL,
                template_id INTEGER NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('completed', 'cancelled')),
                date TEXT NOT NULL,
                FOREIGN KEY (athlete_id) REFERENCES athletes (id),
                FOREIGN KEY (template_id) REFERENCES evaluation_templates (id)
            )",
            [],
        )?;

        let db = Database {
            connection: Mutex::new(conn),
        };

        // Migrate old data if necessary
        if let Err(e) = db.migrate_old_evaluations() {
            eprintln!("Error migrating old evaluations: {}", e);
        }

        // Run migrations
        db.migrate()?;

        Ok(db)
    }

    fn migrate(&self) -> Result<()> {
        let conn = self.connection.lock().unwrap();
        
        // Add observations column to athletes table if it doesn't exist
        let columns = conn.query_row(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='athletes'",
            [],
            |row| row.get::<_, String>(0),
        )?;
        
        if !columns.to_lowercase().contains("observations") {
            conn.execute("ALTER TABLE athletes ADD COLUMN observations TEXT", [])?;
        }

        // Add total_distance column to evaluation_templates table if it doesn't exist
        let columns = conn.query_row(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='evaluation_templates'",
            [],
            |row| row.get::<_, String>(0),
        )?;
        
        if !columns.to_lowercase().contains("total_distance") {
            conn.execute(
                "ALTER TABLE evaluation_templates ADD COLUMN total_distance REAL NOT NULL DEFAULT 0",
                [],
            )?;
        }

        Ok(())
    }

    pub fn save_evaluation_data(
        &self,
        athlete: &Athlete,
        template: &EvaluationTemplate,
        athlete_evaluation: &AthleteEvaluation,
    ) -> Result<(i64, i64, i64)> {
        let mut conn = self.connection.lock().unwrap();
        let tx = conn.transaction()?;

        // Save athlete
        tx.execute(
            "INSERT INTO athletes (name, age, weight, height, observations) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                athlete.name,
                athlete.age,
                athlete.weight,
                athlete.height,
                athlete.observations,
            ],
        )?;

        let athlete_id = tx.last_insert_rowid();

        // Save evaluation template
        tx.execute(
            "INSERT INTO evaluation_templates (completed_periods, total_time, date, total_distance) 
             VALUES (?1, ?2, ?3, ?4)",
            [
                &template.completed_periods,
                &template.total_time.to_string(),
                &template.date,
                &template.total_distance.to_string(),
            ],
        )?;

        let template_id = tx.last_insert_rowid();

        // Validate date format
        if NaiveDateTime::parse_from_str(&athlete_evaluation.date, "%Y-%m-%dT%H:%M:%S%.f%z").is_err() {
            return Err(rusqlite::Error::InvalidParameterName(
                "Invalid date format".into(),
            ));
        }

        // Save athlete evaluation with the new athlete_id and template_id
        tx.execute(
            "INSERT INTO athlete_evaluations (athlete_id, template_id, status, date) 
             VALUES (?1, ?2, ?3, ?4)",
            [
                &athlete_id.to_string(),
                &template_id.to_string(),
                &athlete_evaluation.status,
                &athlete_evaluation.date,
            ],
        )?;

        let eval_id = tx.last_insert_rowid();

        // Commit the transaction
        tx.commit()?;

        Ok((athlete_id, template_id, eval_id))
    }

    pub fn get_athlete_evaluations(&self, athlete_id: i64) -> Result<Vec<(AthleteEvaluation, EvaluationTemplate)>> {
        let conn = self.connection.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT ae.id, ae.athlete_id, ae.template_id, ae.status, ae.date,
                    et.id, et.completed_periods, et.total_time, et.date
             FROM athlete_evaluations ae
             JOIN evaluation_templates et ON ae.template_id = et.id
             WHERE ae.athlete_id = ?1 
             ORDER BY ae.date DESC",
        )?;

        let evals = stmt.query_map([athlete_id], |row| {
            Ok((
                AthleteEvaluation {
                    id: Some(row.get(0)?),
                    athlete_id: row.get(1)?,
                    template_id: row.get(2)?,
                    status: row.get(3)?,
                    date: row.get(4)?,
                },
                EvaluationTemplate {
                    id: Some(row.get(5)?),
                    completed_periods: row.get(6)?,
                    total_time: row.get(7)?,
                    date: row.get(8)?,
                    total_distance: row.get(9)?,
                }
            ))
        })?;

        evals.collect()
    }

    pub fn export_all_evaluations_to_csv<P: AsRef<Path>>(
        &self,
        path: P,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.connection.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT ae.id, ae.athlete_id, a.name, et.completed_periods, et.total_time, ae.date, ae.status, 
                    a.observations, et.total_distance
             FROM athlete_evaluations ae 
             JOIN athletes a ON ae.athlete_id = a.id 
             JOIN evaluation_templates et ON ae.template_id = et.id
             ORDER BY ae.date DESC"
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
            "Observaciones",
            "Distancia Total (m)",
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
                row.get::<_, Option<String>>(7)?.unwrap_or_default(),
                row.get::<_, f32>(8)?,
            ))
        })?;

        for row in rows {
            let (id, athlete_id, name, periods, time, date, status, observations, total_distance) = row?;
            wtr.write_record(&[
                id.to_string(),
                athlete_id.to_string(),
                name,
                periods,
                time.to_string(),
                date,
                status,
                observations,
                total_distance.to_string(),
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
            "SELECT ae.id, ae.athlete_id, a.name, et.completed_periods, et.total_time, ae.date, ae.status,
                    a.observations, et.total_distance
             FROM athlete_evaluations ae 
             JOIN athletes a ON ae.athlete_id = a.id 
             JOIN evaluation_templates et ON ae.template_id = et.id
             WHERE ae.athlete_id = ?1
             ORDER BY ae.date DESC"
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
            "Observaciones",
            "Distancia Total (m)",
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
                row.get::<_, Option<String>>(7)?.unwrap_or_default(),
                row.get::<_, f32>(8)?,
            ))
        })?;

        for row in rows {
            let (id, athlete_id, name, periods, time, date, status, observations, total_distance) = row?;
            wtr.write_record(&[
                id.to_string(),
                athlete_id.to_string(),
                name,
                periods,
                time.to_string(),
                date,
                status,
                observations,
                total_distance.to_string(),
            ])?;
        }

        wtr.flush()?;
        Ok(())
    }

    pub fn get_all_evaluations(&self) -> Result<Vec<(AthleteEvaluation, EvaluationTemplate, Athlete)>> {
        let conn = self.connection.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT ae.id, ae.athlete_id, ae.template_id, ae.status, ae.date,
                    et.id, et.completed_periods, et.total_time, et.date, et.total_distance,
                    a.id, a.name, a.age, a.weight, a.height, a.observations
             FROM athlete_evaluations ae 
             JOIN evaluation_templates et ON ae.template_id = et.id
             JOIN athletes a ON ae.athlete_id = a.id 
             ORDER BY ae.date DESC"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok((
                AthleteEvaluation {
                    id: Some(row.get(0)?),
                    athlete_id: row.get(1)?,
                    template_id: row.get(2)?,
                    status: row.get(3)?,
                    date: row.get(4)?,
                },
                EvaluationTemplate {
                    id: Some(row.get(5)?),
                    completed_periods: row.get(6)?,
                    total_time: row.get(7)?,
                    date: row.get(8)?,
                    total_distance: row.get(9)?,
                },
                Athlete {
                    id: Some(row.get(10)?),
                    name: row.get(11)?,
                    age: row.get(12)?,
                    weight: row.get(13)?,
                    height: row.get(14)?,
                    observations: row.get(15)?,
                }
            ))
        })?;

        rows.collect()
    }

    pub fn migrate_old_evaluations(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut conn = self.connection.lock().unwrap();
        let tx = conn.transaction()?;

        // Check if old evaluations table exists
        let old_table_exists: bool = tx
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='evaluations'",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if old_table_exists {
            // Create temporary table to store old data
            tx.execute(
                "CREATE TEMPORARY TABLE old_evaluations AS SELECT * FROM evaluations",
                [],
            )?;

            // Migrate data to new structure
            tx.execute(
                "INSERT INTO evaluation_templates (completed_periods, total_time, date)
                 SELECT DISTINCT completed_periods, total_time, date
                 FROM old_evaluations",
                [],
            )?;

            tx.execute(
                "INSERT INTO athlete_evaluations (athlete_id, template_id, status, date)
                 SELECT 
                     oe.athlete_id,
                     et.id,
                     oe.status,
                     oe.date
                 FROM old_evaluations oe
                 JOIN evaluation_templates et 
                     ON et.completed_periods = oe.completed_periods
                     AND et.total_time = oe.total_time
                     AND et.date = oe.date",
                [],
            )?;

            // Drop old table
            tx.execute("DROP TABLE evaluations", [])?;
            tx.execute("DROP TABLE old_evaluations", [])?;
        }

        tx.commit()?;
        Ok(())
    }
}
