// src/components/ui/toaster.jsx
import * as React from "react"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastAction, // Asegurarse de importar ToastAction también
  ToastClose, // Asegurarse de importar ToastClose también
} from "@/components/ui/toast" // Componentes de Shadcn UI Toast
import { useToast } from "@/lib/use-toast" // Hook de Shadcn UI useToast

// Este es el componente Toaster principal que se exporta y usa en App.jsx
// y se encarga de renderizar todos los Toast individuales.
export function Toaster() {
  const { toasts } = useToast() // Obtiene la lista de toasts del contexto

  return (
    <ToastProvider> {/* Contenedor principal de los toasts */}
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}> {/* Renderiza cada toast individual */}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action} {/* Renderiza cualquier acción (botón de deshacer, etc.) */}
            <ToastClose /> {/* Botón de cerrar para el toast */}
          </Toast>
        )
      })}
      <ToastViewport /> {/* El viewport donde se posicionan los toasts */}
    </ToastProvider>
  )
}
