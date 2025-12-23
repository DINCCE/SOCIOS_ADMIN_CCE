-- ==============================================================================
-- MIGRACIÓN DE COMENTARIOS (METADATA) PARA LA BASE DE DATOS
-- Sincronización oficial con docs/database/TABLES.md
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA: organizations
-- ------------------------------------------------------------------------------
COMMENT ON TABLE organizations IS 'Tabla de organizaciones que implementa el sistema multi-tenancy y jerarquía estructural.';
COMMENT ON COLUMN organizations.id IS 'Identificador único (PK) de la organización.';
COMMENT ON COLUMN organizations.nombre IS 'Nombre legal o descriptivo de la organización.';
COMMENT ON COLUMN organizations.slug IS 'Identificador único para URLs y selección rápida.';
COMMENT ON COLUMN organizations.tipo IS 'Clasificación: ''club'', ''sede'' o ''division''.';
COMMENT ON COLUMN organizations.organizacion_padre_id IS 'Referencia a la organización superior en la jerarquía.';
COMMENT ON COLUMN organizations.email IS 'Email institucional de la organización.';
COMMENT ON COLUMN organizations.telefono IS 'Teléfono principal de contacto.';
COMMENT ON COLUMN organizations.website IS 'Sitio web oficial.';
COMMENT ON COLUMN organizations.direccion IS 'Objeto JSONB con país, ciudad, dirección_linea1, etc.';
COMMENT ON COLUMN organizations.configuracion IS 'Configuración técnica y funcional específica (JSONB).';
COMMENT ON COLUMN organizations.creado_en IS 'Fecha y hora de creación del registro.';
COMMENT ON COLUMN organizations.actualizado_en IS 'Fecha y hora de la última modificación.';

-- ------------------------------------------------------------------------------
-- 2. TABLA: business_partners
-- ------------------------------------------------------------------------------
COMMENT ON TABLE business_partners IS 'Entidad base (Actor) del patrón Class Table Inheritance (CTI). Agrupa campos comunes de personas y empresas.';
COMMENT ON COLUMN business_partners.id IS 'Identificador único (PK) de negocio compartido con la especialización.';
COMMENT ON COLUMN business_partners.codigo_bp IS 'Código único autogenerado con formato BP-0000001.';
COMMENT ON COLUMN business_partners.tipo_actor IS 'Discriminador de la herencia: ''persona'' o ''empresa''.';
COMMENT ON COLUMN business_partners.organizacion_id IS 'ID de la organización a la que pertenece el socio.';
COMMENT ON COLUMN business_partners.estado IS 'Estado actual: ''activo'', ''inactivo'' o ''suspendido''.';
COMMENT ON COLUMN business_partners.email_principal IS 'Contacto de correo electrónico principal.';
COMMENT ON COLUMN business_partners.telefono_principal IS 'Contacto telefónico principal (10 dígitos en Colombia).';
COMMENT ON COLUMN business_partners.creado_en IS 'Fecha y hora de creación.';
COMMENT ON COLUMN business_partners.creado_por IS 'UUID del usuario/app que creó el registro.';
COMMENT ON COLUMN business_partners.actualizado_en IS 'Fecha y hora de la última modificación.';
COMMENT ON COLUMN business_partners.actualizado_por IS 'UUID del usuario/app que actualizó el registro.';
COMMENT ON COLUMN business_partners.eliminado_en IS 'Marca de tiempo para Soft Delete.';
COMMENT ON COLUMN business_partners.eliminado_por IS 'UUID del usuario que realizó la eliminación soft.';

-- ------------------------------------------------------------------------------
-- 3. TABLA: personas
-- ------------------------------------------------------------------------------
COMMENT ON TABLE personas IS 'Especialización para personas físicas. Depende de business_partners.';
COMMENT ON COLUMN personas.id IS 'PK compartida y FK hacia business_partners(id).';
COMMENT ON COLUMN personas.tipo_documento IS 'Tipo de documento (CC, CE, TI, PA, RC, NIT, PEP, PPT, DNI, NUIP).';
COMMENT ON COLUMN personas.numero_documento IS 'Número de identificación único (Solo números).';
COMMENT ON COLUMN personas.fecha_expedicion IS 'Fecha de emisión del documento de identidad.';
COMMENT ON COLUMN personas.primer_nombre IS 'Primer nombre obligatorio.';
COMMENT ON COLUMN personas.segundo_nombre IS 'Nombres adicionales (Opcional).';
COMMENT ON COLUMN personas.primer_apellido IS 'Primer apellido obligatorio.';
COMMENT ON COLUMN personas.segundo_apellido IS 'Segundo apellido (Opcional).';
COMMENT ON COLUMN personas.genero IS 'Identidad de género: (masculino, femenino, otro, no_especifica).';
COMMENT ON COLUMN personas.fecha_nacimiento IS 'Fecha de nacimiento (Validado para mayores de 18 años).';
COMMENT ON COLUMN personas.nacionalidad IS 'Código ISO de nacionalidad (Default: CO).';
COMMENT ON COLUMN personas.email_secundario IS 'Correo electrónico adicional de contacto.';
COMMENT ON COLUMN personas.telefono_secundario IS 'Teléfono adicional de 10 dígitos.';
COMMENT ON COLUMN personas.whatsapp IS 'Número de WhatsApp (10 dígitos).';
COMMENT ON COLUMN personas.contacto_emergencia_id IS 'Referencia a otro socio de tipo persona para emergencias.';
COMMENT ON COLUMN personas.atributos IS 'JSONB con información extendida (direcciones, info médica, etc).';

