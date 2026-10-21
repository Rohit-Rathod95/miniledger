import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.pgssl ? { rejectUnauthorized: false } : undefined,
});

export const query = <T extends Record<string, unknown>>(
    text: string,
    params?: unknown[]
) => pool.query<T>(text, params);
