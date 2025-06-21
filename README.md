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

## Podman Support

This project supports running the application using Podman as an alternative to Docker.

### Prerequisites

1.  Install Podman: Follow the instructions for your operating system from the [Podman installation guide](https://podman.io/getting-started/installation).
2.  Install `podman-compose`:

    ```bash
    pip install podman-compose
    ```

### Running the Application with Podman

1.  Build the images:

    ```bash
    ./podman-build.sh
    ```

2.  Bring up the application:

    ```bash
    ./podman-up.sh
    ```

This will build the Docker images using Podman and then bring up the application using `podman-compose`.
