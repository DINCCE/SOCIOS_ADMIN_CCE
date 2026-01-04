/**
 * Test data factory utilities
 * Provides factory functions for creating test data objects
 */

import type { PersonFormValues } from '@/lib/schemas/person-schema'

/**
 * Generate a test organization ID
 */
export function generateTestOrganizationId(): string {
  return '00000000-0000-0000-0000-000000000000'
}

/**
 * Generate a test persona ID
 */
export function generateTestPersonaId(): string {
  return '11111111-1111-1111-1111-111111111111'
}

/**
 * Generate a test empresa ID
 */
export function generateTestEmpresaId(): string {
  return '22222222-2222-2222-2222-222222222222'
}

/**
 * Create a test PersonFormValues object
 */
export function createTestPersonFormValues(overrides: Partial<PersonFormValues> = {}): PersonFormValues {
  return {
    primer_nombre: 'Juan',
    segundo_nombre: 'Carlos',
    primer_apellido: 'Pérez',
    segundo_apellido: 'García',
    tipo_documento: 'CC',
    numero_documento: '1234567890',
    email_principal: 'juan.perez@example.com',
    telefono_principal: '+57 300 123 4567',
    fecha_nacimiento: '1990-01-15',
    genero: 'masculino',
    estado_civil: 'soltero',
    nacionalidad: 'CO',
    lugar_nacimiento: 'Bogotá',
    ocupacion: 'Ingeniero',
    profesion: 'Ingeniero de Sistemas',
    nivel_educacion: 'pregrado',
    tipo_sangre: 'O+',
    eps: 'EPS Sura',
    fecha_socio: '2020-01-01',
    fecha_aniversario: '2020-01-15',
    estado_vital: 'vivo',
    tags: ['VIP', 'ACTIVO'],
    email_secundario: 'juan.perez2@example.com',
    telefono_secundario: '+57 310 987 6543',
    whatsapp: '+57 300 123 4567',
    linkedin_url: 'https://linkedin.com/in/juanperez',
    facebook_url: 'https://facebook.com/juanperez',
    instagram_handle: '@juanperez',
    twitter_handle: '@juanperez',
    contacto_emergencia_id: undefined,
    relacion_emergencia: undefined,
    estado: 'activo',
    ...overrides,
  }
}

/**
 * Create a test organization object
 */
export function createTestOrganization(overrides: Record<string, unknown> = {}) {
  return {
    id: generateTestOrganizationId(),
    nombre: 'Test Organization',
    nit: '900123456-1',
    direccion: 'Calle 123 # 45-67',
    ciudad: 'Bogotá',
    pais: 'Colombia',
    telefono: '+57 1 123 4567',
    email: 'contact@testorg.com',
    estado: 'ACTIVO',
    ...overrides,
  }
}

/**
 * Create a test business partner object
 */
export function createTestBusinessPartner(overrides: Record<string, unknown> = {}) {
  return {
    id: generateTestPersonaId(),
    organization_id: generateTestOrganizationId(),
    tipo: 'PERSONA',
    codigo_bp: 'BP-000001',
    estado: 'ACTIVO',
    email_principal: 'test@example.com',
    telefono_principal: '+57 300 123 4567',
    ...overrides,
  }
}

/**
 * Create a test RPC response for crear_persona
 */
export function createTestPersonaRPCResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    bp_id: generateTestPersonaId(),
    codigo_bp: 'BP-000001',
    message: 'Persona creada exitosamente',
    warnings: null,
    ...overrides,
  }
}

/**
 * Create a test RPC response for crear_empresa
 */
export function createTestEmpresaRPCResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    bp_id: generateTestEmpresaId(),
    codigo_bp: 'BP-000002',
    message: 'Empresa creada exitosamente',
    warnings: null,
    ...overrides,
  }
}

/**
 * Create a test relationship object
 */
export function createTestRelationship(overrides: Record<string, unknown> = {}) {
  return {
    id: '33333333-3333-3333-3333-333333333333',
    bp_origen_id: generateTestPersonaId(),
    bp_destino_id: generateTestEmpresaId(),
    tipo_relacion: 'EMPLEADO',
    fecha_inicio: '2020-01-01',
    fecha_fin: null,
    estado: 'ACTIVO',
    ...overrides,
  }
}

/**
 * Create a test action (accion) object
 */
export function createTestAction(overrides: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    organization_id: generateTestOrganizationId(),
    codigo_accion: 'ACC-000001',
    tipo_accion: 'ORDINARIA',
    valor_nominal: 1000000,
    estado: 'EMITIDA',
    ...overrides,
  }
}

/**
 * Create a test opportunity object
 */
export function createTestOpportunity(overrides: Record<string, unknown> = {}) {
  return {
    id: '55555555-5555-5555-5555-555555555555',
    organization_id: generateTestOrganizationId(),
    titulo: 'Test Opportunity',
    descripcion: 'Test description',
    estado: 'NUEVA',
    prioridad: 'ALTA',
    ...overrides,
  }
}

/**
 * Create a test task object
 */
export function createTestTask(overrides: Record<string, unknown> = {}) {
  return {
    id: '66666666-6666-6666-6666-666666666666',
    organization_id: generateTestOrganizationId(),
    titulo: 'Test Task',
    descripcion: 'Test description',
    estado: 'PENDIENTE',
    prioridad: 'ALTA',
    fecha_vencimiento: '2026-02-01',
    ...overrides,
  }
}
