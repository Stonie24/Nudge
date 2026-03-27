-- Tasks table
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  completed   boolean default false,
  tag         text,
  created_at  timestamptz default now(),
  completed_at timestamptz
);

-- Row-level security: users can only see their own tasks
alter table tasks enable row level security;

create policy "Users can read own tasks"
  on tasks for select using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on tasks for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete using (auth.uid() = user_id);
