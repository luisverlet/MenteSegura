'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Box,
  Typography,
  TablePagination,
  TableHead,
} from '@mui/material';

interface Column<T> {
  id: keyof T | 'actions';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row: T) => React.ReactNode;
}

interface GenericTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  totalRows?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isLoading?: boolean;
}

const GenericTable = <T extends { id: string | number }>({
  columns,
  rows,
  totalRows = 0,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  isLoading = false,
}: GenericTableProps<T>) => {
  const totalCount = totalRows || rows.length;
  const effectiveRowsPerPage = totalCount > 0 ? Math.min(rowsPerPage, totalCount) : rowsPerPage;
  const safePage =
    totalCount > 0
      ? Math.min(page, Math.max(Math.ceil(totalCount / effectiveRowsPerPage) - 1, 0))
      : 0;
  const rowsPerPageOptions = Array.from(
    new Set([5, 10, 25, 50, ...(totalCount > 0 && totalCount < 5 ? [totalCount] : [])])
  ).sort((a, b) => a - b);

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF !important', borderRadius: '24px' }}>
      <TableContainer
        sx={{
          maxHeight: '70vh',
          borderRadius: '24px 24px 0 0',
          overflow: 'auto',
          backgroundColor: '#FFFFFF !important'
        }}
      >
        <Table stickyHeader aria-label="sticky table" sx={{ backgroundColor: '#FFFFFF !important' }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#FFFFFF !important' }}>
              {columns.map((column) => (
                <TableCell
                  key={column.id as string}
                  align={column.align || 'center'}
                  sx={{
                    minWidth: column.minWidth,
                    fontWeight: 800,
                    color: '#64748B',
                    backgroundColor: '#FFFFFF !important',
                    borderBottom: '2px solid #F1F5F9',
                    fontSize: '13px',
                    py: 2.5
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody sx={{ backgroundColor: '#FFFFFF !important' }}>
            {rows.map((row) => (
              <TableRow hover role="checkbox" tabIndex={-1} key={row.id} sx={{ backgroundColor: '#FFFFFF !important' }}>
                {columns.map((column) => {
                  const value = column.id === 'actions' ? null : row[column.id as keyof T];
                  return (
                    <TableCell
                      key={column.id as string}
                      align={column.align || 'center'}
                      sx={{
                        py: 2.2,
                        fontWeight: 600,
                        color: '#1E293B',
                        borderBottom: '1px solid #F1F5F9',
                        fontSize: '14px',
                        backgroundColor: '#FFFFFF !important'
                      }}
                    >
                      {column.format ? column.format(value, row) : (value as React.ReactNode)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {rows.length === 0 && isLoading && (
              <TableRow sx={{ backgroundColor: '#FFFFFF !important' }}>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 10, backgroundColor: '#FFFFFF !important' }}>
                  <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 700 }}>
                    Cargando registros...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.length === 0 && !isLoading && (
              <TableRow sx={{ backgroundColor: '#FFFFFF !important' }}>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 10, backgroundColor: '#FFFFFF !important' }}>
                  <Typography variant="body1" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                    No se encontraron registros
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={totalCount}
        rowsPerPage={effectiveRowsPerPage}
        page={safePage}
        onPageChange={(e, p) => onPageChange?.(e, p)}
        onRowsPerPageChange={(e) => onRowsPerPageChange?.(e)}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        sx={{
          borderTop: '1px solid #F1F5F9',
          backgroundColor: '#FFFFFF !important',
          borderRadius: '0 0 24px 24px',
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontWeight: 700,
            color: '#64748B',
            fontSize: '12px'
          }
        }}
      />
    </Box>
  );
};

export default GenericTable;
