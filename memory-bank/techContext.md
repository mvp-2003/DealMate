# Technical Context: DealPal

This document details the specific technologies, libraries, and tools used to build and maintain the DealPal platform.

## Frontend (Web Dashboard)
-   **Framework:** [Next.js](https://nextjs.org/) 14+ (using App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **UI Library:** [React](https://reactjs.org/) 18
-   **Component Framework:** [Shadcn UI](https://ui.shadcn.com/) - for accessible and composable components.
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) - for utility-first CSS.
-   **Package Manager:** [npm](https://www.npmjs.com/)

## Backend
-   **Framework:** [Axum](https://github.com/tokio-rs/axum)
-   **Language:** [Rust](https://www.rust-lang.org/) (2021 Edition)
-   **Asynchronous Runtime:** [Tokio](https://tokio.rs/)
-   **Database ORM/Driver:** [SQLx](https://github.com/launchbadge/sqlx) - for compile-time checked queries.
-   **Authentication:** [Auth0](https://auth0.com/) - for user authentication and management.
-   **Package Manager:** [Cargo](https://crates.io/)

## Database
-   **Engine:** [PostgreSQL](https://www.postgresql.org/) (Version 14+)
-   **Deployment:** Hosted on [Railway](https://railway.app/) or [Supabase](https://supabase.com/).
-   **Migrations:** Managed with `sqlx-cli`. Migrations are written in plain SQL.

## Browser Extension
-   **Manifest Version:** [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
-   **Core Language:** Plain/Vanilla JavaScript (ES6+) for performance and minimal footprint.
-   **Target Browsers:** Chrome, Firefox, Edge, Safari, Brave.
-   **Bundling/Build Process:** No complex bundler is used at this stage to keep the extension simple.

## Development & Operations (DevOps)
-   **Code Editor:** Visual Studio Code is recommended, with extensions for Rust, TypeScript, and Tailwind CSS.
-   **Version Control:** [Git](https://git-scm.com/), with the repository hosted on a platform like GitHub.
-   **Containerization:** [Docker](https://www.docker.com/) and `docker-compose` for creating a consistent local development environment.
-   **CI/CD:** (To be implemented) A pipeline (e.g., GitHub Actions) will be set up for automated testing, building, and deployment.

## Technical Constraints & Decisions
-   **Performance:** The backend is written in Rust for its performance, safety, and concurrency features. The browser extension uses vanilla JS to minimize its impact on browser performance.
-   **Security:** We follow security best practices, including using JWTs for API authentication, validating all user input, and adhering to the principle of least privilege for the browser extension.
-   **Scalability:** The decoupled architecture allows the frontend, backend, and database to be scaled independently.
-   **Maintainability:** The codebase is organized into logical modules with clear separation of concerns. TypeScript and Rust's strict type systems help ensure code quality and maintainability.
