-- ==============================================================================
-- LIMPIEZA DE FUNCIONES OBSOLETAS
-- Elimina la versión antigua de crear_empresa que incluía p_digito_verificacion.
-- PostgreSQL identifica las funciones por nombre y tipos de argumentos, 
-- por lo que al cambiar la firma se creó una sobrecarga en lugar de reemplazarla.
-- ==============================================================================

DROP FUNCTION IF EXISTS public.crear_empresa(
    uuid,  -- p_organizacion_id
    text,  -- p_razon_social
    text,  -- p_nit
    text,  -- p_tipo_sociedad
    text,  -- p_email_principal
    text,  -- p_telefono_principal
    text,  -- p_nombre_comercial
    text,  -- p_digito_verificacion (ESTE ES EL QUE SOBRA)
    date,  -- p_fecha_constitucion
    text,  -- p_ciudad_constitucion
    text,  -- p_sector_industria
    text,  -- p_actividad_economica
    text,  -- p_tamano_empresa
    text,  -- p_email_secundario
    text,  -- p_telefono_secundario
    text,  -- p_whatsapp
    text,  -- p_website
    uuid   -- p_representante_legal_id
);

COMMENT ON FUNCTION public.crear_empresa(uuid, text, text, text, text, text, text, date, text, text, text, text, text, text, text, text, uuid) 
IS 'Crea un partner de tipo empresa y su registro base. Nota: No requiere p_digito_verificacion ya que no se utilizará.';
