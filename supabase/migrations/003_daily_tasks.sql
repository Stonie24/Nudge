-- Add recurring flag and scheduled date to tasks
alter table tasks add column if not exists recurring boolean default false;
alter table tasks add column if not exists scheduled_date date default null;

-- Add a daily_completions table to track recurring task completions per day
-- This lets us reset recurring tasks each day without deleting completion history
create table if not exists daily_completions (
    id           uuid primary key default gen_random_uuid(),
    task_id      uuid references tasks(id) on delete cascade not null,
    user_id      uuid references auth.users(id) on delete cascade not null,
    completed_on date not null default current_date,
    unique(task_id, completed_on)
);

alter table daily_completions enable row level security;

create policy "Users can read own completions"
    on daily_completions for select using (auth.uid() = user_id);

create policy "Users can insert own completions"
    on daily_completions for insert with check (auth.uid() = user_id);

create policy "Users can delete own completions"
    on daily_completions for delete using (auth.uid() = user_id);