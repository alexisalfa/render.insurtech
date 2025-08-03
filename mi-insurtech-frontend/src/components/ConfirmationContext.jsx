// src/components/ConfirmationContext.jsx
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button'; // Asegúrate de que esta ruta sea correcta
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Asegúrate de que esta ruta sea correcta para Shadcn UI


// Crea el contexto
const ConfirmationContext = createContext();

/**
 * Hook personalizado para usar el contexto de confirmación.
 * Permite a los componentes mostrar un diálogo de confirmación.
 * @returns {function(object): Promise<boolean>} Función de confirmación.
 * El objeto debe contener: { title: string, message: string, onConfirm: function }
 */
export const useConfirmation = () => {
  return useContext(ConfirmationContext);
};

/**
 * Proveedor del contexto de confirmación.
 * Envuelve tu aplicación o parte de ella para proporcionar la funcionalidad de confirmación.
 * @param {object} props - Las propiedades del componente.
 * @param {React.ReactNode} props.children - Los componentes hijos.
 */
export const ConfirmationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Almacenamos el objeto completo del diálogo, incluyendo el callback onConfirm
  const [dialogContent, setDialogContent] = useState({ title: '', message: '', onConfirm: () => {} });
  const resolveRef = useRef(null); // Para almacenar la función de resolución de la promesa

  /**
   * Muestra el diálogo de confirmación y devuelve una promesa que se resuelve con true/false.
   * @param {object} options - Objeto con las opciones del diálogo.
   * @param {string} options.title - El título del diálogo.
   * @param {string} options.message - El mensaje del diálogo.
   * @param {function} options.onConfirm - Callback a ejecutar si el usuario confirma.
   * @returns {Promise<boolean>} True si el usuario confirma, false si cancela.
   */
  const confirm = useCallback(({ title, message, onConfirm }) => {
    return new Promise((resolve) => {
      setDialogContent({ title, message, onConfirm }); // Guarda el callback onConfirm también
      setIsOpen(true);
      resolveRef.current = resolve; // Guarda la función resolve para usarla después
    });
  }, []);

  const handleConfirm = () => {
    if (resolveRef.current) {
      resolveRef.current(true); // Resuelve la promesa con true (confirmado)
    }
    // Ejecuta el callback onConfirm si existe
    if (dialogContent.onConfirm) {
      dialogContent.onConfirm();
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolveRef.current) {
      resolveRef.current(false); // Resuelve la promesa con false (cancelado)
    }
    setIsOpen(false);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}> {/* Pasamos un objeto con la función confirm */}
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmationContext.Provider>
  );
};
