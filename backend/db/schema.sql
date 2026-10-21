-- MiniLedger schema. Idempotent: safe to run more than once.
-- Apply with: npm run migrate

create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists otp_codes (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code        text not null,
  expires_at  timestamptz not null,
  consumed    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists otp_codes_phone_idx on otp_codes (phone);

create table if not exists loans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  friend_name  text not null,
  amount       numeric(12,2) not null check (amount > 0),
  due_date     date not null,
  repaid       boolean not null default false,
  repaid_at    timestamptz,
  receipt_url  text,
  created_at   timestamptz not null default now()
);

create index if not exists loans_user_id_idx on loans (user_id);
