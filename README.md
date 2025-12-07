# Petch

A pet adoption web application that connects pets with loving homes. This application allows breeders and shelters to upload pets for adoption, while users can filter pets based on their preferences to find their perfect match. Petch also offers a pet matchmaking quiz to help users discover compatible pets.

## Prerequisites

Before running this application, ensure you have the following installed:

- **Java 21** (JDK)
- **Maven** (for building the API)
- **Bun** (v1.0 or higher) - Install from [bun.sh](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
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

2. **Set the JWT secret:**

   ```bash
   export JWT_SECRET="$(openssl rand -base64 64)"
   ```

3. **Build and run the API:**

   ```bash
   cd petch-api
   
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
   bun install
   ```

2. **Set environment variables:**

   ```bash
   export SESSION_SECRET="your-session-secret-here"
   ```

3. **Start the development server:**

   ```bash
   bun run dev
   ```

   The web client will start on `http://localhost:3000`.

## Accessing the Application

Once both the API and web client are running:

1. Open your browser and navigate to the web client URL (e.g., `http://localhost:3000`)
2. The frontend will communicate with the backend API at `http://localhost:8080`

## Troubleshooting

- **Database connection errors:** Verify that PostgreSQL is running and your credentials in the `JDBC_POSTGRES_URI` are correct
- **Port conflicts:** If the default ports are in use, you can kill existing processes: `fuser -k 3000/tcp`
- **Build errors:** Ensure you have the correct versions of Java, Maven, and Bun installed
