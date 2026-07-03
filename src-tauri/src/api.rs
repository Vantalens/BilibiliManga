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
const PURCHASED_COMICS_ENDPOINT: &str = "https://manga.bilibili.com/twirp/user.v1.User/GetAutoBuyComics?device=pc&platform=web&nov=27";
const BOOKSHELF_LIST_ENDPOINT: &str = "https://manga.bilibili.com/twirp/bookshelf.v1.Bookshelf/ListFavorite?device=pc&platform=web&nov=27";
const COMIC_DETAIL_ENDPOINT: &str = "https://manga.bilibili.com/twirp/comic.v1.Comic/ComicDetail?device=pc&platform=web&nov=27";
const CLASS_PAGE_ENDPOINT: &str = "https://manga.bilibili.com/twirp/comic.v1.Comic/ClassPage?device=pc&platform=web&nov=27";
const LOGIN_CHECK_ENDPOINT: &str = "https://api.bilibili.com/x/web-interface/nav";

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

// Purchased comics types - based on community API documentation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchasedComic {
    pub comic_id: i64,
    pub comic_title: String,
    #[serde(default)]
    pub vcover: Option<String>,
    #[serde(default)]
    pub scover: Option<String>,
    #[serde(default)]
    pub hcover: Option<String>,
    #[serde(default)]
    pub bought_ep_count: Option<i32>,
    #[serde(default)]
    pub last_ord: Option<f64>,
    #[serde(default)]
    pub last_short_title: Option<String>,
    #[serde(default)]
    pub buy_type: Option<i32>,
    #[serde(default)]
    pub bug_type: Option<i32>, // Field name variation in API
    #[serde(default)]
    pub enable_auto_pay: Option<bool>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PurchasedComicsResult {
    pub items: Vec<PurchasedComic>,
}

#[derive(Debug, Clone, Serialize)]
struct PurchasedComicsRequest {
    page_num: i32,
    page_size: i32,
}

// Login check types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginCheckResult {
    pub is_login: bool,
    pub uid: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
struct LoginCheckData {
    #[serde(rename = "isLogin")]
    is_login: bool,
    #[serde(default)]
    mid: Option<i64>,
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

// Login check API - verified from research reports
pub async fn check_login_status(cookies: &str) -> Result<LoginCheckResult, ApiError> {
    let client = reqwest::Client::new();
    let response = client
        .get(LOGIN_CHECK_ENDPOINT)
        .header(reqwest::header::COOKIE, cookies)
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }

    let envelope = response
        .json::<TwirpEnvelope<LoginCheckData>>()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;

    // code=-101 means not logged in
    if envelope.code == -101 {
        return Ok(LoginCheckResult {
            is_login: false,
            uid: None,
        });
    }

    if envelope.code != 0 {
        return Err(ApiError::Server {
            code: envelope.code,
            message: envelope_message(&envelope),
        });
    }

    let data = envelope.data.ok_or_else(|| {
        ApiError::Schema("nav success response must include data".to_string())
    })?;

    Ok(LoginCheckResult {
        is_login: data.is_login,
        uid: data.mid,
    })
}

