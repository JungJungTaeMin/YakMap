create extension if not exists pg_trgm;

create table if not exists public.medicines (
  id text primary key,
  name text not null,
  maker text not null,
  category text not null check (category in ('일반약', '전문약')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medication_schedules (
  id text,
  user_email text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  email text primary key,
  name text not null,
  provider text not null check (provider in ('email', 'google')),
  password_hash text,
  password_salt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_refresh_tokens (
  token_hash text primary key,
  user_email text not null references public.app_users(email) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

insert into public.medicines (id, name, maker, category)
values
  ('tylenol-500', '타이레놀정 500mg', '한국존슨앤드존슨', '일반약'),
  ('geborin', '게보린', '삼진제약', '일반약'),
  ('lipitor', '리피토정', '한국화이자제약', '전문약'),
  ('crestor', '크레스토정', '한국아스트라제네카', '전문약')
on conflict (id) do update set
  name = excluded.name,
  maker = excluded.maker,
  category = excluded.category,
  updated_at = now();

delete from public.medication_schedules
where id is null or user_email is null;

delete from public.medication_schedules older
using public.medication_schedules newer
where older.ctid < newer.ctid
  and older.user_email = newer.user_email
  and older.id = newer.id;

alter table public.medication_schedules
  alter column id set not null,
  alter column user_email set not null;

alter table public.medication_schedules
  drop constraint if exists medication_schedules_pkey;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'medication_schedules_pkey'
      and conrelid = 'public.medication_schedules'::regclass
  ) then
    alter table public.medication_schedules
      add constraint medication_schedules_pkey primary key (user_email, id);
  end if;
end
$$;

create index if not exists medication_schedules_user_email_idx
  on public.medication_schedules (user_email, updated_at desc);

create index if not exists app_users_provider_idx
  on public.app_users (provider);

create index if not exists app_refresh_tokens_user_email_idx
  on public.app_refresh_tokens (user_email, expires_at desc);

create index if not exists medicines_name_idx
  on public.medicines using gin (name gin_trgm_ops);

create index if not exists medicines_maker_idx
  on public.medicines using gin (maker gin_trgm_ops);
