import React from 'react';
import AuthGuard from '@/core/components/auth/AuthGuard';

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
