/**
 * PRODUCTION TYPESCRIPT EXPRESS / MYSQL SERVER
 * * To setup your TypeScript back-end workspace, execute the following:
 * 1. Initialize project structure:
 * mkdir backend-ts && cd backend-ts
 * npm init -y
 * * 2. Install primary production dependencies:
 * npm install express mysql2 cors dotenv
 * * 3. Install development dependencies for TypeScript compilation:
 * npm install -D typescript ts-node @types/node @types/express @types/cors @types/mysql2
 * * 4. Run database setup with the schema.sql script inside your MySQL server instance.
 * 5. Run this file with:
 * npx ts-node main.ts
 */

import express, { Application } from 'express';
import mysql, { Pool } from 'mysql2/promise';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { getAllProfiles, createProfile, updateProfile, deleteProfile } from './controllers/profile';
import { ProfileService } from './services/profile';

dotenv.config();

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Database Connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'user_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const initDatabase = async (pool: Pool) => {
  await pool.execute(`
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
    ) ENGINE=InnoDB;
  `);
};

const startServer = async () => {
  try {
    const pool = mysql.createPool(dbConfig);
    await initDatabase(pool);

    const profileService = new ProfileService(pool);

    app.get('/api/profiles', getAllProfiles(profileService));
    app.post('/api/profiles', createProfile(profileService));
    app.put('/api/profiles/:id', updateProfile(profileService));
    app.delete('/api/profiles/:id', deleteProfile(profileService));

    app.listen(PORT, () => {
      console.log(`[TypeScript Server]: Running actively on host port: http://localhost:${PORT}`);
    });

    console.log(`[TypeScript Server]: MySQL Connected to pool on DB: ${dbConfig.database}`);
  } catch (err) {
    console.error('[TypeScript Server]: Application startup failed', err);
  }
};

startServer();
