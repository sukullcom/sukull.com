-- Ayrıntılı "bugün kazanılan" gösterimi (60/50, 120/50) için; points-previous
-- senkron dışında kaldığında dahi sayaç doğru toplar.
alter table if exists user_progress
  add column if not exists daily_points_earned integer not null default 0;
