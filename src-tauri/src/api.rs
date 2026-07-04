use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::fmt;

// API endpoints - base configuration
const OFFICIAL_ORIGIN: &str = "https://manga.bilibili.com";
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
const MAX_PROXY_IMAGE_BYTES: usize = 8 * 1024 * 1024;

// Twirp endpoints - verified
const SEARCH_SUGGEST_ENDPOINT: &str =
    "https://manga.bilibili.com/twirp/comic.v1.Comic/SearchSug?device=pc&platform=web&nov=27";
const SEARCH_ENDPOINT: &str =
    "https://manga.bilibili.com/twirp/comic.v1.Comic/Search?device=pc&platform=web";

// Twirp endpoints - to be verified with real account
const PURCHASED_COMICS_ENDPOINT: &str =
    "https://manga.bilibili.com/twirp/user.v1.User/GetAutoBuyComics?device=pc&platform=web&nov=27";
const BOOKSHELF_LIST_ENDPOINT: &str = "https://manga.bilibili.com/twirp/bookshelf.v1.Bookshelf/ListFavorite?device=pc&platform=web&nov=27";
const IMAGE_INDEX_ENDPOINT: &str =
    "https://manga.bilibili.com/twirp/comic.v1.Comic/GetImageIndex?device=pc&platform=web";
const IMAGE_TOKEN_ENDPOINT: &str =
    "https://manga.bilibili.com/twirp/comic.v1.Comic/ImageToken?device=pc&platform=web";
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

#[derive(Debug, Clone, Serialize)]
pub struct QrCodeResult {
    pub url: String,
    pub qrcode_key: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
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
struct PassportEnvelope<T> {
    code: i64,
    message: String,
    data: Option<T>,
}

#[derive(Debug, Deserialize)]
struct QrCodeData {
    url: String,
    qrcode_key: String,
}

#[derive(Debug, Deserialize)]
struct QrPollData {
    code: i64,
    message: String,
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

    let data = envelope
        .data
        .ok_or_else(|| ApiError::Schema("nav success response must include data".to_string()))?;

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

    let request = PurchasedComicsRequest {
        page_num: page,
        page_size,
    };
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

pub async fn fetch_bookshelf(
    page: i32,
    page_size: i32,
    cookies: &str,
) -> Result<BookshelfResult, ApiError> {
    if page <= 0 || page_size <= 0 || page_size > 50 {
        return Err(ApiError::Validation(
            "invalid bookshelf pagination".to_string(),
        ));
    }
    if cookies.trim().is_empty() {
        return Err(ApiError::Validation(
            "cookies required for bookshelf".to_string(),
        ));
    }

    let page_num = page.to_string();
    let page_size_text = page_size.to_string();
    let response = reqwest::Client::new()
        .post(BOOKSHELF_LIST_ENDPOINT)
        .header(reqwest::header::ORIGIN, OFFICIAL_ORIGIN)
        .header(
            reqwest::header::REFERER,
            format!("{OFFICIAL_ORIGIN}/account-center"),
        )
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .header(reqwest::header::COOKIE, cookies)
        .form(&[
            ("page_num", page_num.as_str()),
            ("page_size", page_size_text.as_str()),
            ("order", "0"),
        ])
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;
    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }

