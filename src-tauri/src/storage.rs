use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StoredLibraryItem {
    pub id: String,
    pub title: String,
    pub rating: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StoredReadingProgress {
    pub id: String,
    pub manga_id: String,
    pub chapter_id: String,
    pub page_index: i64,
    pub mode: String,
    pub updated_at: i64,
}

pub fn initialize_encrypted_database(path: &Path, key: &str) -> SqlResult<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|error| rusqlite::Error::ToSqlConversionFailure(Box::new(error)))?;
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

pub fn upsert_library_item(path: &Path, key: &str, item: &StoredLibraryItem) -> SqlResult<()> {
    let connection = open_encrypted_connection(path, key)?;
    connection.execute(
        "
        INSERT INTO library_items (id, title, rating, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          rating = excluded.rating,
          updated_at = excluded.updated_at
        ",
        params![
            item.id,
            item.title,
            item.rating,
            item.created_at,
            item.updated_at
        ],
    )?;
    Ok(())
}

pub fn list_library_items(path: &Path, key: &str) -> SqlResult<Vec<StoredLibraryItem>> {
    let connection = open_encrypted_connection(path, key)?;
    let mut statement = connection.prepare(
        "
        SELECT id, title, rating, created_at, updated_at
        FROM library_items
        ORDER BY updated_at DESC, title ASC
        ",
    )?;
    let rows = statement.query_map([], |row| {
        Ok(StoredLibraryItem {
            id: row.get(0)?,
            title: row.get(1)?,
            rating: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?;

    rows.collect()
}

pub fn upsert_reading_progress(
    path: &Path,
    key: &str,
    progress: &StoredReadingProgress,
) -> SqlResult<()> {
    let connection = open_encrypted_connection(path, key)?;
    connection.execute(
        "
        INSERT INTO reading_progress (id, manga_id, chapter_id, page_index, mode, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        ON CONFLICT(id) DO UPDATE SET
          manga_id = excluded.manga_id,
          chapter_id = excluded.chapter_id,
          page_index = excluded.page_index,
          mode = excluded.mode,
          updated_at = excluded.updated_at
        ",
        params![
            progress.id,
            progress.manga_id,
            progress.chapter_id,
            progress.page_index,
            progress.mode,
            progress.updated_at
        ],
    )?;
    Ok(())
}

pub fn get_reading_progress(
    path: &Path,
    key: &str,
    id: &str,
) -> SqlResult<Option<StoredReadingProgress>> {
    let connection = open_encrypted_connection(path, key)?;
    let result = connection.query_row(
        "
        SELECT id, manga_id, chapter_id, page_index, mode, updated_at
        FROM reading_progress
        WHERE id = ?1
        ",
        [id],
        |row| {
            Ok(StoredReadingProgress {
                id: row.get(0)?,
                manga_id: row.get(1)?,
                chapter_id: row.get(2)?,
                page_index: row.get(3)?,
                mode: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    );

    match result {
        Ok(progress) => Ok(Some(progress)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(error) => Err(error),
    }
}

#[cfg(test)]
pub fn count_rows_with_key(path: &Path, key: &str, table_name: &str) -> SqlResult<i64> {
    validate_table_name(table_name)?;
    let connection = open_encrypted_connection(path, key)?;
    connection.query_row(&format!("SELECT COUNT(*) FROM {table_name}"), [], |row| {
        row.get(0)
    })
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
        Err(rusqlite::Error::InvalidParameterName(
            table_name.to_string(),
        ))
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

    #[test]
    fn library_items_round_trip_through_encrypted_database() {
        let temp = tempfile::tempdir().expect("temp dir should exist");
        let path = temp.path().join("bilimanga.db");
        let key = "test-database-key";
        initialize_encrypted_database(&path, key).expect("database should initialize");
        let item = StoredLibraryItem {
            id: "manga-1".to_string(),
            title: "星海回声".to_string(),
            rating: 5,
            created_at: 100,
            updated_at: 200,
        };

        upsert_library_item(&path, key, &item).expect("item should be stored");
        let stored = list_library_items(&path, key).expect("items should load");

        assert_eq!(stored, vec![item]);
    }

    #[test]
    fn reading_progress_is_upserted_by_id() {
        let temp = tempfile::tempdir().expect("temp dir should exist");
        let path = temp.path().join("bilimanga.db");
        let key = "test-database-key";
        initialize_encrypted_database(&path, key).expect("database should initialize");
        let first = StoredReadingProgress {
            id: "manga-1:chapter-2".to_string(),
            manga_id: "manga-1".to_string(),
            chapter_id: "chapter-2".to_string(),
            page_index: 1,
            mode: "scroll".to_string(),
            updated_at: 100,
        };
        let second = StoredReadingProgress {
            page_index: 5,
            mode: "page".to_string(),
            updated_at: 200,
            ..first.clone()
        };

        upsert_reading_progress(&path, key, &first).expect("progress should be stored");
        upsert_reading_progress(&path, key, &second).expect("progress should update");
        let stored =
            get_reading_progress(&path, key, &first.id).expect("progress query should work");

        assert_eq!(stored, Some(second));
    }
}
