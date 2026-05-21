# user-profile-poc

This repository contains a small user management proof-of-concept with two applications:

- `node/user-management` — TypeScript Express API (MySQL)
- `react/user-management` — React + Vite frontend

**This README**: installation steps, how to run both apps, and database schema details.

**Prerequisites**

- Node.js (recommended >= 22 for the backend)
- npm
- MySQL or MariaDB server

**Database (schema)**

The backend uses a `user_management` database with a single `profiles` table. You can create it manually from the provided schema file or let the backend auto-create the table on startup.

- Schema file: `node/user-management/schema.sql`

SQL (profiles table):

```sql
CREATE DATABASE IF NOT EXISTS user_management;
USE user_management;

CREATE TABLE IF NOT EXISTS profiles (
	id INT AUTO_INCREMENT PRIMARY KEY,
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	dob DATE NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	country ENUM('US', 'India') NOT NULL,
	city VARCHAR(100) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

You can apply the schema using the MySQL CLI:

```bash
mysql -u <db_user> -p < node/user-management/schema.sql
```

Or rely on the backend which runs an `initDatabase` routine and will create the `profiles` table automatically when it connects.

---

## Backend (TypeScript Express)

1. Open a terminal and install dependencies:

```bash
cd node/user-management
npm install
```

2. Create a `.env` file in `node/user-management` to configure the database connection (example):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=user_management
PORT=5000
```

3. Development (run without building):

```bash
# run directly with ts-node
npx ts-node src/main.ts
```

4. Production / build + run:

```bash
npm run build
npm start
```

The backend listens on `http://localhost:5000` by default (or the `PORT` you set).

---

## Frontend (React + Vite)

1. Open a terminal and install dependencies:

```bash
cd react/user-management
npm install
```

2. Run the dev server:

```bash
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:5000` by default (see `vite.config.ts`). The frontend will be available at `http://localhost:5173` (or the port Vite chooses).

---

## Running both apps locally

1. Ensure MySQL is running and either apply `schema.sql` or let the backend create the table.
2. Start the backend (in `node/user-management`):

```bash
npx ts-node src/main.ts
```

3. Start the frontend (in `react/user-management`):

```bash
npm run dev
```

Open the frontend in your browser and the app will call the backend API via the Vite proxy.

---

## Notes

- The backend will attempt to create the `profiles` table on startup if it does not exist.
- The `email` column has a `UNIQUE` constraint — attempting to insert a duplicate email will result in a 409 conflict returned by the API.
- If you need to run tests, the Node service includes a `test` script (`npm test`). The React app includes basic unit-tests with Vitest (`npm test` from `react/user-management`).

If you'd like, I can add quick `docker-compose` files to run MySQL + the apps in containers.
