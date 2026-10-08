-- Supabase Dashboard -> SQL Editor mein ye paste karke RUN karein

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password text not null,
  reset_password_token text,
  reset_password_expire timestamptz,
  created_at timestamptz default now()
);

-- Table ko public access se band rakho (server service key se access karta hai)
alter table users enable row level security;
