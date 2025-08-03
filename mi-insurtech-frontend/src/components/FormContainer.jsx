// src/components/FormContainer.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importar componentes de Card si se usan

/**
 * Componente contenedor genérico para formularios que aplica un estilo consistente.
 * Replica el fondo oscuro, padding, bordes redondeados y sombra del formulario de clientes.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {React.ReactNode} props.children - Los elementos hijos que se renderizarán dentro del contenedor (el contenido del formulario).
 * @param {string} [props.title] - Título opcional para el formulario.
 * @param {string} [props.description] - Descripción opcional para el formulario.
 * @param {string} [props.className] - Clases adicionales de Tailwind CSS para el contenedor principal.
 */
function FormContainer({ children, title, description, className }) {
  return (
    // El Card principal que envuelve el formulario con el estilo de fondo oscuro.
    // Combina las clases base con cualquier clase adicional pasada por props.
    <Card className={`w-full max-w-4xl mx-auto bg-gray-900 text-white shadow-xl rounded-lg p-6 md:p-8 ${className || ''}`}>
      {/* Si se proporciona un título, renderiza el CardHeader */}
      {title && (
        <CardHeader className="pb-4 border-b border-gray-700 mb-6">
          <CardTitle className="text-3xl font-bold text-white mb-2">{title}</CardTitle>
          {description && <p className="text-gray-400 text-lg">{description}</p>}
        </CardHeader>
      )}
      {/* El contenido real del formulario se renderiza aquí */}
      <CardContent className="p-0"> {/* p-0 para que el padding lo controle el FormContainer */}
        {children}
      </CardContent>
    </Card>
  );
}

export default FormContainer;
