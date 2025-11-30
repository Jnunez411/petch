# Petch

A pet adoption web application that connects pets with loving homes. This application allows breeders and shelters to upload pets for adoption, while users can filter pets based on their preferences to find their perfect match. Petch also offers a pet matchmaking quiz to help users discover compatible pets.

## Prerequisites

Before running this application, ensure you have the following installed:

- **Java 21** (JDK)
- **Maven** (for building the API)
- **Node.js** (version 16 or higher) and **npm**
- **PostgreSQL** (version 12 or higher)

## Running Locally Setup Instructions

### 1. Database Setup

First, ensure PostgreSQL is running on your machine. Then create a database for the application:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database (if it doesn't exist)
CREATE DATABASE petch;

# Exit PostgreSQL
\q
```

### 2. Petch API (Backend)

Navigate to the root project directory and follow these steps:

1. **Configure the database connection:**

   Set the `JDBC_POSTGRES_URI` environment variable with your database credentials:

   ```bash
   export JDBC_POSTGRES_URI="jdbc:postgresql://localhost:5432/petch?user=your_username&password=your_password"
   ```

   Replace `your_username` and `your_password` with your PostgreSQL credentials.

2. **Build and run the API:**

   ```bash
   # Clean and install dependencies
   mvn clean install

   # Start the Spring Boot application
   mvn spring-boot:run
   ```

   The API will start on `http://localhost:8080` (default Spring Boot port).

### 3. Web Client (Frontend)

Navigate to the `web-client` directory and follow these steps:

1. **Install dependencies:**

   ```bash
   cd web-client
   npm install
   ```

2. **Build the project:**

   ```bash
   npm run build
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

   The web client will typically start on `http://localhost:3000` or `http://localhost:5173` (depending on your build tool).

## Accessing the Application

Once both the API and web client are running:

1. Open your browser and navigate to the web client URL (e.g., `http://localhost:3000`)
2. The frontend will communicate with the backend API at `http://localhost:8080`

## Troubleshooting

- **Database connection errors:** Verify that PostgreSQL is running and your credentials in the `JDBC_POSTGRES_URI` are correct
- **Port conflicts:** If the default ports are in use, you can configure different ports in the application configuration files
- **Build errors:** Ensure you have the correct versions of Java, Maven, and Node.js installed