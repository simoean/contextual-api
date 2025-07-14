# Contextual Identity API

This repository contains the **Contextual Identity API** and its integration with various client
applications. The core idea is to allow users to manage their identity attributes and selectively share specific sets of
attributes (contexts) with different client applications, enhancing privacy and user control.

The project is structured as a monorepo containing one Spring Boot backend service and two React frontend applications (
served via Nginx in Docker).

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Technologies Used](#technologies-used)
4. [Setup and Running the Application](#setup-and-running-the-application)
    * [Prerequisites](#prerequisites)
    * [Cloning the Repository](#cloning-the-repository)
    * [Directory Layout for Running](#directory-layout-for-running)
    * [Running the Backend (`api-backend`)](#running-the-backend-api-backend)
    * [Running the Frontend Applications](#running-the-frontend-applications)
    * [Startup Order](#startup-order)
5. [Usage and Demonstration](#usage-and-demonstration)
6. [Cleaning Up](#cleaning-up)
7. [Future Enhancements](#future-enhancements)

## Features

This application demonstrates the following key functionalities:

* **User Authentication:** Basic username/password login.
* **Context Management:** Users can define different identity "contexts" (e.g., Professional, Personal, Academic).
* **Attribute Management:** Users can define various identity attributes (e.g., firstName, email, jobTitle) and
  associate
  them with one or more contexts. Attributes can be marked as public or private.
* **Selective Attribute Sharing (User-Controlled):** When a client application requests identity information, the user
  is
  prompted to explicitly select which *public* attributes within a chosen context to share.
* **User Dashboard:** A dedicated application for users to manage (Create, Read, Update, Delete) their contexts and
  attributes.
* **Client Application Integration:** A sample client demonstrates how an external application integrates with the
  Contextual
  Identity API.

## Project Structure

The repository contains the following modules:

* `api-backend/`:
    * **Type:** Spring Boot REST API.
    * **Purpose:** The core backend service. Manages user data, contexts, and identity attributes. Handles
      authentication
      and serves the API for context and attribute management/retrieval.
    * **Port:** Runs on `http://localhost:8080`.
* `user-dashboard/`:
    * **Type:** React Frontend Application.
    * **Purpose:** Provides a user interface for individuals to manage their own contexts and identity attributes (
      create, read,
      update, delete). This application also handles the central identity provider's login and context selection
      interface
      when an external client needs user authentication or contextual data.
    * **Served via Nginx in Docker on Port:** `http://localhost:3000`.
* `sample-client/`:
    * **Type:** React Frontend Application.
    * **Purpose:** Represents a third-party application that integrates with the Contextual Identity API. Demonstrates
      delegated
      authentication (via the user dashboard's login prompt) and receiving selectively shared contextual identity
      attributes.
    * **Served via Nginx in Docker on Port:** `http://localhost:3200`.

## Technologies Used

* **Backend:**
    * Java 21+
    * Spring Boot 3.x
    * Spring Security
    * Maven
    * Lombok
* **Frontend:**
    * React 18+
    * JavaScript (ES6+)
    * Axios (for API calls)
    * CSS3 (custom styling)
* **Infrastructure/Deployment:**
    * Docker
    * Nginx
    * MongoDB
* **Development Tools:**
    * Git / GitHub
    * IntelliJ IDEA (recommended)

## Setup and Running the Application

To get the entire application stack running on your machine, please follow these steps.

### Prerequisites

Before you begin, ensure you have the following installed:

* **Java Development Kit (JDK):** Version 21 or higher.
    * [Download OpenJDK](https://openjdk.java.net/install/index.html)
* **Docker Desktop:** Required for running the MongoDB database and the Nginx server for frontend applications.
    * [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Cloning the Repository

First, clone this repository to your local machine:

```bash
git clone [https://github.com/simoean/contextual-api.git](https://github.com/simoean/contextual-api.git)
cd contextual-api
```

## Directory Layout for Running

For the Dockerized frontends, ensure your project root (contextual-api/) contains the following structure after building
the frontends:

```
contextual-api/
├── api-backend/
│ └── api-backend.jar # Your built Spring Boot JAR (example name)
│ └── application.properties # Or application.yml
├── user-dashboard/
│ └── build/ # Contains the optimized output of `npm run build`
├── sample-client/
│ └── build/ # Contains the optimized output of `npm run build`
├── dist/
│ └── docker-compose.yml # For defining and running Nginx
│ └── nginx.conf # Nginx configuration for serving frontends
└── ... (other project files and folders)
```

### Running the Backend (api-backend)

Ensure you have built the Spring Boot JAR file (e.g., by running mvn clean package in the api-backend directory).

Navigate to the api-backend directory:

```bash
cd api-backend/target
```

Run the Spring Boot application using its executable JAR:

```bash
java -jar api-backend.jar
```

Note: Replace api-backend.jar with the actual name of your compiled JAR file if it's different.

Expected Output: You should see messages indicating the server is starting, Mongo driver connection and Liquibase
migration running, e.g.:

* Tomcat started on port 8080 (http) with context path '/'.
* Command execution complete

### Running the Frontend Applications

The User Dashboard and Sample Client are served by an Nginx Docker container. This setup also handles the MongoDB
database.

* Ensure Docker Desktop is running.
* Ensure both `user-dashboard` and `sample-client` have been built (e.g., by running `npm run build` in each
  directory).
* Open a new terminal and navigate to the project root directory (dist/):

```bash
cd dist
```

### Start the MongoDB and Nginx containers:

```bash
docker compose up -d
```

This command will:

* Start the contextual-identity-mongo container on port 27017 (without specific user credentials, as discussed).
* Start the nginx container, serving user-dashboard on http://localhost:3000 and sample-client on http://localhost:3200.

Expected Output: Docker will download necessary images (if not already present), build the services, and start the
containers. You should see output indicating services being started.

Verify containers are running:

```bash
docker ps
```

You should see contextual-identity-mongo and contextual-identity-frontend-proxy in the list.

### Testing

Open your browser to:

* User Dashboard: http://localhost:3000/
* Sample Client: http://localhost:3200/

Startup Order
It's recommended to start the applications in this order for a smooth experience:

1. Docker containers (MongoDB and Nginx for frontends)
2. api-backend (Spring Boot JAR)

## Usage and Demonstration

Once all components are running, you can interact with the application:

### User Registration (Dashboard):

* Go to the User Dashboard (http://localhost:3000/).
* Click "Sign Up" and create a new account.

Dashboard Functionality:

* Log in with your newly created account.

* Explore the dashboard: try adding/editing/deleting contexts and attributes.

Client Application Integration:

* Go to the Sample Client (http://localhost:3200/).

* Click the "Login via Contextual Identity" button. This should redirect you to the Identity API's login page (your
  dashboard's sign-in) with client_id and redirect_uri parameters in the URL.

* Log in (or register if you haven't yet).

* Select a context and attributes to share with the client application.

You should be redirected back to the client application, now authenticated with the selected context and attributes
available for use.

Logout:

* In both the User Dashboard and Sample Client, you can log out to end your session.

Log in with a default user:

* You can also test the application with a default user account:

  * Username: john.doe

  * Password: password

This user has pre-defined contexts and attributes for quick testing.

## Cleaning Up
To stop the application and clean up the Docker containers:

* In the terminal running the backend (Spring Boot JAR), press Ctrl+C to stop the process.

* To stop and remove the Nginx and MongoDB Docker containers:

```bash
cd contextual-api # Navigate to your project root if not already there
docker compose down
```

This command will stop and remove all services defined in your docker-compose.yml (Nginx).