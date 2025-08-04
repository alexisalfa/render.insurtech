// src/components/StyledFormField.jsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils'; // Para clases condicionales
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Importar el locale español
import { CalendarIcon } from 'lucide-react'; // Icono de calendario

const StyledFormField = React.forwardRef(
  (
    {
      label,
      id,
      name,
      type = 'text',
      value, // Valor que recibe del formulario padre
      onChange, // Función onChange que recibe del formulario padre (para Input)
      onValueChange, // Función onValueChange que recibe del formulario padre (para Select)
      onDateSelect, // Función onDateSelect que recibe del formulario padre (para Calendar)
      placeholder,
      required = false,
      error,
      options = [], // Para type='select'
      disabled = false,
      className, // Para aplicar estilos adicionales al div contenedor
      step, // Para inputs de tipo number
    },
    ref
  ) => {
    // console.log(`DEBUG StyledFormField (${name || id}): type=${type}, received value=`, value, `(typeof: ${typeof value}, instanceof Date: ${value instanceof Date})`);

    // Determinar el valor a pasar al input HTML
    let inputValue = value;
    if (type === 'date' && value instanceof Date && !isNaN(value)) {
      inputValue = format(value, "PPP", { locale: es });
    } else if (value === null || value === undefined) {
      inputValue = '';
    } else if (typeof value === 'number') {
      inputValue = String(value);
    }

    // Manejador de cambios para inputs de texto/número
    const handleInputChange = (e) => {
      // console.log(`DEBUG StyledFormField (${name || id}): handleInputChange called with value:`, e.target.value);
      if (onChange) { // Asegurarse de que onChange exista antes de llamarlo
        onChange(e);
      }
    };

    // Manejador de cambios para el calendario
    // Este es el ajuste clave. Ahora se asegura de pasar la fecha directamente.
    const handleCalendarSelect = (date) => {
      // console.log(`DEBUG StyledFormField (${name || id}): handleCalendarSelect called with date:`, date);
      // Se da prioridad a onDateSelect si está disponible.
      if (onDateSelect) { 
        onDateSelect(date);
      } else if (onChange) { 
        // Si no hay onDateSelect, se usa onChange con un evento sintético.
        onChange({ target: { id: id, value: date } });
      }
    };

    // Manejador de cambios para el select
    const handleSelectValueChange = (val) => {
      // console.log(`DEBUG StyledFormField (${name || id}): handleSelectValueChange called with value:`, val);
      if (onValueChange) { // Priorizar onValueChange si existe
        onValueChange(val);
      } else if (onChange) { // Fallback: si no hay onValueChange, usar onChange con un evento sintético
        onChange({ target: { id: id, value: val } });
      }
    };


    // Common input classes
    const commonInputClasses = cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100", // Colores de fondo y texto
      "rounded-md" // Asegurar esquinas redondeadas
    );

    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={id} className="text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {type === 'select' ? (
          <Select
            value={value !== undefined && value !== null ? String(value) : ""} // Asegura que el valor sea string para SelectItem
            onValueChange={handleSelectValueChange} // Usar el manejador interno
            disabled={disabled}
            required={required}
          >
            <SelectTrigger className={cn(commonInputClasses, error ? 'border-red-500' : 'border-gray-300')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg">
              {options.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === 'date' ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal rounded-md",
                  !value && "text-muted-foreground",
                  commonInputClasses,
                  error ? 'border-red-500' : 'border-gray-300'
                )}
                disabled={disabled}
                required={required}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value instanceof Date && !isNaN(value) ? (
                  format(value, "PPP", { locale: es })
                ) : (
                  <span>{placeholder || "Selecciona una fecha"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg">
              <Calendar
                mode="single"
                selected={value instanceof Date && !isNaN(value) ? value : undefined}
                onSelect={handleCalendarSelect} // Se asegura de que el manejador interno sea llamado
                initialFocus
                locale={es} // Establecer idioma español para el calendario
                captionLayout="dropdown"
                fromYear={1920}
                toYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>
        ) : (
          // Renderizar Input normal para otros tipos (texto, email, tel, number, etc.)
          <Input
            type={type}
            id={id}
            name={name}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            ref={ref}
            className={cn(commonInputClasses, error ? 'border-red-500' : 'border-gray-300')} // Aplicar estilos comunes y de error
            value={inputValue} // Asegura que el valor del input esté vinculado al estado
            onChange={handleInputChange} // Asegura que los cambios se propaguen al estado
            autoComplete="off" // Deshabilita el autocompletar del navegador
            step={type === 'number' ? step : undefined} // Añadir la prop step solo para tipo number
          />
        )}
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

StyledFormField.displayName = 'StyledFormField';

export default StyledFormField;