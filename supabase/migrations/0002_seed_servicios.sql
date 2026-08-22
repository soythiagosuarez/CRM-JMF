-- Catálogo real de servicios de JMF — ESPECIFICACION.md §6.3.1.
-- Se inserta solo si la tabla está vacía, para no duplicar si se corre
-- más de una vez ni pisar ediciones que ya haya hecho el equipo.

insert into servicios (nombre, fases, tiempo_estimado, puerta_a_puerta, mantenimiento_intervalo_meses, renovacion_meses)
select * from (values
  ('PPF',
    '["Lavado","Descontaminado","Lavado de motor","Limpieza de interior","Pulido","Aplicación de PPF"]'::jsonb,
    '5 días', true, 3, 96),
  ('Tratamiento cerámico',
    '["Lavado","Descontaminado","Lavado de motor","Limpieza de interior","Pulido","Sellador cerámico"]'::jsonb,
    '5 días', true, 1, null),
  ('Tratamiento acrílico',
    '["Lavado","Descontaminado","Lavado de motor","Limpieza de interior","Pulido","Sellador cerámico"]'::jsonb,
    '5 días', true, 1, null),
  ('Lavado premium',
    '["Lavado de carrocería","Lavado de llantas","Limpieza de interior"]'::jsonb,
    '5 horas', true, null, null),
  ('Limpieza de interior full',
    '["Desarmado","Limpieza de paneles","Limpieza de periféricos","Armado","Acondicionado"]'::jsonb,
    '2 días', true, null, null),
  ('Limpieza de motor',
    '["Pre preparado","Limpieza de motor","Acondicionado"]'::jsonb,
    '5 horas', true, null, null),
  ('Restauración de ópticas',
    '["Lijado","Pulido","Sellado"]'::jsonb,
    '1 día', true, null, null),
  ('Sacabollo',
    '["Preparación","Desabollado"]'::jsonb,
    'Depende del bollo', true, null, null),
  ('Polarizado',
    '["Molde de cristales","Limpieza de cristales","Colocación"]'::jsonb,
    '1 día', true, null, null),
  ('Restauración de llantas',
    '["Reparación","Pintura"]'::jsonb,
    '3 días', true, null, null)
) as datos(nombre, fases, tiempo_estimado, puerta_a_puerta, mantenimiento_intervalo_meses, renovacion_meses)
where not exists (select 1 from servicios);
