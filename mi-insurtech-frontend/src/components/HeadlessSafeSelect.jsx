// src/components/HeadlessSafeSelect.jsx
import React, { Fragment, useState, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, Loader2, ChevronDown, ChevronUp } from 'lucide-react'; // Importar ChevronDown y ChevronUp
import { Label } from '@/components/ui/label';

/**
 * Componente de selección seguro y accesible con Headless UI.
 * @param {object} props - Las propiedades del componente.
 * @param {Array<{id: any, label: string}>} props.options - Array de opciones { id, label }.
 * @param {any} props.value - El valor seleccionado actualmente (corresponde al 'id' de la opción).
 * @param {function} props.onChange - Callback cuando el valor cambia.
 * @param {string} [props.placeholder] - Texto a mostrar cuando no hay nada seleccionado.
 * @param {string} [props.className] - Clases CSS adicionales para el contenedor principal.
 * @param {string} [props.buttonClassName] - Clases CSS adicionales para el botón del select.
 * @param {string} [props.selectedClassName] - Clases CSS adicionales para el texto del valor seleccionado.
 * @param {string} [props.label] - Etiqueta opcional para el select.
 * @param {boolean} [props.loading] - Indica si las opciones están cargando.
 * @param {boolean} [props.required] - Indica si el campo es requerido (para validación HTML5).
 */
export function HeadlessSafeSelect({ options, value, onChange, placeholder, className = '', buttonClassName = '', selectedClassName = '', label, loading, required }) {
  const [selectedOption, setSelectedOption] = useState(
    options.find((option) => option.id === value) || null
  );

  useEffect(() => {
    setSelectedOption(options.find((option) => option.id === value) || null);
  }, [value, options]);

  const handleSelect = (newValueId) => {
    onChange(newValueId);
  };

  return (
    <Listbox value={value} onChange={handleSelect}>
      {({ open }) => (
        <div className={`relative ${className}`}>
          {label && (
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
          )}
          <Listbox.Button className={`relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6 ${buttonClassName}`}>
            <span className={`block truncate ${selectedClassName}`}>
              {loading ? (
                <span className="flex items-center text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                </span>
              ) : (
                selectedOption ? selectedOption.label : placeholder
              )}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              {/* Usar ChevronDown y ChevronUp para simular ChevronUpDownIcon */}
              {open ? (
                <ChevronUp className="h-5 w-5 text-gray-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
              )}
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.length === 0 && !loading ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No hay opciones disponibles.
                </div>
              ) : (
                options.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-8 pr-4 ${
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={option.id}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {option.label}
                        </span>

                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-1.5 ${
                              active ? 'text-white' : 'text-indigo-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}
