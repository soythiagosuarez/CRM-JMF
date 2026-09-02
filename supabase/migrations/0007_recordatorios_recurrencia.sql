-- Recordatorios: fecha+hora exacta, frecuencia de repetición, medio de
-- envío (semi-automático: la plataforma arma el link, el usuario lo
-- clickea) y auto-completado cuando hay fecha exacta.
alter table recordatorios
  add column if not exists hora_proxima time,
  add column if not exists frecuencia_tipo text
    check (frecuencia_tipo in ('diario', 'cada_x_dias', 'cada_x_horas_o_minutos')),
  add column if not exists frecuencia_intervalo int,
  add column if not exists frecuencia_unidad text check (frecuencia_unidad in ('minutos', 'horas')),
  add column if not exists medio text check (medio in ('whatsapp', 'sms', 'gmail')),
  add column if not exists auto_completar boolean not null default false;
