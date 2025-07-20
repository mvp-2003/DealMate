# Master Dockerfile for DealPal
# Multi-stage build for all services
# Supports: linux/amd64, linux/arm64

# ====================
# Base images
# ====================
FROM --platform=$BUILDPLATFORM rust:1.82-slim as rust-base
FROM --platform=$BUILDPLATFORM python:3.12-slim as python-base
FROM --platform=$BUILDPLATFORM node:20-alpine as node-base

# ====================
# Rust Backend Builder
# ====================
FROM rust-base as backend-builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend source
COPY backend/Cargo.toml backend/Cargo.lock ./

# Copy shared crate to the expected relative location
COPY shared ../shared

RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release && rm -rf src target/release/dealpal-backend*

COPY backend/src ./src
COPY backend/migrations ./migrations
RUN cargo build --release

# ====================
# Python AI Service Builder
# ====================
FROM python-base as ai-builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
    libffi-dev \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install Python dependencies
COPY backend/ai-service/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# ====================
# Node.js Frontend Builder
# ====================
FROM node-base as frontend-builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Copy and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

# Copy frontend source
COPY frontend ./frontend
COPY shared ./shared
COPY .eslintrc.json ./
COPY frontend/tsconfig.json ./

# Build frontend
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AI_API_URL
ARG NEXT_PUBLIC_AUTH0_DOMAIN
ARG NEXT_PUBLIC_AUTH0_CLIENT_ID
ARG NEXT_PUBLIC_AUTH0_REDIRECT_URI

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ====================
# Backend Runtime
# ====================
FROM --platform=$TARGETPLATFORM debian:bookworm-slim as backend-runtime

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash dealpal

WORKDIR /app

COPY --from=backend-builder --chown=dealpal:dealpal /app/target/release/dealpal-backend ./dealpal-backend
COPY --from=backend-builder --chown=dealpal:dealpal /app/migrations ./migrations

USER dealpal
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["./dealpal-backend"]

# ====================
# AI Service Runtime
# ====================
FROM --platform=$TARGETPLATFORM python:3.12-slim as ai-runtime

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash dealpal

COPY --from=ai-builder /opt/venv /opt/venv

WORKDIR /app
COPY --chown=dealpal:dealpal backend/ai-service .

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

USER dealpal
EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]

# ====================
# Frontend Runtime
# ====================
FROM --platform=$TARGETPLATFORM node:20-alpine as frontend-runtime

RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=9002 \
    HOSTNAME="0.0.0.0"

COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package.json ./package.json
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 9002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:9002/api/health || exit 1

CMD ["node", "server.js"]

# ====================
# Auth Service Runtime
# ====================
FROM --platform=$TARGETPLATFORM node:20-alpine as auth-runtime

RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 authservice

WORKDIR /app

# Copy package files and install production dependencies
COPY --from=frontend-builder /app/package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# Copy auth service code
COPY --chown=authservice:nodejs backend/auth-service ./backend/auth-service

ENV NODE_ENV=production \
    PORT=3001

USER authservice
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "run", "start:auth"]

# ====================
# Default target is backend
# ====================
FROM backend-runtime
