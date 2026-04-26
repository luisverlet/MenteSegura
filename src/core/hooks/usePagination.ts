'use client';

import { useState, useCallback } from 'react';
import { PaginationState } from '@/core/types';

/**
 * Reusable pagination hook.
 * Keeps page + rowsPerPage state and exposes typed handlers
 * ready to wire to GenericTable props.
 */
export function usePagination(defaultRowsPerPage = 10) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    rowsPerPage: defaultRowsPerPage,
  });

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setPagination({ page: 0, rowsPerPage: parseInt(e.target.value, 10) });
    },
    []
  );

  const resetPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  return {
    pagination,
    handlePageChange,
    handleRowsPerPageChange,
    resetPage,
  };
}
