"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={true}
      expand={true}
      duration={4000}
      toastOptions={{
        classNames: {
          // Base toast: fondo limpio, sombra suave, borde sutil
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-sm",

          // Título: semibold para jerarquía visual
          title: "group-[.toast]:font-semibold group-[.toast]:text-foreground",

          // Descripción: gris suave, ya con font-mono aplicado desde useNotify
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",

          // Botones de acción: elegantes y sutiles
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:transition-colors",

          // Bordes laterales coloreados para cada tipo
          success:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-emerald-600 dark:group-[.toaster]:border-l-emerald-500",
          error:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-rose-600 dark:group-[.toaster]:border-l-rose-500",
          warning:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-600 dark:group-[.toaster]:border-l-amber-500",
          info:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-blue-600 dark:group-[.toaster]:border-l-blue-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
