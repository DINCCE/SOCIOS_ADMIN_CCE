import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  IdCard,
  Building2,
  Factory,
  Users,
  Scale,
  AlertTriangle,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  Briefcase,
  DollarSign,
} from "lucide-react"

export interface FilterOption {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

// Opciones de filtro para Personas - Estado
export const personasEstadoOptions: FilterOption[] = [
  { value: "activo", label: "Activo", icon: CheckCircle2 },
  { value: "inactivo", label: "Inactivo", icon: XCircle },
  { value: "suspendido", label: "Suspendido", icon: HelpCircle },
]

// Opciones de filtro para Personas - Tipo de Documento
// Valores según la base de datos: CC, CE, PA, PEP, PPT, TI
export const personasTipoDocOptions: FilterOption[] = [
  { value: "CC", label: "Cédula", icon: IdCard },
  { value: "CE", label: "Cédula Extranjería", icon: IdCard },
  { value: "TI", label: "T.I", icon: IdCard },
  { value: "PA", label: "Pasaporte", icon: IdCard },
  { value: "PEP", label: "PEP", icon: IdCard },
  { value: "PPT", label: "PPT", icon: IdCard },
]

// Tags son dinámicos - se extraen de los datos en runtime
export const getPersonaTagsOptions = (data: any[]): FilterOption[] => {
  const uniqueTags = new Set<string>()
  data.forEach((item) => {
    (item.tags || []).forEach((tag: string) => uniqueTags.add(tag))
  })
  return Array.from(uniqueTags)
    .sort()
    .map((tag) => ({ value: tag, label: tag }))
}

// ============================================================================
// EMPRESAS
// ============================================================================

// Opciones de filtro para Empresas - Estado
export const empresasEstadoOptions: FilterOption[] = [
  { value: "activo", label: "Activo", icon: CheckCircle2 },
  { value: "inactivo", label: "Inactivo", icon: XCircle },
  { value: "suspendido", label: "Suspendido", icon: HelpCircle },
]

// Opciones de filtro para Empresas - Tamaño
export const empresasTamanoOptions: FilterOption[] = [
  { value: "micro", label: "Micro (1-10)", icon: Users },
  { value: "pequena", label: "Pequeña (11-50)", icon: Users },
  { value: "mediana", label: "Mediana (51-200)", icon: Building2 },
  { value: "grande", label: "Grande (200+)", icon: Factory },
]

// Opciones de filtro para Empresas - Tipo Sociedad
// Valores en DB: SAS, LTDA, SA
export const empresasTipoSociedadOptions: FilterOption[] = [
  { value: "SAS", label: "SAS", icon: Scale },
  { value: "LTDA", label: "LTDA", icon: Scale },
  { value: "SA", label: "SA", icon: Scale },
  { value: "EU", label: "E.U.", icon: Scale },
  { value: "COOPERATIVA", label: "Cooperativa", icon: Scale },
  { value: "FUNDACION", label: "Fundación", icon: Scale },
  { value: "ASOCIACION", label: "Asociación", icon: Scale },
]

// Tags dinámicos para Empresas
export const getEmpresaTagsOptions = (data: any[]): FilterOption[] => {
  const uniqueTags = new Set<string>()
  data.forEach((item) => {
    (item.tags || []).forEach((tag: string) => uniqueTags.add(tag))
  })
  return Array.from(uniqueTags).sort().map((tag) => ({ value: tag, label: tag }))
}

// Opciones de filtro para Empresas - Sector
export const empresasSectorOptions: FilterOption[] = [
  { value: "Tecnología", label: "Tecnología", icon: Briefcase },
  { value: "Servicios", label: "Servicios", icon: Briefcase },
  { value: "Manufactura", label: "Manufactura", icon: Factory },
  { value: "Comercio", label: "Comercio", icon: Building2 },
  { value: "Construcción", label: "Construcción", icon: Factory },
  { value: "Finanzas", label: "Finanzas", icon: DollarSign },
  { value: "Salud", label: "Salud", icon: Briefcase },
  { value: "Educación", label: "Educación", icon: Briefcase },
  { value: "Agricultura", label: "Agricultura", icon: Factory },
  { value: "Otro", label: "Otro", icon: Briefcase },
]

// Opciones de filtro para Empresas - Ingresos Anuales (rangos en millones COP)
export const empresasIngresosOptions: FilterOption[] = [
  { value: "0-500", label: "< $500M", icon: DollarSign },
  { value: "500-1000", label: "$500M - $1B", icon: DollarSign },
  { value: "1000-5000", label: "$1B - $5B", icon: DollarSign },
  { value: "5000-10000", label: "$5B - $10B", icon: DollarSign },
  { value: "10000+", label: "> $10B", icon: DollarSign },
]

// Opciones de filtro para Empresas - Número de Empleados
export const empresasEmpleadosOptions: FilterOption[] = [
  { value: "0-10", label: "1-10", icon: Users },
  { value: "11-50", label: "11-50", icon: Users },
  { value: "51-200", label: "51-200", icon: Users },
  { value: "201-500", label: "201-500", icon: Users },
  { value: "500+", label: "500+", icon: Factory },
]

// Sector dinámico para Empresas (extraído de los datos)
export const getEmpresaSectorOptions = (data: any[]): FilterOption[] => {
  const uniqueSectores = new Set<string>()
  data.forEach((item) => {
    if (item.sector_industria) {
      uniqueSectores.add(item.sector_industria)
    }
  })
  return Array.from(uniqueSectores)
    .sort()
    .map((sector) => ({ value: sector, label: sector, icon: Briefcase }))
}

// ============================================================================
// OPORTUNIDADES
// ============================================================================

// Opciones de filtro para Oportunidades - Estado
export const oportunidadesEstadoOptions: FilterOption[] = [
  { value: "pendiente", label: "Pendiente", icon: HelpCircle },
  { value: "en_proceso", label: "En Proceso", icon: CheckCircle2 },
  { value: "aprobada", label: "Aprobada", icon: CheckCircle2 },
  { value: "rechazada", label: "Rechazada", icon: XCircle },
]

// Opciones de filtro para Oportunidades - Tipo
export const oportunidadesTipoOptions: FilterOption[] = [
  { value: "Solicitud Retiro", label: "Retiro", icon: XCircle },
  { value: "Solicitud Ingreso", label: "Ingreso", icon: CheckCircle2 },
]

// Tags dinámicos para Oportunidades
export const getOportunidadTagsOptions = (data: any[]): FilterOption[] => {
  const uniqueTags = new Set<string>()
  data.forEach((item) => {
    (item.tags || []).forEach((tag: string) => uniqueTags.add(tag))
  })
  return Array.from(uniqueTags).sort().map((tag) => ({ value: tag, label: tag }))
}

// ============================================================================
// TAREAS
// ============================================================================

// Opciones de filtro para Tareas - Prioridad
export const tareasPrioridadOptions: FilterOption[] = [
  { value: "critica", label: "Crítica", icon: AlertTriangle },
  { value: "alta", label: "Alta", icon: ArrowUpCircle },
  { value: "media", label: "Media", icon: ArrowRightCircle },
  { value: "baja", label: "Baja", icon: ArrowDownCircle },
]

// Opciones de filtro para Tareas - Estado
export const tareasEstadoOptions: FilterOption[] = [
  { value: "pendiente", label: "Pendiente", icon: HelpCircle },
  { value: "en_progreso", label: "En Progreso", icon: ArrowRightCircle },
  { value: "completada", label: "Completada", icon: CheckCircle2 },
  { value: "cancelada", label: "Cancelada", icon: XCircle },
]

// Tags dinámicos para Tareas
export const getTareaTagsOptions = (data: any[]): FilterOption[] => {
  const uniqueTags = new Set<string>()
  data.forEach((item) => {
    (item.tags || []).forEach((tag: string) => uniqueTags.add(tag))
  })
  return Array.from(uniqueTags).sort().map((tag) => ({ value: tag, label: tag }))
}
