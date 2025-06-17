# Contextual Identity API Prototype

This repository contains a prototype demonstrating a **Contextual Identity API** and its integration with various client 
applications. The core idea is to allow users to manage their identity attributes and selectively share specific sets of 
attributes (contexts) with different client applications, enhancing privacy and user control.

The project is structured as a monorepo containing one Spring Boot backend service and three React frontend applications.

## Table of Contents

1.  [Features](#features)
2.  [Project Structure](#project-structure)
3.  [Technologies Used](#technologies-used)
4.  [Setup and Running the Application](#setup-and-running-the-application)
    * [Prerequisites](#prerequisites)
    * [Cloning the Repository](#cloning-the-repository)
    * [Running the Backend (`api-backend`)](#running-the-backend-api-backend)
    * [Running the Frontend Applications](#running-the-frontend-applications)
        * [`login-prompt`](#login-prompt)
        * [`sample-client`](#sample-client)
        * [`user-dashboard`](#user-dashboard)
    * [Startup Order](#startup-order)
5.  [Usage and Demonstration](#usage-and-demonstration)
6.  [Important Notes for Prototype](#important-notes-for-prototype)
7.  [Future Enhancements](#future-enhancements)

## Features

This prototype demonstrates the following key functionalities:

* **User Authentication:** Basic username/password login.
* **Context Management:** Users can define different identity "contexts" (e.g., Professional, Personal, Academic).
* **Attribute Management:** Users can define various identity attributes (e.g., firstName, email, jobTitle) and associate
  them with one or more contexts. Attributes can be marked as public or private.
* **Selective Attribute Sharing (User-Controlled):** When a client application requests identity information, the `login-prompt`
  allows the user to explicitly select which *public* attributes within a chosen context to share.
* **User Dashboard:** A dedicated application for users to manage (Create, Read, Update, Delete) their contexts and attributes.
* **Client Application Integration:** A sample client demonstrates how an external application integrates with the Contextual
  Identity API.

## Project Structure

The repository contains the following modules:

* `api-backend/`:
    * **Type:** Spring Boot REST API.
    * **Purpose:** The core backend service. Manages user data (mocked in memory), contexts, and identity attributes. Handles
      authentication and serves the API for context and attribute management/retrieval.
    * **Port:** Runs on `http://localhost:8080`.
* `login-prompt/`:
    * **Type:** React Frontend Application.
    * **Purpose:** Acts as the central identity provider's login and context selection interface. When an external client (like
      `sample-client` or `user-dashboard`) needs user authentication or contextual data, it redirects/pops up this application.
    * **Port:** Runs on `http://localhost:3000`.
* `sample-client/`:
    * **Type:** React Frontend Application.
    * **Purpose:** Represents a third-party application that integrates with the Contextual Identity API. Demonstrates delegated
      authentication (via `login-prompt`) and receiving selectively shared contextual identity attributes.
    * **Port:** Runs on `http://localhost:3200`.
* `user-dashboard/`:
    * **Type:** React Frontend Application.
    * **Purpose:** Provides a user interface for individuals to manage their own contexts and identity attributes (create, read,
      update, delete). Authentication for the dashboard is also delegated to `login-prompt` but bypasses context selection.
    * **Port:** Runs on `http://localhost:3300`.

## Technologies Used

* **Backend:**
    * Java 17+
    * Spring Boot 3.x
    * Spring Security
    * Maven
    * Lombok
* **Frontend:**
    * React 18+
    * JavaScript (ES6+)
    * Axios (for API calls)
    * CSS3 (custom styling)
* **Development Tools:**
    * Git / GitHub
    * IntelliJ IDEA (recommended)
    * npm / npx

## Setup and Running the Application

### Prerequisites

Before you begin, ensure you have the following installed:

* **Java Development Kit (JDK):** Version 17 or higher.
* **Apache Maven:** Version 3.6 or higher.
* **Node.js and npm:** Node.js 16.x or higher, which includes npm. You can verify with `node -v` and `npm -v`.
* **`create-react-app`:** Install globally if you don't have it: `npm install -g create-react-app` (though `npx` usually handles this).

### Cloning the Repository

First, clone this repository to your local machine:

```bash
git clone https://github.com/simoean/contextual-api.git
cd contextual-api
```

### Running the Backend (`api-backend`)

1.  Navigate into the `api-backend` directory:
    ```bash
    cd api-backend
    ```
2.  Install Maven dependencies (if not already done by your IDE):
    ```bash
    mvn clean install
    ```
3.  Run the Spring Boot application from your IDE (e.g., by running the `ContextualApiApplication` main class) or via Maven:
    ```bash
    mvn spring-boot:run
    ```
    The backend will start on `http://localhost:8080`.

### Running the Frontend Applications

Each frontend application needs to be run in its own terminal window.

#### `login-prompt`

1.  Open a new terminal and navigate to the `login-prompt` directory:
    ```bash
    cd ../login-prompt
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the application (configured to run on port 3000):
    ```bash
    npm start
    ```
    The `login-prompt` will open in your browser, at `http://localhost:3000`.

#### `user-dashboard`

1.  Open a final new terminal and navigate to the `user-dashboard` directory:
    ```bash
    cd ../user-dashboard
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the application (configured to run on port 3300):
    ```bash
    npm start
    ```
    The `user-dashboard` will open in your browser, at `http://localhost:3100`.

#### `sample-client`

1.  Open another new terminal and navigate to the `sample-client` directory:
    ```bash
    cd ../sample-client
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the application (configured to run on port 3200):
    ```bash
    npm start
    ```
    The `sample-client` will open in your browser, at `http://localhost:3200`.

### Startup Order

It's recommended to start the applications in this order for a smooth experience:

1.  `api-backend`
2.  `login-prompt`
3.  `user-dashboard`
4.  `sample-client`

## Future Enhancements

* Refactor code
* Add a React components library.
* Add a theme toggle for frontend applications (light/dark mode).
* Enhance client-side form validation.
* Migrate to JWT (JSON Web Token) based authentication for improved security.
* Integrate a persistent database (e.g., PostgreSQL, MongoDB, Firestore) for the `api-backend`.
* Implement custom modal components for delete confirmations instead of native `window.confirm`.
* Implement user registration.
* Expand the API with more complex attribute types or access control rules.
