import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardSidebar, FloatingActionButton } from '~/components/figma';
import { useAuthContext } from '~/hooks';

export default function DashboardLayout() {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  // Hide floating action button on chat page
  const shouldShowFloatingActionButton = !location.pathname.includes('/chats');

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
      
      {/* Floating Action Button - hidden on chat page */}
      {shouldShowFloatingActionButton && <FloatingActionButton />}
    </div>
  );
} 