    let envelope = response
        .json::<TwirpEnvelope<serde_json::Value>>()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;
    if envelope.code != 0 {
        return Err(ApiError::Server {
            code: envelope.code,
            message: envelope_message(&envelope),
        });
    }
    let data = envelope
        .data
        .ok_or_else(|| ApiError::Schema("bookshelf response did not include data".to_string()))?;
    parse_bookshelf_result(&data, page_size)
}

fn parse_bookshelf_result(
    data: &serde_json::Value,
    page_size: i32,
) -> Result<BookshelfResult, ApiError> {
    let list = data
        .get("list")
        .or_else(|| data.get("items"))
        .and_then(|value| value.as_array())
        .or_else(|| data.as_array())
        .ok_or_else(|| ApiError::Schema("bookshelf response did not include list".to_string()))?;
    let mut items = Vec::new();
    for item in list {
        let comic_id = number_value(item, "comic_id")
            .or_else(|| number_value(item, "id"))
            .ok_or_else(|| ApiError::Schema("bookshelf item missing comic id".to_string()))?
            as i64;
        let title = string_value(item, "title")
            .or_else(|| string_value(item, "comic_title"))
            .unwrap_or_default();
        items.push(BookshelfItem {
            comic_id,
            title,
            vertical_cover: string_value(item, "vertical_cover")
                .or_else(|| string_value(item, "vcover"))
                .or_else(|| string_value(item, "cover")),
            is_finish: number_value(item, "is_finish").map(|value| value as i32),
            last_ord: number_value(item, "last_ord"),
            last_short_title: string_value(item, "last_short_title"),
            styles: item
                .get("styles")
                .map(|_| string_array_from_json(item.get("styles"))),
        });
    }
    let total = number_value(data, "total").unwrap_or(items.len() as f64) as i64;
    let has_more = data
        .get("has_more")
        .and_then(|value| value.as_bool())
        .unwrap_or(items.len() >= page_size as usize);
    Ok(BookshelfResult {
        items,
        total,
        has_more,
    })
}

// ClassPage API - Homepage/Category comics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassPageComic {
    pub id: i64,
    pub title: String,
    #[serde(default)]
    pub vertical_cover: String,
    #[serde(default)]
    pub author_name: Vec<String>,
    #[serde(default)]
    pub styles: Vec<String>,
    #[serde(default)]
    pub is_finish: i32,
    #[serde(default)]
    pub last_ord: f32,
    #[serde(default)]
    pub last_short_title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClassPageResult {
    pub comics: Vec<ClassPageComic>,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComicEpisode {
    pub id: i64,
    pub ord: f32,
    pub short_title: String,
    pub title: String,
    pub cover: String,
    pub is_locked: bool,
    pub is_in_free: bool,
    pub image_count: i32,
    pub pub_time: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComicDetailResult {
    pub id: i64,
    pub title: String,
    pub vertical_cover: String,
    pub horizontal_cover: String,
    pub author_name: Vec<String>,
    pub styles: Vec<String>,
    pub evaluate: String,
    pub is_finish: i32,
    pub total: i32,
    pub episodes: Vec<ComicEpisode>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComicSearchResult {
    pub comics: Vec<ClassPageComic>,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EpisodeImagesResult {
    pub images: Vec<String>,
}

pub async fn fetch_class_page(
    style_id: i32,
    _page_num: i32,
    page_size: i32,
) -> Result<ClassPageResult, ApiError> {
    let mut result = fetch_public_manga_page(style_id).await?;
    if page_size > 0 {
        result.comics.truncate(page_size as usize);
        result.total = result.comics.len() as i32;
    }
    Ok(result)
}

async fn fetch_public_manga_page(style_id: i32) -> Result<ClassPageResult, ApiError> {
    let client = reqwest::Client::new();
    let url = public_manga_page_url(style_id);

    let response = client
        .get(url)
        .header("User-Agent", USER_AGENT)
        .header(reqwest::header::REFERER, format!("{OFFICIAL_ORIGIN}/"))
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    if !response.status().is_success() {
        return Err(ApiError::Status(response.status().as_u16()));
    }

    let html = response
        .text()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    parse_homepage_comics(&html)
}

fn public_manga_page_url(style_id: i32) -> String {
    if style_id < 0 {
        return format!("{OFFICIAL_ORIGIN}/");
    }
    format!("{OFFICIAL_ORIGIN}/classify?styles={style_id}&areas=-1&status=-1&prices=-1&orders=0")
}

fn parse_homepage_comics(html: &str) -> Result<ClassPageResult, ApiError> {
    if let Some(script_json) = extract_script_json(html, "vike_pageContext") {
        return parse_initial_state_json(&script_json);
    }

    if let Some(start) = html.find("window.__INITIAL_STATE__") {
        if let Some(json_start) = html[start..].find('{') {
            let json_start_pos = start + json_start;
            if let Some(json_end) = find_json_end(&html[json_start_pos..]) {
                let json_str = &html[json_start_pos..json_start_pos + json_end];
                return parse_initial_state_json(json_str);
            }
        }
    }

    Err(ApiError::Schema(
        "Could not find homepage manga data in official HTML".to_string(),
    ))
}

fn extract_script_json(html: &str, script_id: &str) -> Option<String> {
    let marker = format!(r#"<script id="{script_id}" type="application/json">"#);
    let start = html.find(&marker)? + marker.len();
    let end = html[start..].find("</script>")?;
    Some(html[start..start + end].to_string())
}

fn find_json_end(json_str: &str) -> Option<usize> {
    let mut depth = 0;
    let mut in_string = false;
    let mut escape_next = false;

    for (i, ch) in json_str.chars().enumerate() {
        if escape_next {
            escape_next = false;
            continue;
        }

        match ch {
            '\\' if in_string => escape_next = true,
            '"' => in_string = !in_string,
            '{' if !in_string => depth += 1,
            '}' if !in_string => {
                depth -= 1;
                if depth == 0 {
                    return Some(i + 1);
                }
            }
            _ => {}
        }
    }
    None
}

fn parse_initial_state_json(json_str: &str) -> Result<ClassPageResult, ApiError> {
    // Parse the JSON and extract comic list
    let value: serde_json::Value = serde_json::from_str(json_str)
        .map_err(|error| ApiError::Schema(format!("JSON parse error: {}", error)))?;

    // Try to find comics in common SSR data paths
    let comics = extract_comics_from_json(&value)?;
    let total = comics.len() as i32;

    Ok(ClassPageResult { comics, total })
}

fn extract_comics_from_json(value: &serde_json::Value) -> Result<Vec<ClassPageComic>, ApiError> {
    let mut comics = Vec::new();
    let mut seen_ids = std::collections::HashSet::new();
    collect_comics_from_json(value, &mut comics, &mut seen_ids);

    if comics.is_empty() {
        return Err(ApiError::Schema(
            "No comics found in homepage JSON data".to_string(),
        ));
    }

    Ok(comics)
}

fn collect_comics_from_json(
    value: &serde_json::Value,
    comics: &mut Vec<ClassPageComic>,
    seen_ids: &mut std::collections::HashSet<i64>,
) {
    match value {
        serde_json::Value::Array(items) => {
            for item in items {
                collect_comics_from_json(item, comics, seen_ids);
            }
        }
        serde_json::Value::Object(map) => {
            if let Some(comic_value) = map.get("comic") {
                collect_comics_from_json(comic_value, comics, seen_ids);
            }

            if let Ok(comic) = parse_comic_from_json(value) {
                if seen_ids.insert(comic.id) {
                    comics.push(comic);
                }
            }

            for child in map.values() {
                collect_comics_from_json(child, comics, seen_ids);
            }
        }
        _ => {}
    }
}

fn parse_comic_from_json(item: &serde_json::Value) -> Result<ClassPageComic, ApiError> {
    let id = item
        .get("comic_id")
        .or_else(|| item.get("id"))
        .and_then(|v| v.as_i64())
        .ok_or_else(|| ApiError::Schema("Missing comic id".to_string()))?;
    let title = item
        .get("title")
        .and_then(|v| v.as_str())
        .filter(|title| !title.trim().is_empty())
        .ok_or_else(|| ApiError::Schema("Missing comic title".to_string()))?
        .to_string();

    Ok(ClassPageComic {
        id,
        title,
        vertical_cover: item
            .get("vertical_cover")
            .or_else(|| item.get("vcover"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        author_name: string_array_from_json(item.get("author_name").or_else(|| item.get("author"))),
        styles: string_array_from_json(item.get("styles").or_else(|| item.get("tags"))),
        is_finish: item.get("is_finish").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
        last_ord: item.get("last_ord").and_then(|v| v.as_f64()).unwrap_or(0.0) as f32,
        last_short_title: item
            .get("last_short_title")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
    })
}

fn string_array_from_json(value: Option<&serde_json::Value>) -> Vec<String> {
    value
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|item| {
                    item.as_str()
                        .or_else(|| item.get("name").and_then(|name| name.as_str()))
                        .map(|text| text.to_string())
                })
                .collect()
        })
        .unwrap_or_default()
}

pub async fn proxy_image_to_data_url(url: String) -> Result<String, ApiError> {
    let normalized = normalize_proxy_image_url(&url)?;
    let client = reqwest::Client::new();
    let response = client
        .get(&normalized)
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .header(reqwest::header::REFERER, format!("{OFFICIAL_ORIGIN}/"))
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(';').next())
        .filter(|value| value.starts_with("image/"))
        .unwrap_or("image/png")
        .to_string();
    let bytes = response
        .bytes()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    if bytes.len() > MAX_PROXY_IMAGE_BYTES {
        return Err(ApiError::Validation("image is too large".to_string()));
    }

    Ok(format!(
        "data:{content_type};base64,{}",
        general_purpose::STANDARD.encode(bytes)
    ))
}

fn normalize_proxy_image_url(url: &str) -> Result<String, ApiError> {
    let trimmed = url.trim();
    let normalized = if let Some(rest) = trimmed.strip_prefix("//") {
        format!("https://{rest}")
    } else {
        trimmed.to_string()
    };

    if !normalized.starts_with("https://") {
        return Err(ApiError::Validation("image url must use https".to_string()));
    }

    let allowed = ["hdslb.com", "bilibili.com"];
    let host = normalized
        .strip_prefix("https://")
        .and_then(|rest| rest.split('/').next())
        .unwrap_or("")
        .split(':')
        .next()
        .unwrap_or("");

    if !allowed
        .iter()
        .any(|suffix| host == *suffix || host.ends_with(&format!(".{suffix}")))
    {
        return Err(ApiError::Validation(
            "image host is not allowed".to_string(),
        ));
    }

    Ok(normalized)
}

pub async fn search_comics(
    keyword: String,
    page_size: i32,
    cookies: Option<String>,
) -> Result<ComicSearchResult, ApiError> {
    let normalized = keyword.trim().to_lowercase();
    if normalized.is_empty() {
        return Ok(ComicSearchResult {
            comics: Vec::new(),
            total: 0,
        });
    }

    if let Some(cookie) = cookies.as_deref().filter(|value| !value.trim().is_empty()) {
        if let Ok(result) = search_comics_with_cookie(&normalized, page_size, cookie).await {
            return Ok(result);
        }
    }

    let style_ids = [-1, 999, 997, 1016, 995, 1023, 1002, 1001];
    let mut seen_ids = std::collections::HashSet::new();
    let mut matched = Vec::new();

    for style_id in style_ids {
        let page = fetch_public_manga_page(style_id).await?;
        for comic in page.comics {
            if !seen_ids.insert(comic.id) {
                continue;
            }
            let haystack = format!(
                "{} {} {}",
                comic.title,
                comic.author_name.join(" "),
                comic.styles.join(" ")
            )
            .to_lowercase();
            if haystack.contains(&normalized) {
                matched.push(comic);
            }
            if page_size > 0 && matched.len() >= page_size as usize {
                let total = matched.len() as i32;
                return Ok(ComicSearchResult {
                    comics: matched,
                    total,
                });
            }
        }
    }

    Ok(ComicSearchResult {
        total: matched.len() as i32,
        comics: matched,
    })
}

async fn search_comics_with_cookie(
    keyword: &str,
    page_size: i32,
    cookie: &str,
) -> Result<ComicSearchResult, ApiError> {
    let page_size = page_size.clamp(1, 99).to_string();
    let mut request = reqwest::Client::new()
        .post(SEARCH_ENDPOINT)
        .header(reqwest::header::ORIGIN, OFFICIAL_ORIGIN)
        .header(
            reqwest::header::REFERER,
            format!("{OFFICIAL_ORIGIN}/search?from=manga_homepage"),
        )
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .form(&[
            ("key_word", keyword),
            ("page_num", "1"),
            ("page_size", page_size.as_str()),
        ]);
    request = request.header(reqwest::header::COOKIE, cookie);

    let response = request
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;
    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }
    let envelope = response
        .json::<TwirpEnvelope<serde_json::Value>>()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;
    if envelope.code != 0 {
        return Err(ApiError::Server {
            code: envelope.code,
            message: envelope_message(&envelope),
        });
    }
    let data = envelope
        .data
        .ok_or_else(|| ApiError::Schema("search response did not include data".to_string()))?;
    let comics = parse_comic_list_from_data(&data)?;
    Ok(ComicSearchResult {
        total: comics.len() as i32,
        comics,
    })
}

fn parse_comic_list_from_data(data: &serde_json::Value) -> Result<Vec<ClassPageComic>, ApiError> {
    let list = data
        .get("list")
        .and_then(|value| value.as_array())
        .ok_or_else(|| ApiError::Schema("search response did not include list".to_string()))?;
    list.iter()
        .cloned()
        .map(|value| {
            serde_json::from_value::<ClassPageComic>(value)
                .map_err(|error| ApiError::Schema(error.to_string()))
        })
        .collect()
}

pub async fn fetch_comic_detail(comic_id: i64) -> Result<ComicDetailResult, ApiError> {
    if comic_id <= 0 {
        return Err(ApiError::Validation(
            "comic id must be positive".to_string(),
        ));
    }

    let client = reqwest::Client::new();
    let response = client
        .get(format!("{OFFICIAL_ORIGIN}/m/detail/mc{comic_id}"))
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .header(reqwest::header::REFERER, format!("{OFFICIAL_ORIGIN}/"))
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }

    let html = response
        .text()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;
    parse_mobile_detail_page(&html)
}

fn parse_mobile_detail_page(html: &str) -> Result<ComicDetailResult, ApiError> {
    let script_json = extract_script_json(html, "vike_pageContext").ok_or_else(|| {
        ApiError::Schema("mobile detail page must include vike_pageContext".to_string())
    })?;
    let value: serde_json::Value = serde_json::from_str(&script_json)
        .map_err(|error| ApiError::Schema(format!("detail JSON parse error: {error}")))?;
    let season = value
        .get("data")
        .and_then(|data| data.get("seasonData"))
        .ok_or_else(|| ApiError::Schema("detail JSON must include seasonData".to_string()))?;

    let episodes = season
        .get("ep_list")
        .and_then(|v| v.as_array())
        .map(|items| {
            items
                .iter()
                .filter_map(parse_episode_from_json)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    Ok(ComicDetailResult {
        id: number_value(season, "id")
            .ok_or_else(|| ApiError::Schema("detail missing id".to_string()))? as i64,
        title: string_value(season, "title").unwrap_or_default(),
        vertical_cover: string_value(season, "vertical_cover").unwrap_or_default(),
        horizontal_cover: string_value(season, "horizontal_cover").unwrap_or_default(),
        author_name: string_array_from_json(season.get("author_name")),
        styles: string_array_from_json(season.get("styles")),
        evaluate: string_value(season, "evaluate").unwrap_or_default(),
        is_finish: number_value(season, "is_finish").unwrap_or(0.0) as i32,
        total: number_value(season, "total").unwrap_or(episodes.len() as f64) as i32,
        episodes,
    })
}

fn parse_episode_from_json(value: &serde_json::Value) -> Option<ComicEpisode> {
    Some(ComicEpisode {
        id: number_value(value, "id")? as i64,
        ord: number_value(value, "ord").unwrap_or(0.0) as f32,
        short_title: string_value(value, "short_title").unwrap_or_default(),
        title: string_value(value, "title").unwrap_or_default(),
        cover: string_value(value, "cover").unwrap_or_default(),
        is_locked: bool_value(value, "is_locked"),
        is_in_free: bool_value(value, "is_in_free"),
        image_count: number_value(value, "image_count").unwrap_or(0.0) as i32,
        pub_time: string_value(value, "pub_time").unwrap_or_default(),
    })
}

pub async fn fetch_episode_images(
    comic_id: i64,
    ep_id: i64,
    cookies: Option<String>,
) -> Result<EpisodeImagesResult, ApiError> {
    if comic_id <= 0 {
        return Err(ApiError::Validation(
            "comic id must be positive".to_string(),
        ));
    }
    if ep_id <= 0 {
        return Err(ApiError::Validation(
            "episode id must be positive".to_string(),
        ));
    }

    let client = reqwest::Client::new();
    let reader_referer = official_reader_referer(comic_id, ep_id);
    let ep_id_form = ep_id.to_string();
    let mut request = client
        .post(IMAGE_INDEX_ENDPOINT)
        .header(reqwest::header::ORIGIN, OFFICIAL_ORIGIN)
        .header(reqwest::header::REFERER, &reader_referer)
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .form(&[("ep_id", ep_id_form.as_str())]);
    if let Some(cookie) = cookies.as_deref().filter(|value| !value.trim().is_empty()) {
        request = request.header(reqwest::header::COOKIE, cookie);
    }

    let response = request
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;
    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }
    let envelope = response
        .json::<TwirpEnvelope<serde_json::Value>>()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;
    if envelope.code != 0 {
        return Err(ApiError::Server {
            code: envelope.code,
            message: envelope_message(&envelope),
        });
    }

    let image_data = envelope
        .data
        .ok_or_else(|| ApiError::Schema("image index response did not include data".to_string()))?;
    let paths = extract_image_paths(&image_data);
    if paths.is_empty() {
        return Err(ApiError::Schema(
            "image index response did not include image paths".to_string(),
        ));
    }

    let urls_json =
        serde_json::to_string(&paths).map_err(|error| ApiError::Schema(error.to_string()))?;
    let mut token_request = client
        .post(IMAGE_TOKEN_ENDPOINT)
        .header(reqwest::header::ORIGIN, OFFICIAL_ORIGIN)
        .header(reqwest::header::REFERER, &reader_referer)
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .form(&[("urls", urls_json.as_str())]);
    if let Some(cookie) = cookies.as_deref().filter(|value| !value.trim().is_empty()) {
        token_request = token_request.header(reqwest::header::COOKIE, cookie);
    }

    let token_response = token_request
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;
    let token_status = token_response.status();
    if !token_status.is_success() {
        return Err(ApiError::Status(token_status.as_u16()));
    }
    let token_envelope = token_response
        .json::<TwirpEnvelope<serde_json::Value>>()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;
    if token_envelope.code != 0 {
        return Err(ApiError::Server {
            code: token_envelope.code,
            message: envelope_message(&token_envelope),
        });
    }

    let token_data = token_envelope
        .data
        .ok_or_else(|| ApiError::Schema("image token response did not include data".to_string()))?;
    let images = extract_tokenized_image_urls(&token_data);
    if images.is_empty() {
        return Err(ApiError::Schema(
            "image token response did not include image URLs".to_string(),
        ));
    }
    Ok(EpisodeImagesResult { images })
}

fn official_reader_referer(comic_id: i64, ep_id: i64) -> String {
    format!("{OFFICIAL_ORIGIN}/detail/mc{comic_id}/{ep_id}?from=manga_homepage")
}

fn extract_image_paths(value: &serde_json::Value) -> Vec<String> {
    value
        .get("images")
        .and_then(|v| v.as_array())
        .map(|items| {
            items
                .iter()
                .filter_map(|item| {
                    item.get("path")
                        .and_then(|path| path.as_str())
                        .map(str::to_string)
                })
                .collect()
        })
        .unwrap_or_default()
}

fn extract_tokenized_image_urls(value: &serde_json::Value) -> Vec<String> {
    let Some(items) = value.as_array() else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| {
            let url = item.get("url").and_then(|v| v.as_str())?;
            let token = item.get("token").and_then(|v| v.as_str()).unwrap_or("");
            if token.is_empty() {
                Some(url.to_string())
            } else if url.contains('?') {
                Some(format!("{url}&token={token}"))
            } else {
                Some(format!("{url}?token={token}"))
            }
        })
        .collect()
}

fn string_value(value: &serde_json::Value, key: &str) -> Option<String> {
    value.get(key).and_then(|v| v.as_str()).map(str::to_string)
}

fn number_value(value: &serde_json::Value, key: &str) -> Option<f64> {
    value
        .get(key)
        .and_then(|v| v.as_f64().or_else(|| v.as_i64().map(|n| n as f64)))
}

fn bool_value(value: &serde_json::Value, key: &str) -> bool {
    value.get(key).and_then(|v| v.as_bool()).unwrap_or(false)
}

pub async fn generate_qrcode() -> Result<QrCodeResult, ApiError> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://passport.bilibili.com/x/passport-login/web/qrcode/generate")
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }

