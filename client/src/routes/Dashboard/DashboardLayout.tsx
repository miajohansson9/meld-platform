import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar, FloatingActionButton } from '~/components/figma';
import { useAuthContext } from '~/hooks';

export default function DashboardLayout() {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen">
      {/* Figma Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
      
      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
} 