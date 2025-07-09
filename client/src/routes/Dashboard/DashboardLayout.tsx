import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { DashboardSidebar, FloatingActionButton } from '~/components/figma';
import { Button } from '~/components/ui';
import { useAuthContext } from '~/hooks';

export default function DashboardLayout() {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hide floating action button on chat page
  const shouldShowFloatingActionButton = !location.pathname.includes('/chats');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen relative">
      {/* Desktop Menu Button - shown when sidebar is collapsed */}
      {!isMobile && !isSidebarOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 bg-white shadow-lg hover:bg-gray-50 rounded-md border border-gray-200 p-2"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Mobile Menu Button - always shown on mobile */}
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-lg hover:bg-gray-50 rounded-md border border-gray-200 p-2"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Responsive Sidebar */}
      <DashboardSidebar 
        isOpen={isSidebarOpen} 
        onToggle={toggleSidebar}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out">
        <Outlet />
      </div>
      
      {/* Floating Action Button - hidden on chat page */}
      {shouldShowFloatingActionButton && <FloatingActionButton />}
    </div>
  );
} 