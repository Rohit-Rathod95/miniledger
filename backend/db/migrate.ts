import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from '../src/db';
import { config } from '../src/config';

async function main() {
    const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

    // Mask credentials before logging the target.
    const safeTarget = config.databaseUrl.replace(/:\/\/[^@]*@/, '://***@');
    console.log(`Applying schema to ${safeTarget}`);

    await pool.query(sql);
    console.log('Schema applied successfully.');
    await pool.end();
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