-- ------------------------------------------------------------------------------
-- 4. TABLA: empresas
-- ------------------------------------------------------------------------------
COMMENT ON TABLE empresas IS 'Especialización para personas jurídicas/empresas. Depende de business_partners.';
COMMENT ON COLUMN empresas.id IS 'PK compartida y FK hacia business_partners(id).';
COMMENT ON COLUMN empresas.nit IS 'Número de Identificación Tributaria (Solo números).';
COMMENT ON COLUMN empresas.digito_verificacion IS 'Dígito de control del NIT (Calculado vía Módulo 11).';
COMMENT ON COLUMN empresas.razon_social IS 'Nombre legal completo de la empresa.';
COMMENT ON COLUMN empresas.nombre_comercial IS 'Nombre de marca o aviso comercial.';
COMMENT ON COLUMN empresas.tipo_sociedad IS 'Naturaleza jurídica (SAS, SA, LTDA, etc).';
COMMENT ON COLUMN empresas.tamano_empresa IS 'Clasificación por tamaño (micro, pequena, mediana, grande).';
COMMENT ON COLUMN empresas.email_secundario IS 'Email corporativo adicional.';
COMMENT ON COLUMN empresas.telefono_secundario IS 'Teléfono adicional de 10 dígitos.';
COMMENT ON COLUMN empresas.whatsapp IS 'WhatsApp corporativo (10 dígitos).';
COMMENT ON COLUMN empresas.website IS 'URL del sitio web corporativo.';
COMMENT ON COLUMN empresas.logo_url IS 'URL pública del logo de la empresa.';
COMMENT ON COLUMN empresas.representante_legal_id IS 'FK hacia personas(id) del representante legal.';

-- ------------------------------------------------------------------------------
-- 5. TABLA: bp_relaciones
-- ------------------------------------------------------------------------------
COMMENT ON TABLE bp_relaciones IS 'Gestiona los vínculos (laborales, familiares, comerciales) entre socios de negocio.';
COMMENT ON COLUMN bp_relaciones.bp_origen_id IS 'Actor que inicia la relación (Hijo, Empleado, etc).';
COMMENT ON COLUMN bp_relaciones.bp_destino_id IS 'Actor que recibe la relación (Padre, Empresa, etc).';
COMMENT ON COLUMN bp_relaciones.tipo_relacion IS 'Categoría: familiar, laboral, referencia, membresia, comercial, otra.';
COMMENT ON COLUMN bp_relaciones.rol_origen IS 'Rol específico del origen en el contexto de la relación.';
COMMENT ON COLUMN bp_relaciones.rol_destino IS 'Rol específico del destino en el contexto de la relación.';
COMMENT ON COLUMN bp_relaciones.es_bidireccional IS 'Indica si la relación debe consultarse desde ambos sentidos automáticamente.';

-- ------------------------------------------------------------------------------
-- 6. FUNCIONES RPC
-- ------------------------------------------------------------------------------
COMMENT ON FUNCTION crear_persona(uuid, text, text, text, text, text, date, text, text, text, text, text, text, text, text, text, text, text, text) 
IS 'API Central para crear personas de forma atómica. Valida formatos, duplicados y edad.';

COMMENT ON FUNCTION crear_empresa(uuid, text, text, text, text, text, text, text, date, text, text, text, text, text, text, text, text, uuid) 
IS 'API Central para crear empresas. Autocalcula el dígito de verificación del NIT si no se envía.';

COMMENT ON FUNCTION calcular_digito_verificacion_nit(text) 
IS 'Implementación del algoritmo Módulo 11 para NITs de Colombia según estándar DIAN.';

COMMENT ON FUNCTION generar_codigo_bp() 
IS 'Trigger function para asignar el código secuencial BP-000000X antes del insert.';
