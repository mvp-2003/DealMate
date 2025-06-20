# DealPal

This is the main repository for the DealPal application, which includes the frontend, backend, and browser extension.

## Backend

The backend is written in Rust using the Axum framework.

### Connecting to Railway Postgres

1.  Ensure you have a `.env` file in the `backend` directory.
2.  Copy the `DATABASE_URL` from the "Public Network" tab of your PostgreSQL instance on Railway.
3.  Add the `DATABASE_URL` to your `.env` file:

    ```
    DATABASE_URL=postgresql://postgres:your_password@your_host:your_port/your_db
    ```

### Running Migrations

This project uses `sqlx-cli` for database migrations.

1.  Install `sqlx-cli`:

    ```bash
    cargo install sqlx-cli
    ```

2.  Create a new migration:

    ```bash
    sqlx migrate add <migration_name>
    ```

3.  Run migrations:

    ```bash
    sqlx migrate run
    ```

### Running the Backend

To run the backend server, navigate to the `backend` directory and run:

```bash
cargo run
```

## Frontend

The frontend is a Next.js application. See the `frontend/README.md` for more details.

## Browser Extension

The browser extension is a simple JavaScript-based extension. See the `browser-extension/README.md` for more details.
