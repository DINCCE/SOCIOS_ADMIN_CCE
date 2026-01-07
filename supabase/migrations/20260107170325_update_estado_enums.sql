-- Update estado_oportunidad_enum to match current data
ALTER TYPE estado_oportunidad_enum RENAME VALUE 'abierta' TO 'nueva';
ALTER TYPE estado_oportunidad_enum RENAME VALUE 'cancelada' TO 'descartada';

-- Update estado_tarea_enum to match current data
ALTER TYPE estado_tarea_enum RENAME VALUE 'bloqueada' TO 'pausada';
ALTER TYPE estado_tarea_enum RENAME VALUE 'hecha' TO 'terminada';
