# Contextual Identity API - Intermediate Project Submission for Peer Testing

**Project Title:** Contextual Identity API
**Project template:** Identity and profile management API
**Author:** Antonio Simoes
**Submission Date:** July 14, 2025

---

## 1. Introduction

This submission represents an intermediate state of my Computer Science final project: a Contextual Identity API. The
goal of this phase is to gather early feedback on the core functionalities, user experience of the dashboard, and the
ease of integrating with the client application.

Your feedback is invaluable for shaping the next stages of development!

---

## 2. System Overview

The application consists of the following main components:

* **Backend (Spring Boot/Java):** The core API that handles user management, authentication, context, and attribute
  storage.
* **User Dashboard (React/Vite):** A web interface for users to manage their contexts and attributes.
* **Sample Client (React/Vite):** A simple demonstration application that integrates with the Contextual Identity API
  for authentication and data access.
* **MongoDB:** The database used for persistent storage.

---

## 3. How to Run the Application (Local Setup)

To get the entire application stack running on your machine, please follow these steps. You will need **Docker**
installed for the Nginx and MongoDB setup.

### 3.1. Prerequisites

* **Java Development Kit (JDK) 21+:** Ensure you have the JDK installed and configured.
    * [Download OpenJDK](https://openjdk.java.net/install/index.html)
* **Docker Desktop:** Required for running MongoDB easily.
    * [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 3.2. Database Setup (MongoDB with Docker)

First, let's start the MongoDB container with the necessary credentials.

1. **Ensure Docker is running.**
2. Open your terminal/command prompt and run the following command:

   ```bash
   cd ./contextual-api
   docker run -d --name contextual-identity-mongo -p 27017:27017 mongo:latest 
   ```
    * This command will:
        * `-d`: Run the container in detached mode (background).
        * `--name contextual-identity-mongo`: Give the container a friendly name.
        * `-p 27017:27017`: Map the container's MongoDB port to your host's port 27017.
        * `mongo:latest`: Use the latest official MongoDB Docker image.

3. Verify the container is running:
   ```bash
   docker ps
   ```
   You should see `contextual-identity-mongo` in the list.

### 3.3. Application Components

Each component needs to be run separately. Please open **a new terminal window/tab for each component.**

#### 3.3.1. Backend API (Spring Boot)

1. Navigate to the backend directory where the built JAR file is located:
   ```bash
   cd api-backend
   ```

2. Run the Spring Boot application using its executable JAR:
   ```bash
   java -jar api-backend.jar
   ```

* **Expected Output:** You should see messages indicating the server is starting, Mongo driver connection and Liquibase
  migration running, e.g.:
    * `Tomcat started on port 8080 (http) with context path '/'`.
    * `Command execution complete`

#### 3.3.2. Frontend Applications (User Dashboard & Sample Client)

The User Dashboard and Sample Client will be served by an Nginx Docker container.

1. On a new terminal window, nNavigate to the root directory of the project where `docker-compose.yml` is located:
   ```bash
   cd ..
   ```

2. Start the Nginx container:
   ```bash
   docker compose up -d nginx
   ```

* **Expected Output:** Docker will download the Nginx image (if not already present), build the service, and start the
  container. You should see output like `[+] Running 1/0` and then `[+] Running 1/1` if successful.
* Open your browser to:
    * **User Dashboard:** `http://localhost:3000/`
    * **Sample Client:** `http://localhost:3200/`

---

## 4. Testing Workflow

Once all components are running, you can interact with the application. Please follow these steps to explore the core
functionalities:

1. **User Registration (Dashboard):**
    * Go to the User Dashboard (`http://localhost:3000/`).
    * Click "Sign Up" and create a new account.
2. **Dashboard Functionality:**
    * Log in with your newly created account.
    * Explore the dashboard: try adding/editing/deleting contexts and attributes.
3. **Client Application Integration:**
    * Go to the Sample Client (`http://localhost:3200/`).
    * Click the "Login via Contextual Identity" button. This should redirect you to the Identity API's login page (your
      dashboard's sign-in if running correctly) with `client_id` and `redirect_uri` parameters in the URL.
    * Log in (or register if you haven't yet).
    * Select a context and attributes to share with the client application.
    * You should be redirected back to the client application, now authenticated with the selected context and
      attributes available for use.
4. **Logout:**
    * In both the User Dashboard and Sample Client, you can log out to end your session.
5. **Log in with a default user:**
    * You can also test the application with a default user account:
        * **Username:** `john.doe`
        * **Password:** `password`
    * This user has pre-defined contexts and attributes for quick testing.

---

## 5. Cleaning Up

To stop the application and clean up the Docker container:

1. In the terminal running the backend (Spring Boot JAR), press `Ctrl+C` to stop the process.
2. To stop the frontend Nginx container:
   ```bash
   docker compose down
   ```
   This will stop and remove the `nginx` service defined in your `docker-compose.yml`.
3. To stop and remove the MongoDB Docker container:
   ```bash
   docker stop contextual-identity-mongo
   docker rm contextual-identity-mongo
   ```

---

## 6. Feedback Questions for Reviewers

Thank you for testing the application! Your detailed feedback on the following questions is invaluable for the next
stages of this project. Please answer each question on a 5-point Likert scale:

* **Disagree**
* **Partially Disagree**
* **Neither Agree Nor Disagree**
* **Partially Agree**
* **Agree**

---

### Question 1: Assessing Granular Control and Privacy (Core Value Proposition)

**Statement:** "The Contextual Identity API system (including the login-prompt and user-dashboard) effectively provides
me with granular control over which personal attributes are shared with external client applications."

**Guidance for you, the reviewer:** If you felt you had clear and precise control over what data was shared, select '
Agree'. If you felt forced to share too much, lacked options, or the mechanism for control was unclear, select '
Disagree'.

### Question 2: Clarity of Core Concepts and System Flow

**Statement:** "The distinction between 'Contexts' and 'Identity Attributes' within the User
Dashboard (http://localhost:3000/) was clear, and the overall process of managing and sharing my identity data flowed
logically."

**Guidance for you, the reviewer:** If the concepts of 'Contexts' versus 'Attributes' made sense, and the steps to
manage them in the dashboard and share them felt natural, select 'Agree'. If any part was confusing or disjointed,
select 'Disagree'.

### Question 3: Perceived Security and Reliability

**Statement:** "From a user's perspective, the authentication process (logging in via the login-prompt or direct login,
and subsequent access to my dashboard data) felt secure and reliable."

**Guidance for you, the reviewer:** If the login felt robust, the application's responses were consistent, and you felt
confident in the handling of your data, select 'Agree'. If you experienced errors, glitches, or had concerns about data
security during the process, select 'Disagree'.

---

## 7. Feedback Mechanism

Please provide your feedback. Try to be as specific as possible, including:

* Which step you were on
* What you expected to happen
* What actually happened
* Any error messages (screenshots are very helpful!)
* Suggestions for improvement

Thank you for your time and effort!