// Purchased comics API - based on community documentation
pub async fn fetch_purchased_comics(
    page: i32,
    page_size: i32,
    cookies: &str,
) -> Result<PurchasedComicsResult, ApiError> {
    if cookies.trim().is_empty() {
        return Err(ApiError::Validation(
            "cookies required for purchased comics".to_string(),
        ));
    }

    let request = PurchasedComicsRequest { page_num: page, page_size };
    let client = reqwest::Client::new();
    let response = client
        .post(PURCHASED_COMICS_ENDPOINT)
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .header("x-bili-manga-from", "c-int-v1")
        .header(reqwest::header::ORIGIN, OFFICIAL_ORIGIN)
        .header(
            reqwest::header::REFERER,
            format!("{}/account-center", OFFICIAL_ORIGIN),
        )
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .header(reqwest::header::COOKIE, cookies)
        .json(&request)
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }

    let envelope = response
        .json::<TwirpEnvelope<Vec<PurchasedComic>>>()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;

    // code=-6 means session expired (from RSSHub observation)
    if envelope.code == -6 {
        return Err(ApiError::Server {
            code: -6,
            message: "session expired - please re-login via official page".to_string(),
        });
    }

    // code=99 means context mismatch
    if envelope.code == 99 {
        return Err(ApiError::Server {
            code: 99,
            message: "request context invalid - may need browser session".to_string(),
        });
    }

    if envelope.code != 0 {
        return Err(ApiError::Server {
            code: envelope.code,
            message: envelope_message(&envelope),
        });
    }

    let items = envelope.data.ok_or_else(|| {
        ApiError::Schema("GetAutoBuyComics success response must include data".to_string())
    })?;

    Ok(PurchasedComicsResult { items })
}

// Bookshelf API - to be verified with real account
pub async fn fetch_bookshelf(
    page: i32,
    page_size: i32,
    cookies: &str,
) -> Result<BookshelfResult, ApiError> {
    if cookies.trim().is_empty() {
        return Err(ApiError::Validation(
            "cookies required for bookshelf".to_string(),
        ));
    }

    // Placeholder implementation - structure ready, waiting for real verification
    // Research reports confirm: needs Cookie, Referer, code=-6 for expired session
    Err(ApiError::NotImplemented(
        "bookshelf API structure ready, needs real browser session verification - use official web https://manga.bilibili.com/account-center".to_string(),
    ))
}

// ClassPage API - Homepage/Category comics
#[derive(Debug, Serialize, Deserialize)]
pub struct ClassPageRequest {
    pub style_id: i32,    // -1 for all, or specific category ID
    pub area_id: i32,     // -1 for all, 1=国漫, 2=日本, 3=韩国
    pub is_finish: i32,   // -1 for all, 0=连载, 1=完结
    pub order: i32,       // 0=人气, 1=更新, 2=上架时间
    pub page_num: i32,
    pub page_size: i32,
    pub is_free: i32,     // -1 for all, 0=付费, 1=免费, 2=等就免费
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClassPageComic {
    pub id: i64,
    pub title: String,
    #[serde(default)]
    pub vertical_cover: String,
    #[serde(default)]
    pub author_name: Vec<String>,
    #[serde(default)]
    pub styles: Vec<String>,
    pub is_finish: i32,
    pub last_ord: f32,
    #[serde(default)]
    pub last_short_title: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ClassPageData {
    #[serde(default)]
    pub list: Vec<ClassPageComic>,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClassPageResult {
    pub comics: Vec<ClassPageComic>,
    pub total: i32,
}

pub async fn fetch_class_page(
    style_id: i32,
    page_num: i32,
    page_size: i32,
) -> Result<ClassPageResult, ApiError> {
    let client = reqwest::Client::new();

    let request_body = ClassPageRequest {
        style_id,
        area_id: -1,  // All areas
        is_finish: -1, // All status
        order: 0,      // By popularity
        page_num,
        page_size,
        is_free: -1,   // All types
    };

    let response = client
        .post(CLASS_PAGE_ENDPOINT)
        .header("Content-Type", "application/json")
        .header("Origin", OFFICIAL_ORIGIN)
        .header("Referer", OFFICIAL_ORIGIN)
        .header("User-Agent", USER_AGENT)
        .json(&request_body)
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    if !response.status().is_success() {
        return Err(ApiError::Status(response.status().as_u16()));
    }

    let envelope: TwirpEnvelope<ClassPageData> = response
        .json()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;

    if envelope.code != 0 {
        return Err(ApiError::Server {
            code: envelope.code,
            message: envelope_message(&envelope),
        });
    }

    let data = envelope.data.ok_or_else(|| {
        ApiError::Schema("ClassPage success response must include data".to_string())
    })?;

    Ok(ClassPageResult {
        comics: data.list,
        total: data.total,
    })
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
