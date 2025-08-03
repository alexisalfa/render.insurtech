// src/components/PrimaryButton.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react'; // Para el icono de carga

/**
 * Componente de botón primario estilizado.
 * Replica el estilo del botón "Crear Cliente".
 *
 * @param {object} props - Las propiedades del componente.
 * @param {React.ReactNode} props.children - El contenido del botón (texto, icono, etc.).
 * @param {function} props.onClick - Función de callback al hacer clic.
 * @param {boolean} [props.disabled] - Si el botón está deshabilitado.
 * @param {string} [props.className] - Clases adicionales de Tailwind CSS.
 * @param {boolean} [props.isLoading] - Si el botón debe mostrar un spinner de carga.
 * @param {string} [props.type] - Tipo de botón ('submit', 'button', 'reset').
 */
function PrimaryButton({ children, onClick, disabled, className, isLoading, type = 'button' }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6
        rounded-md transition-colors duration-200 shadow-lg hover:shadow-xl
        flex items-center justify-center
        ${className || ''}
      `}
      type={type}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export default PrimaryButton;
