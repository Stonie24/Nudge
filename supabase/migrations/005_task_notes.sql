-- Free-text notes field for the task detail sheet
alter table tasks add column if not exists notes text;
