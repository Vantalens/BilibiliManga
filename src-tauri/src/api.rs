use serde::{Deserialize, Serialize};
use std::fmt;

// API endpoints - base configuration
const TWIRP_BASE: &str = "https://manga.bilibili.com/twirp";
const OFFICIAL_ORIGIN: &str = "https://manga.bilibili.com";
const PASSPORT_BASE: &str = "https://passport.bilibili.com";
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";

// Twirp endpoints - verified
const SEARCH_SUGGEST_ENDPOINT: &str = "https://manga.bilibili.com/twirp/comic.v1.Comic/SearchSug?device=pc&platform=web&nov=27";

// Twirp endpoints - to be verified with real account
const BOOKSHELF_LIST_ENDPOINT: &str = "https://manga.bilibili.com/twirp/bookshelf.v1.Bookshelf/ListFavorite?device=pc&platform=web&nov=27";
const COMIC_DETAIL_ENDPOINT: &str = "https://manga.bilibili.com/twirp/comic.v1.Comic/ComicDetail?device=pc&platform=web&nov=27";

// Validation constraints
const MAX_TERM_CHARS: usize = 80;
const DEFAULT_SUGGESTION_LIMIT: u8 = 10;
const MAX_SUGGESTION_LIMIT: u8 = 20;

#[derive(Debug)]
pub enum ApiError {
    Validation(String),
    Transport(String),
    Status(u16),
    Server { code: i64, message: String },
    Schema(String),
    NotImplemented(String),
}

impl fmt::Display for ApiError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ApiError::Validation(message) => write!(formatter, "validation failed: {message}"),
            ApiError::Transport(message) => write!(formatter, "transport failed: {message}"),
            ApiError::Status(status) => write!(formatter, "unexpected http status: {status}"),
            ApiError::Server { code, message } => {
                write!(formatter, "api returned code {code}: {message}")
            }
            ApiError::Schema(message) => write!(formatter, "schema mismatch: {message}"),
            ApiError::NotImplemented(message) => write!(formatter, "not implemented: {message}"),
        }
    }
}

impl std::error::Error for ApiError {}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct SearchSuggestionResult {
    pub suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct SearchSuggestionRequest {
    term: String,
    num: u8,
}

// Login types - structure ready, needs real account verification
#[derive(Debug, Clone, Serialize)]
pub struct QrCodeResult {
    pub url: String,
    pub qrcode_key: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum LoginStatus {
    Scanning,
    Confirmed,
    Success { cookies: Vec<Cookie> },
    Expired,
    Failed,
}

#[derive(Debug, Clone, Serialize)]
pub struct Cookie {
    pub name: String,
    pub value: String,
    pub domain: String,
}

// Bookshelf types - structure ready, needs real account verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookshelfItem {
    pub comic_id: i64,
    pub title: String,
    pub vertical_cover: Option<String>,
    pub is_finish: Option<i32>,
    pub last_ord: Option<f64>,
    pub last_short_title: Option<String>,
    pub styles: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BookshelfResult {
    pub items: Vec<BookshelfItem>,
    pub total: i64,
    pub has_more: bool,
}

#[derive(Debug, Clone, Serialize)]
struct BookshelfRequest {
    page_num: i32,
    page_size: i32,
    order: i32,
}

#[derive(Debug, Deserialize)]
struct TwirpEnvelope<T> {
    code: i64,
    #[serde(default)]
    msg: String,
    #[serde(default)]
    message: String,
    data: Option<T>,
}

pub async fn search_suggestions(
    term: String,
    limit: Option<u8>,
) -> Result<SearchSuggestionResult, ApiError> {
    let request = build_search_suggestion_request(&term, limit)?;
    let client = reqwest::Client::new();
    let response = client
        .post(SEARCH_SUGGEST_ENDPOINT)
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .header("x-bili-manga-from", "c-int-v1")
        .header(reqwest::header::ORIGIN, OFFICIAL_ORIGIN)
        .header(reqwest::header::REFERER, format!("{OFFICIAL_ORIGIN}/"))
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .json(&request)
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }

