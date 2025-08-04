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
    // console.log(`DEBUG StyledFormField (${name || id}): type=${type}, received value=`, value);

    const commonInputClasses = 'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
    
    // Función para manejar el cambio en el calendario y propagarlo al padre
    const handleCalendarSelect = (date) => {
      // Si el padre tiene una función onDateSelect, la llamamos.
      // Esto es crucial para asegurar que el componente padre actualice su estado.
      if (onDateSelect) {
        onDateSelect(date);
      }
    };
    
    // Función para manejar el cambio en el select y propagarlo al padre
    const handleSelectChange = (val) => {
      if (onValueChange) {
        onValueChange({ target: { name, value: val } });
      }
    };

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        {type === 'select' ? (
          <Select 
            value={value} 
            onValueChange={handleSelectChange} 
            disabled={disabled}
          >
            <SelectTrigger
              id={id}
              name={name}
              className={cn(commonInputClasses, error ? 'border-red-500' : 'border-gray-300')}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === 'date' ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground',
                  commonInputClasses,
                  error ? 'border-red-500' : 'border-gray-300'
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value instanceof Date && !isNaN(value) ? (
                  format(value, 'PPP', { locale: es })
                ) : (
                  <span>{placeholder}</span>
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
            value={value} // Ahora el valor es directamente la prop
            onChange={onChange} // Y el manejador es directamente la prop
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
