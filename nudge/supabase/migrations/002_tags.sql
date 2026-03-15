create table tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table tags enable row level security;

create policy "Users can read own tags"
  on tags for select using (auth.uid() = user_id);

create policy "Users can insert own tags"
  on tags for insert with check (auth.uid() = user_id);

create policy "Users can delete own tags"
  on tags for delete using (auth.uid() = user_id);