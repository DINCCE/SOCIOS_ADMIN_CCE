"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Search, UserPlus, Check, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

import { crearAsignacionConOrg, buscarAccionesParaAsignar, buscarActoresParaAsignar } from "@/app/actions/asignaciones"
import type { AccionBuscada, ActorBuscado } from "@/app/actions/asignaciones"
import { asignacionSchema, type AsignacionFormValues } from "@/lib/schemas/asignacion-schema"
import { NewPersonSheet } from "@/components/socios/personas/new-person-sheet"

interface CommandItem {
  value: string
  label: string
  data: AccionBuscada | ActorBuscado
}

interface AsignarAccionSheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AsignarAccionSheet({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: AsignarAccionSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const [isPending, setIsPending] = useState(false)

  // Search states for acciones
  const [accionSearch, setAccionSearch] = useState("")
  const [accionResults, setAccionResults] = useState<AccionBuscada[]>([])
  const [isSearchingAcciones, setIsSearchingAcciones] = useState(false)
  const [selectedAccion, setSelectedAccion] = useState<AccionBuscada | null>(null)
  const [accionComboboxOpen, setAccionComboboxOpen] = useState(false)

  // Search states for actores
  const [actorSearch, setActorSearch] = useState("")
  const [actorResults, setActorResults] = useState<ActorBuscado[]>([])
  const [isSearchingActores, setIsSearchingActores] = useState(false)
  const [selectedActor, setSelectedActor] = useState<ActorBuscado | null>(null)
  const [actorComboboxOpen, setActorComboboxOpen] = useState(false)

  // New person sheet
  const [showNewPersonSheet, setShowNewPersonSheet] = useState(false)

  const form = useForm<AsignacionFormValues>({
    resolver: zodResolver(asignacionSchema),
    defaultValues: {
      tipoVinculo: "propietario",
      modalidad: "propiedad",
      planComercial: "regular",
      notas: "",
    },
  })

  // Watch tipoVinculo to filter acciones
  const tipoVinculo = form.watch("tipoVinculo")

  // Debounced search for acciones - also loads initial 5 when combobox opens
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (accionComboboxOpen) {
        setIsSearchingAcciones(true)
        try {
          const result = await buscarAccionesParaAsignar(accionSearch, tipoVinculo)
          setAccionResults(result.success ? result.data : [])
        } catch (error) {
          console.error("Error searching acciones:", error)
          setAccionResults([])
        } finally {
          setIsSearchingAcciones(false)
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [accionSearch, tipoVinculo, accionComboboxOpen])

  // Debounced search for actores
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (actorSearch.length >= 2) {
        setIsSearchingActores(true)
        try {
          const result = await buscarActoresParaAsignar(actorSearch)
          setActorResults(result.success ? result.data : [])
        } catch (error) {
          console.error("Error searching actores:", error)
          setActorResults([])
        } finally {
          setIsSearchingActores(false)
        }
      } else {
        setActorResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [actorSearch])

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setSelectedAccion(null)
      setSelectedActor(null)
      setAccionSearch("")
      setActorSearch("")
      setAccionResults([])
      setActorResults([])
      setAccionComboboxOpen(false)
      setActorComboboxOpen(false)
      form.reset()
    }
  }, [open, form])

  // Handle new person created
  const handlePersonaCreada = (bpId: string) => {
    // The newly created person will be searched automatically
    setActorSearch(bpId)
    setShowNewPersonSheet(false)
  }

  async function onSubmit(data: AsignacionFormValues) {
    setIsPending(true)
    try {
      await crearAsignacionConOrg({
        accionId: data.accionId,
        asociadoId: data.asociadoId,
        tipoVinculo: data.tipoVinculo,
        modalidad: data.modalidad,
        planComercial: data.planComercial,
        notas: data.notas || null,
      })

      toast.success("Acción asignada correctamente")
      form.reset()
      setOpen(false)

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Error creando asignación:", error)
      toast.error("Error al asignar acción", {
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setIsPending(false)
    }
  }

  // Get initials for avatar fallback
  function getInitials(nombre: string): string {
    return nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Asignar Acción
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col p-0 gap-0 border-l shadow-2xl">
          {/* Header */}
          <div className="bg-background shrink-0 px-6 py-6 border-b">
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                Asignar Acción
              </SheetTitle>
              <SheetDescription className="text-base text-muted-foreground mt-1">
                Asigna una acción a un socio, titular o beneficiario
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <Form {...form}>
              <form
                id="asignar-accion-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-10"
              >
                {/* SECCIÓN 1: ACCIÓN */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">1</span>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Selección de Acción
                    </h3>
                    <Separator className="flex-1" />
                  </div>

                  <FormField
                    control={form.control}
                    name="accionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Acción
                        </FormLabel>
                        <Popover open={accionComboboxOpen} onOpenChange={setAccionComboboxOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                type="button"
                                role="combobox"
                                className={cn(
                                  "w-full justify-start h-11 bg-muted/30 border-muted-foreground/20",
                                  !selectedAccion && "text-muted-foreground"
                                )}
                              >
                                <Search className="mr-2 h-4 w-4 opacity-50" />
                                {selectedAccion
                                  ? `${selectedAccion.codigo_accion} - ${selectedAccion.estado}`
                                  : "Buscar acción por código..."}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <div className="p-2">
                              <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Escribe para buscar..."
                                value={accionSearch}
                                onChange={(e) => setAccionSearch(e.target.value)}
                                autoFocus
                              />
                            </div>
                            <ScrollArea className="h-60">
                              {isSearchingAcciones ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              ) : accionResults.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  {accionSearch.length > 0
                                    ? "No se encontraron acciones con ese criterio"
                                    : "No hay acciones disponibles"}
                                </div>
                              ) : (
                                <div className="p-1">
                                  {accionResults.map((accion) => (
                                    <button
                                      key={accion.id}
                                      type="button"
                                      className={cn(
                                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors",
                                        field.value === accion.id && "bg-accent"
                                      )}
                                      onClick={() => {
                                        field.onChange(accion.id)
                                        setSelectedAccion(accion)
                                        setAccionSearch("")
                                        setAccionResults([])
                                        setAccionComboboxOpen(false)
                                      }}
                                    >
                                      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-xs font-mono">
                                        {accion.codigo_accion.slice(-2)}
                                      </div>
                                      <div className="flex-1 text-left">
                                        <div className="font-medium">{accion.codigo_accion}</div>
                                        <div className="text-xs text-muted-foreground">
                                          Estado: {accion.estado}
                                          {accion.organizacion_nombre && (
                                            <span> • {accion.organizacion_nombre}</span>
                                          )}
                                        </div>
                                      </div>
                                      {field.value === accion.id && (
                                        <Check className="h-4 w-4 text-primary" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* SECCIÓN 2: ASOCIADO */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">2</span>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Datos del Asociado
                    </h3>
                    <Separator className="flex-1" />
                  </div>

                  <FormField
                    control={form.control}
                    name="asociadoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Asociado
                        </FormLabel>
                        <Popover open={actorComboboxOpen} onOpenChange={setActorComboboxOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                type="button"
                                role="combobox"
                                className={cn(
                                  "w-full justify-start h-11 bg-muted/30 border-muted-foreground/20",
                                  !selectedActor && "text-muted-foreground"
                                )}
                              >
                                <Search className="mr-2 h-4 w-4 opacity-50" />
                                {selectedActor ? selectedActor.nombre_completo : "Buscar socio por nombre o documento..."}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <div className="p-2">
                              <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Escribe para buscar..."
                                value={actorSearch}
                                onChange={(e) => setActorSearch(e.target.value)}
                                autoFocus
                              />
                            </div>
                            <ScrollArea className="h-72">
                              {isSearchingActores ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              ) : actorResults.length === 0 ? (
                                <div className="py-4">
                                  <p className="text-center text-sm text-muted-foreground mb-3">
                                    {actorSearch.length >= 2
                                      ? "No se encontraron socios"
                                      : "Escribe al menos 2 caracteres para buscar..."}
                                  </p>
                                  {actorSearch.length >= 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => {
                                        setShowNewPersonSheet(true)
                                        setActorSearch("")
                                        setActorResults([])
                                        setActorComboboxOpen(false)
                                      }}
                                    >
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      Crear nueva persona
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="p-1">
                                  {actorResults.map((actor) => (
                                    <button
                                      key={actor.id}
                                      type="button"
                                      className={cn(
                                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors",
                                        field.value === actor.id && "bg-accent"
                                      )}
                                      onClick={() => {
                                        field.onChange(actor.id)
                                        setSelectedActor(actor)
                                        setActorSearch("")
                                        setActorResults([])
                                        setActorComboboxOpen(false)
                                      }}
                                    >
                                      <Avatar className="h-8 w-8">
                                        {actor.foto_url ? (
                                          <AvatarImage src={actor.foto_url} />
                                        ) : (
                                          <AvatarFallback className="text-xs">
                                            {getInitials(actor.nombre_completo)}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <div className="flex-1 text-left">
                                        <div className="font-medium">{actor.nombre_completo}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {actor.identificacion} • {actor.codigo_bp}
                                        </div>
                                      </div>
                                      {field.value === actor.id && (
                                        <Check className="h-4 w-4 text-primary" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* SECCIÓN 3: TIPO DE VÍNCULO */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">3</span>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Tipo de Vínculo
                    </h3>
                    <Separator className="flex-1" />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tipoVinculo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                            Tipo de Vínculo
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="propietario">Propietario</SelectItem>
                              <SelectItem value="titular">Titular</SelectItem>
                              <SelectItem value="beneficiario">Beneficiario</SelectItem>
                              <SelectItem value="intermediario">Intermediario</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="modalidad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                              Modalidad
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="propiedad">Propiedad</SelectItem>
                                <SelectItem value="comodato">Comodato</SelectItem>
                                <SelectItem value="asignacion_corp">
                                  Asignación Corp.
                                </SelectItem>
                                <SelectItem value="convenio">Convenio</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="planComercial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                              Plan Comercial
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="plan dorado">Plan Dorado</SelectItem>
                                <SelectItem value="joven ejecutivo">
                                  Joven Ejecutivo
                                </SelectItem>
                                <SelectItem value="honorifico">Honorífico</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 4: NOTAS (OPCIONAL) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">4</span>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Información Adicional
                    </h3>
                    <Separator className="flex-1" />
                  </div>

                  <FormField
                    control={form.control}
                    name="notas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Notas (Opcional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="bg-muted/30 border-muted-foreground/20 resize-none"
                            placeholder="Agrega notas adicionales sobre esta asignación..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
            <SheetFooter className="sm:justify-start">
              <Button
                type="submit"
                form="asignar-accion-form"
                className="w-full h-12 font-bold tracking-tight text-base shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Asignar Acción"
                )}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* Nested NewPersonSheet */}
      <NewPersonSheet
        open={showNewPersonSheet}
        onOpenChange={setShowNewPersonSheet}
        onSuccess={handlePersonaCreada}
      />
    </>
  )
}
