-- Flat checklist (subtasks) stored on the task itself:
--   [{ "id": "…", "title": "Buy flour", "done": false }, …]
-- Kept on the row rather than in a separate table so it follows the task
-- everywhere (offline queue, undo, delete account) with no extra policies.
alter table tasks add column if not exists checklist jsonb not null default '[]'::jsonb;
