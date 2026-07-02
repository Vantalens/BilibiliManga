use rusqlite::{Connection, Result as SqlResult};
use std::path::Path;

pub fn initialize_encrypted_database(path: &Path, key: &str) -> SqlResult<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| rusqlite::Error::ToSqlConversionFailure(Box::new(error)))?;
    }
    let connection = open_encrypted_connection(path, key)?;
    connection.execute_batch(
        "
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS library_items (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          rating INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS reading_progress (
          id TEXT PRIMARY KEY,
          manga_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          page_index INTEGER NOT NULL DEFAULT 0,
          mode TEXT NOT NULL DEFAULT 'scroll',
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cache_entries (
          id TEXT PRIMARY KEY,
          relative_path TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          last_accessed_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
        ",
    )?;
    Ok(())
}

#[cfg(test)]
pub fn count_rows_with_key(path: &Path, key: &str, table_name: &str) -> SqlResult<i64> {
    validate_table_name(table_name)?;
    let connection = open_encrypted_connection(path, key)?;
    connection.query_row(&format!("SELECT COUNT(*) FROM {table_name}"), [], |row| row.get(0))
}

fn open_encrypted_connection(path: &Path, key: &str) -> SqlResult<Connection> {
    let connection = Connection::open(path)?;
    let escaped_key = key.replace('\'', "''");
    connection.pragma_update(None, "key", &escaped_key)?;
    connection.pragma_update(None, "cipher_page_size", 4096_i64)?;
    connection.pragma_update(None, "kdf_iter", 256000_i64)?;
    Ok(connection)
}

#[cfg(test)]
fn validate_table_name(table_name: &str) -> SqlResult<()> {
    let allowed = ["library_items", "reading_progress", "cache_entries"];
    if allowed.contains(&table_name) {
        Ok(())
    } else {
        Err(rusqlite::Error::InvalidParameterName(table_name.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypted_database_can_be_created_and_reopened_with_same_key() {
        let temp = tempfile::tempdir().expect("temp dir should exist");
        let path = temp.path().join("bilimanga.db");
        let key = "test-database-key";

        initialize_encrypted_database(&path, key).expect("database should initialize");
        let chapter_count = count_rows_with_key(&path, key, "reading_progress")
            .expect("schema should be readable with same key");

        assert_eq!(chapter_count, 0);
    }

    #[test]
    fn encrypted_database_rejects_wrong_key() {
        let temp = tempfile::tempdir().expect("temp dir should exist");
        let path = temp.path().join("bilimanga.db");

        initialize_encrypted_database(&path, "correct-key").expect("database should initialize");

        assert!(count_rows_with_key(&path, "wrong-key", "reading_progress").is_err());
    }

    #[test]
    fn encrypted_database_file_is_not_plain_sqlite() {
        let temp = tempfile::tempdir().expect("temp dir should exist");
        let path = temp.path().join("bilimanga.db");

        initialize_encrypted_database(&path, "correct-key").expect("database should initialize");

        let file_header = std::fs::read(&path)
            .expect("database file should exist")
            .into_iter()
            .take(16)
            .collect::<Vec<_>>();
        assert_ne!(file_header, b"SQLite format 3\0");
    }
}