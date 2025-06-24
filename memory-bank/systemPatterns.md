# System Patterns: DealPal Architecture

This document outlines the architectural design and key technical patterns for the DealPal platform.

## 🏛️ High-Level Architecture

DealPal follows a decoupled, service-oriented architecture. The system consists of three primary components: a Next.js frontend, an Axum (Rust) backend, and a cross-platform browser extension. A PostgreSQL database serves as the single source of truth for all persistent data.

```mermaid
graph TD
    subgraph User-Facing Applications
        A[Browser Extension]
        B[Web Dashboard (Next.js)]
    end

    subgraph Backend Services
        C[Axum REST API (Rust)]
    end

    subgraph Data & Authentication
        D[PostgreSQL Database]
        E[Auth0]
    end

    A -->|Fetches Offers & Data| C
    B -->|Renders Dashboard & Manages Account| C
    C -->|CRUD Operations| D
    C -->|Verifies Tokens| E
    A -->|Authenticates User| E
    B -->|Authenticates User| E
```

## 🎨 Frontend (Next.js)

-   **Framework:** Next.js 14+ with the App Router.
-   **Component Architecture:** We use a modular, reusable component structure, leveraging Shadcn UI for the base component library. Components are organized by feature (e.g., `components/dashboard`, `components/settings`).
-   **State Management:** For simple state, we use React's built-in hooks (`useState`, `useContext`). For more complex, cross-component state, we will evaluate using Zustand or a similar lightweight library if the need arises.
-   **Data Fetching:** Data is fetched from the Axum backend via a centralized API client (`lib/api.ts`). We use Server Actions for mutations to simplify data handling and revalidation.
-   **Styling:** Tailwind CSS is used for all styling, adhering to a design system defined in `tailwind.config.ts`.

## ⚙️ Backend (Axum/Rust)

-   **Framework:** Axum provides a robust and type-safe foundation for our REST API.
-   **API Design:** The API is designed following RESTful principles. Routes are organized by resource (e.g., `/users`, `/deals`, `/rewards`).
-   **Modularity:** The backend is structured into modules for clear separation of concerns:
    -   `routes`: Defines the API endpoints.
    -   `models`: Contains the data structures and database representations.
    -   `db`: Handles database connections and queries.
    -   `error`: Centralizes error handling.
-   **Database Interaction:** We use `sqlx` for asynchronous, compile-time checked SQL queries against our PostgreSQL database.
-   **Authentication:** All protected routes are guarded by middleware that validates JWTs issued by Auth0.

## 🧩 Browser Extension (Manifest V3)

-   **Core Logic:** The extension is built with vanilla JavaScript to remain lightweight and fast.
-   **`content_scripts`:** These scripts are injected into product pages to detect relevant information (product name, price). They communicate with the `background.js` script.
-   **`background.js` (Service Worker):** This is the central hub of the extension. It orchestrates communication between content scripts, the popup, and the backend API. It is responsible for fetching offers and managing extension state.
-   **`popup.js`:** This script powers the UI of the extension's popup, displaying offers and allowing user interaction.
-   **Communication:** A message-passing system is used for communication between the different parts of the extension (`content`, `background`, `popup`).
-   **Security:** The extension operates with minimal permissions and avoids injecting scripts into sensitive pages (e.g., checkout, payment). All backend communication is done via the secure Axum API.

## 🗃️ Database (PostgreSQL)

-   **Schema:** The database schema is managed via migration files located in the `backend/migrations` directory. This ensures a version-controlled and reproducible database structure.
-   **Key Tables:**
    -   `users`: Stores user profile information.
    -   `deals`: Aggregates all types of offers (coupons, discounts, etc.).
    -   `rewards`: Manages user reward programs and points.
    -   `wishlist_items`: Tracks products saved by users.
    -   `price_history`: Logs price changes for tracked products.
