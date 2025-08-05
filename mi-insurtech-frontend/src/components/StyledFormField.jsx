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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

const StyledFormField = React.forwardRef(
  (
    {
      label,
      id,
      name,
      type = 'text',
      value,
      onChange,
      onValueChange,
      onDateSelect,
      placeholder,
      required = false,
      error,
      options = [],
      disabled = false,
      className,
      step,
    },
    ref
  ) => {
    let inputValue = value;
    if (type === 'date' && value instanceof Date && !isNaN(value)) {
      inputValue = format(value, "PPP", { locale: es });
    } else if (value === null || value === undefined) {
      inputValue = '';
    } else if (typeof value === 'number') {
      inputValue = String(value);
    }

    const handleInputChange = (e) => {
      if (onChange) {
        onChange(e);
      }
    };

    const handleCalendarSelect = (date) => {
      if (onDateSelect) {
        onDateSelect(date);
      } else if (onChange) {
        onChange({ target: { id: id, value: date } });
      }
    };

    const handleSelectValueChange = (val) => {
      if (onValueChange) {
        onValueChange(val);
      } else if (onChange) {
        onChange({ target: { id: id, value: val } });
      }
    };

    const commonInputClasses = cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
      "rounded-md"
    );

    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={id} className="text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {type === 'select' ? (
          <Select
            value={value !== undefined && value !== null ? String(value) : ""}
            onValueChange={handleSelectValueChange}
            disabled={disabled}
            required={required}
          >
            <SelectTrigger className={cn(commonInputClasses, error ? 'border-red-500' : 'border-gray-300')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg">
              {options.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}> {/* ✨ ¡AQUÍ ESTÁ LA CORRECCIÓN! ✨ */}
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
                onSelect={handleCalendarSelect}
                initialFocus
                locale={es}
                captionLayout="dropdown"
                fromYear={1920}
                toYear={new Date().getFullYear() + 10}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <Input
            type={type}
            id={id}
            name={name}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            ref={ref}
            className={cn(commonInputClasses, error ? 'border-red-500' : 'border-gray-300')}
            value={inputValue}
            onChange={handleInputChange}
            autoComplete="off"
            step={type === 'number' ? step : undefined}
          />
        )}
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

StyledFormField.displayName = 'StyledFormField';

export default StyledFormField;
