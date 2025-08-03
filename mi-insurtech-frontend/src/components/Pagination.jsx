// src/components/Pagination.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Componente de paginación reutilizable.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {number} props.currentPage - La página actual (base 1).
 * @param {number} props.totalItems - El número total de ítems.
 * @param {number} props.itemsPerPage - El número de ítems por página.
 * @param {function} props.onPageChange - Callback que se llama cuando cambia la página.
 */
export function PaginationComponent({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Genera un array de números de página para mostrar en la paginación
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Por ejemplo, mostrar 5 páginas a la vez
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // Lógica para cambiar a una página específica, asegurando que no sea menor a 1
  const handlePageClick = (pageNumber) => {
    const newPage = Math.max(1, pageNumber); // Asegura que la página no sea menor que 1
    onPageChange(newPage);
  };

  const handlePreviousPage = () => {
    // CORRECCIÓN: Aseguramos que la página nunca sea menor a 1.
    const newPage = Math.max(1, currentPage - 1);
    onPageChange(newPage);
  };

  const handleNextPage = () => {
    // CORRECCIÓN: Aseguramos que la página nunca exceda el total de páginas.
    const newPage = Math.min(totalPages, currentPage + 1);
    onPageChange(newPage);
  };

  if (totalPages <= 1) {
    return null; // No mostrar paginación si solo hay una página o ninguna
  }

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Go to previous page</span>
      </Button>

      {/* Renderizar "..." al principio si hay más páginas antes del rango visible */}
      {getPageNumbers()[0] > 1 && (
        <>
          <Button variant="outline" onClick={() => handlePageClick(1)} className="h-8 w-8">
            1
          </Button>
          {getPageNumbers()[0] > 2 && (
            <span className="px-2 text-sm text-gray-500">...</span>
          )}
        </>
      )}

      {/* Números de página */}
      {getPageNumbers().map((pageNumber) => (
        <Button
          key={pageNumber}
          variant={pageNumber === currentPage ? 'default' : 'outline'}
          size="icon"
          onClick={() => handlePageClick(pageNumber)}
          className="h-8 w-8"
        >
          {pageNumber}
        </Button>
      ))}

      {/* Renderizar "..." al final si hay más páginas después del rango visible */}
      {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
        <>
          {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
            <span className="px-2 text-sm text-gray-500">...</span>
          )}
          <Button variant="outline" onClick={() => handlePageClick(totalPages)} className="h-8 w-8">
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Go to next page</span>
      </Button>
    </div>
  );
}