    let envelope = response
        .json::<PassportEnvelope<QrCodeData>>()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;

    if envelope.code != 0 {
        return Err(ApiError::Server {
            code: envelope.code,
            message: envelope.message,
        });
    }

    let data = envelope
        .data
        .ok_or_else(|| ApiError::Schema("QR login response must include data".to_string()))?;

    Ok(QrCodeResult {
        url: data.url,
        qrcode_key: data.qrcode_key,
    })
}

pub async fn poll_login_status(qrcode_key: &str) -> Result<LoginStatus, ApiError> {
    if qrcode_key.trim().is_empty() {
        return Err(ApiError::Validation(
            "qrcode key cannot be empty".to_string(),
        ));
    }

    let client = reqwest::Client::new();
    let response = client
        .get("https://passport.bilibili.com/x/passport-login/web/qrcode/poll")
        .query(&[("qrcode_key", qrcode_key)])
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .send()
        .await
        .map_err(|error| ApiError::Transport(error.to_string()))?;

    let status = response.status();
    if !status.is_success() {
        return Err(ApiError::Status(status.as_u16()));
    }

    let cookies = cookies_from_response_headers(response.headers());
    let envelope = response
        .json::<PassportEnvelope<QrPollData>>()
        .await
        .map_err(|error| ApiError::Schema(error.to_string()))?;

    if envelope.code != 0 {
        return Err(ApiError::Server {
            code: envelope.code,
            message: envelope.message,
        });
    }

    let data = envelope
        .data
        .ok_or_else(|| ApiError::Schema("QR login poll response must include data".to_string()))?;

    match data.code {
        0 => Ok(LoginStatus::Success { cookies }),
        86090 => Ok(LoginStatus::Confirmed),
        86101 => Ok(LoginStatus::Scanning),
        86038 => Ok(LoginStatus::Expired),
        _ => {
            if data.message.contains("扫码") {
                Ok(LoginStatus::Scanning)
            } else {
                Ok(LoginStatus::Failed)
            }
        }
    }
}

