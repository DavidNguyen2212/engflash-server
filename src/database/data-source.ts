import { DataSource } from "typeorm";
import { config } from "dotenv";

// Load env
config()

// Validate required environment variables
const requiredEnvVars = ['DATABASE_HOST', 'DATABASE_USERNAME', 'DATABASE_PASSWORD', 'DATABASE_NAME', 'DATABASE_PORT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
}

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [
        process.env.NODE_ENV === 'production' 
          ? 'dist/**/*.entity.js'
          : 'src/**/*.entity.ts'
      ],
    migrations: [
        process.env.NODE_ENV == 'production'
        ? 'dist/database/migrations/*.js'
        : 'src/database/migrations/*.ts'
    ],
    // Production settings
    synchronize: process.env.TYPEORM_SYNC === 'true', // NEVER true in production
    logging: process.env.NODE_ENV === 'development' ? true : ['error', 'warn'],
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: process.env.TYPEORM_RUN_MIGRATIONS === 'true',
    extra: {
        max: Number(process.env.DB_CONNECTION_LIMIT) || 10, // for pg
        idleTimeoutMillis: Number(process.env.DB_TIMEOUT) || 60000,
        connectionTimeoutMillis: Number(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
    },
    ssl: true
    // ssl: process.env.DB_SSL === 'true' ? {
    //     rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    //   } : false,
})