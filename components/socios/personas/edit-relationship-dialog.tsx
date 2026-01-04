"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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
import { Button } from "@/components/ui/button"

import { editarTipoParentesco } from "@/app/actions/relaciones"

const editRelationshipSchema = z.object({
  tipo_parentesco: z.enum(["esposo_a", "hijo_a", "padre_madre", "hermano_a", "otro"]),
})

type EditRelationshipFormValues = z.infer<typeof editRelationshipSchema>

interface EditRelationshipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  relacion_id: string
  current_tipo_parentesco: string
  onSuccess?: () => void
}

export function EditRelationshipDialog({
  open,
  onOpenChange,
  relacion_id,
  current_tipo_parentesco,
  onSuccess,
}: EditRelationshipDialogProps) {
  const [isPending, setIsPending] = useState(false)

  const form = useForm<EditRelationshipFormValues>({
    resolver: zodResolver(editRelationshipSchema),
    defaultValues: {
      tipo_parentesco: current_tipo_parentesco as any,
    },
  })

  async function onSubmit(data: EditRelationshipFormValues) {
    setIsPending(true)
    try {
      const result = await editarTipoParentesco(
        relacion_id,
        data.tipo_parentesco
      )

      if (result.success) {
        toast.success("Parentesco actualizado correctamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      console.error("Error updating relationship:", err)
      toast.error("Error al actualizar parentesco")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Parentesco</SheetTitle>
          <SheetDescription>
            Cambia el tipo de relación familiar.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="tipo_parentesco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Parentesco</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar parentesco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="esposo_a">Cónyuge</SelectItem>
                      <SelectItem value="hijo_a">Hijo/a</SelectItem>
                      <SelectItem value="padre_madre">Padre/Madre</SelectItem>
                      <SelectItem value="hermano_a">Hermano/a</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter className="mt-6">
          <Button
            type="submit"
            disabled={isPending}
            onClick={() => form.handleSubmit(onSubmit)()}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
