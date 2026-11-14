-- Optional due date on a task, separate from scheduled_date (the day a task
-- sits on the Today board). Plain date, interpreted in the user's local time.
alter table tasks add column if not exists due_date date;

-- Sorting / "due soon" lookups per user.
create index if not exists tasks_user_due_date_idx on tasks (user_id, due_date)
  where due_date is not null;