    let envelope = response
        .json::<TwirpEnvelope<Vec<String>>>()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;
    parse_search_suggestion_envelope(envelope)
}

pub fn build_search_suggestion_request(
    term: &str,
    limit: Option<u8>,
) -> Result<SearchSuggestionRequest, ApiError> {
    let normalized = term.trim();
    if normalized.is_empty() {
        return Err(ApiError::Validation(
            "search term cannot be empty".to_string(),
        ));
    }
    if normalized.chars().count() > MAX_TERM_CHARS {
        return Err(ApiError::Validation(format!(
            "search term cannot exceed {MAX_TERM_CHARS} characters"
        )));
    }

    let num = limit.unwrap_or(DEFAULT_SUGGESTION_LIMIT);
    if num == 0 || num > MAX_SUGGESTION_LIMIT {
        return Err(ApiError::Validation(format!(
            "suggestion limit must be between 1 and {MAX_SUGGESTION_LIMIT}"
        )));
    }

    Ok(SearchSuggestionRequest {
        term: normalized.to_string(),
        num,
    })
}

fn parse_search_suggestion_envelope(
    envelope: TwirpEnvelope<Vec<String>>,
) -> Result<SearchSuggestionResult, ApiError> {
    if envelope.code != 0 {
        return Err(ApiError::Server {
            code: envelope.code,
            message: envelope_message(&envelope),
        });
    }

    let suggestions = envelope.data.ok_or_else(|| {
        ApiError::Schema("SearchSug success response must include data".to_string())
    })?;
    Ok(SearchSuggestionResult { suggestions })
}

fn envelope_message<T>(envelope: &TwirpEnvelope<T>) -> String {
    if !envelope.msg.is_empty() {
        return envelope.msg.clone();
    }
    if !envelope.message.is_empty() {
        return envelope.message.clone();
    }
    "Bilibili Manga API returned a non-zero code".to_string()
}

// Bookshelf API - to be verified with real account
pub async fn fetch_bookshelf(
    page: i32,
    page_size: i32,
    _cookies: &str,
) -> Result<BookshelfResult, ApiError> {
    // Placeholder implementation - requires real account verification
    // TODO: Implement cookie-based authentication
    // TODO: Verify request body structure with real API
    // TODO: Map response fields to BookshelfItem
    Err(ApiError::NotImplemented(
        "bookshelf API requires real account verification - use official web fallback https://manga.bilibili.com/account-center".to_string(),
    ))
}

// Login API - to be verified with real account
pub async fn generate_qrcode() -> Result<QrCodeResult, ApiError> {
    // Placeholder implementation - requires passport API verification
    // TODO: Implement QR code generation endpoint
    // TODO: Verify response structure
    Err(ApiError::NotImplemented(
        "QR login requires passport API verification - use official login page https://passport.bilibili.com/login".to_string(),
    ))
}

pub async fn poll_login_status(_qrcode_key: &str) -> Result<LoginStatus, ApiError> {
    // Placeholder implementation - requires passport API verification
    // TODO: Implement polling endpoint
    // TODO: Handle all login states (scanning/confirmed/success/expired/failed)
    // TODO: Extract cookies from success response
    Err(ApiError::NotImplemented(
        "login polling requires passport API verification - use official login page https://passport.bilibili.com/login".to_string(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_trimmed_search_suggestion_request_with_limit() {
        let request = build_search_suggestion_request("  有兽焉  ", Some(5))
            .expect("request should be valid");

        assert_eq!(request.term, "有兽焉");
        assert_eq!(request.num, 5);
    }

    #[test]
    fn rejects_empty_search_suggestion_term() {
        let error =
            build_search_suggestion_request("   ", Some(5)).expect_err("empty term should fail");

        assert!(error.to_string().contains("search term cannot be empty"));
    }

    #[test]
    fn rejects_too_many_search_suggestions() {
        let error =
            build_search_suggestion_request("有兽焉", Some(21)).expect_err("limit should fail");

        assert!(error.to_string().contains("suggestion limit"));
    }

    #[test]
    fn parses_verified_search_suggestion_envelope() {
        let result = parse_search_suggestion_envelope(TwirpEnvelope {
            code: 0,
            msg: String::new(),
            message: String::new(),
            data: Some(vec!["有兽焉".to_string()]),
        })
        .expect("verified response should parse");

        assert_eq!(result.suggestions, vec!["有兽焉"]);
    }

    #[test]
    fn maps_non_zero_api_code_to_server_error() {
        let error = parse_search_suggestion_envelope(TwirpEnvelope::<Vec<String>> {
            code: 99,
            msg: "请求失败".to_string(),
            message: String::new(),
            data: None,
        })
        .expect_err("server error should fail");

        assert!(matches!(error, ApiError::Server { code: 99, .. }));
    }
}
