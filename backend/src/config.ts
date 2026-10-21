import 'dotenv/config';

function required(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === '') {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const config = {
    port: Number(process.env.PORT ?? 4000),
    databaseUrl: required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/miniledger'),
    pgssl: process.env.PGSSL === 'true',
    jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
    otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 5),
    exposeOtpInResponse: (process.env.EXPOSE_OTP_IN_RESPONSE ?? 'true') === 'true',
    supabase: {
        url: process.env.SUPABASE_URL ?? '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        bucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'receipts',
    },
};