fn cookies_from_response_headers(headers: &reqwest::header::HeaderMap) -> Vec<Cookie> {
    headers
        .get_all(reqwest::header::SET_COOKIE)
        .iter()
        .filter_map(|value| value.to_str().ok())
        .filter_map(parse_set_cookie_header)
        .collect()
}

fn parse_set_cookie_header(header: &str) -> Option<Cookie> {
    let mut parts = header.split(';').map(str::trim);
    let name_value = parts.next()?;
    let (name, value) = name_value.split_once('=')?;
    if name.is_empty() {
        return None;
    }

    let mut domain = ".bilibili.com".to_string();
    for part in parts {
        if let Some(value) = part
            .strip_prefix("Domain=")
            .or_else(|| part.strip_prefix("domain="))
        {
            domain = value.to_string();
        }
    }

    Some(Cookie {
        name: name.to_string(),
        value: value.to_string(),
        domain,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_mobile_detail_page_data() {
        let html = r#"<script id="vike_pageContext" type="application/json">{"data":{"seasonData":{"id":33354,"title":"黑化男主顺毛指南","vertical_cover":"v.png","horizontal_cover":"h.png","author_name":["甜漫文化"],"styles":["西幻"],"evaluate":"简介","is_finish":0,"total":1,"ep_list":[{"id":1127034,"ord":1,"short_title":"001","title":"人设预告","cover":"c.png","is_locked":false,"is_in_free":false,"image_count":12,"pub_time":"2024-01-01"}]}}}</script>"#;

        let detail = parse_mobile_detail_page(html).expect("detail should parse");

        assert_eq!(detail.id, 33354);
        assert_eq!(detail.title, "黑化男主顺毛指南");
        assert_eq!(detail.episodes.len(), 1);
        assert_eq!(detail.episodes[0].id, 1127034);
        assert!(!detail.episodes[0].is_locked);
    }

    #[test]
    fn parses_bookshelf_list_with_alias_fields() {
        let data = serde_json::json!({
            "list": [{
                "id": 33354,
                "comic_title": "黑化男主顺毛指南",
                "vcover": "https://i0.hdslb.com/a.jpg",
                "styles": ["西幻"],
                "last_ord": 12,
                "last_short_title": "012"
            }],
            "total": 1,
            "has_more": false
        });
        let result = parse_bookshelf_result(&data, 15).expect("bookshelf should parse");
        assert_eq!(result.total, 1);
        assert!(!result.has_more);
        assert_eq!(result.items[0].comic_id, 33354);
        assert_eq!(result.items[0].title, "黑化男主顺毛指南");
    }

    #[test]
    fn parses_search_result_list_with_missing_optional_fields() {
        let data = serde_json::json!({
            "list": [{
                "id": 33354,
                "title": "黑化男主顺毛指南",
                "vertical_cover": "https://i0.hdslb.com/a.jpg",
                "author_name": ["甜漫文化"],
                "styles": ["西幻"]
            }]
        });
        let comics = parse_comic_list_from_data(&data).expect("search list should parse");
        assert_eq!(comics.len(), 1);
        assert_eq!(comics[0].id, 33354);
        assert_eq!(comics[0].is_finish, 0);
    }

    #[test]
    fn builds_reader_referer_for_episode_requests() {
        assert_eq!(
            official_reader_referer(33354, 1127034),
            "https://manga.bilibili.com/detail/mc33354/1127034?from=manga_homepage"
        );
    }

    #[test]
    fn extracts_image_token_urls() {
        let data = serde_json::json!([
            {"url":"https://i0.hdslb.com/a.jpg", "token":"abc"},
            {"url":"https://i0.hdslb.com/b.jpg?x=1", "token":"def"}
        ]);

        assert_eq!(
            extract_tokenized_image_urls(&data),
            vec![
                "https://i0.hdslb.com/a.jpg?token=abc".to_string(),
                "https://i0.hdslb.com/b.jpg?x=1&token=def".to_string()
            ]
        );
    }

    #[test]
    fn builds_classify_page_url_for_style() {
        assert_eq!(
            public_manga_page_url(999),
            "https://manga.bilibili.com/classify?styles=999&areas=-1&status=-1&prices=-1&orders=0"
        );
        assert_eq!(public_manga_page_url(-1), "https://manga.bilibili.com/");
    }

    #[test]
    fn accepts_only_bilibili_image_hosts() {
        assert_eq!(
            normalize_proxy_image_url("//i0.hdslb.com/bfs/manga-static/a.png").unwrap(),
            "https://i0.hdslb.com/bfs/manga-static/a.png"
        );
        assert!(normalize_proxy_image_url("https://example.com/a.png").is_err());
        assert!(normalize_proxy_image_url("http://i0.hdslb.com/a.png").is_err());
    }

    #[test]
    fn parses_set_cookie_header_with_domain() {
        let cookie =
            parse_set_cookie_header("SESSDATA=abc123; Path=/; Domain=.bilibili.com; HttpOnly")
                .expect("set-cookie should parse");

        assert_eq!(cookie.name, "SESSDATA");
        assert_eq!(cookie.value, "abc123");
        assert_eq!(cookie.domain, ".bilibili.com");
    }

    #[test]
    fn parses_current_vike_page_context_homepage_data() {
        let html = r#"<html><body><script id="vike_pageContext" type="application/json">{"data":{"banner":[{"list":[{"comic":{"comic_id":28241,"title":"从1级开始的异世界骑士","vertical_cover":"https://example.invalid/cover.png","author":["作者A"],"styles":[{"id":999,"name":"热血"}],"is_finish":0,"last_ord":12,"last_short_title":"12"}}]}]}}</script></body></html>"#;

        let result = parse_homepage_comics(html).expect("current homepage JSON should parse");

        assert_eq!(result.total, 1);
        assert_eq!(result.comics[0].id, 28241);
        assert_eq!(result.comics[0].title, "从1级开始的异世界骑士");
        assert_eq!(result.comics[0].author_name, vec!["作者A"]);
        assert_eq!(result.comics[0].styles, vec!["热血"]);
    }

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
