use axum::{
    body::Body,
    extract::State,
    http::{header, Request, Response, Uri},
    response::{IntoResponse, Response as AxumResponse},
};
use hyper::client::conn::http1;
use hyper_util::rt::TokioIo;
use std::net::SocketAddr;
use tokio::net::TcpStream;
use tracing::error;

#[derive(Clone)]
pub struct AppState {
    pub auth_service_addr: SocketAddr,
    pub ai_service_addr: SocketAddr,
}

pub async fn auth_proxy(
    State(state): State<AppState>,
    mut req: Request<Body>,
) -> Result<Response<Body>, AxumResponse> {
    let path = req.uri().path();
    let path_query = req
        .uri()
        .path_and_query()
        .map(|v| v.as_str())
        .unwrap_or(path);

    let uri = format!("http://{}{}", state.auth_service_addr, path_query);
    *req.uri_mut() = Uri::try_from(uri).unwrap();

    req.headers_mut().insert(
        "X-Internal-Secret",
        header::HeaderValue::from_str(&std::env::var("INTER_SERVICE_SECRET").unwrap()).unwrap(),
    );

    let host = state.auth_service_addr.ip().to_string();
    let port = state.auth_service_addr.port();

    let stream = match TcpStream::connect(state.auth_service_addr).await {
        Ok(stream) => stream,
        Err(e) => {
            error!("Failed to connect to auth service: {}", e);
            return Err((hyper::StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error").into_response());
        }
    };

    let io = TokioIo::new(stream);
    let (mut sender, conn) = match http1::handshake(io).await {
        Ok((sender, conn)) => (sender, conn),
        Err(e) => {
            error!("Failed to handshake with auth service: {}", e);
            return Err((hyper::StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error").into_response());
        }
    };

    tokio::task::spawn(async move {
        if let Err(err) = conn.await {
            println!("Connection failed: {:?}", err);
        }
    });

    let resp = match sender.send_request(req).await {
        Ok(resp) => resp,
        Err(e) => {
            error!("Failed to send request to auth service: {}", e);
            return Err((hyper::StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error").into_response());
        }
    };

    Ok(resp.map(|_| Body::empty()))
}

pub async fn ai_proxy(
    State(state): State<AppState>,
    mut req: Request<Body>,
) -> Result<Response<Body>, AxumResponse> {
    let path = req.uri().path();
    let path_query = req
        .uri()
        .path_and_query()
        .map(|v| v.as_str())
        .unwrap_or(path);

    let uri = format!("http://{}{}", state.ai_service_addr, path_query);
    *req.uri_mut() = Uri::try_from(uri).unwrap();

    req.headers_mut().insert(
        "X-Internal-Secret",
        header::HeaderValue::from_str(&std::env::var("INTER_SERVICE_SECRET").unwrap()).unwrap(),
    );

    let host = state.ai_service_addr.ip().to_string();
    let port = state.ai_service_addr.port();

    let stream = match TcpStream::connect(state.ai_service_addr).await {
        Ok(stream) => stream,
        Err(e) => {
            error!("Failed to connect to ai service: {}", e);
            return Err((hyper::StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error").into_response());
        }
    };

    let io = TokioIo::new(stream);
    let (mut sender, conn) = match http1::handshake(io).await {
        Ok((sender, conn)) => (sender, conn),
        Err(e) => {
            error!("Failed to handshake with ai service: {}", e);
            return Err((hyper::StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error").into_response());
        }
    };

    tokio::task::spawn(async move {
        if let Err(err) = conn.await {
            println!("Connection failed: {:?}", err);
        }
    });

    let resp = match sender.send_request(req).await {
        Ok(resp) => resp,
        Err(e) => {
            error!("Failed to send request to ai service: {}", e);
            return Err((hyper::StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error").into_response());
        }
    };

    Ok(resp.map(|_| Body::empty()))
}
