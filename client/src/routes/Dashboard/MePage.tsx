import React from 'react';
import { HeaderBar } from '~/components/figma';
import { useAuthContext } from '~/hooks/AuthContext';
import UsersTable from '~/components/Admin/UsersTable';

// Define SystemRoles locally to match the backend
const SystemRoles = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MENTOR: 'MENTOR',
} as const;

export default function MePage() {
  const { user } = useAuthContext();
  
  // Check if current user is an admin
  const isAdmin = user?.role === SystemRoles.ADMIN;

  return (
    <div className="h-full flex flex-col h-screen">
      <HeaderBar />
      <div className="h-full max-h-full overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4 text-theme-charcoal">
            {isAdmin ? 'Admin Panel' : 'Me'}
          </h1>
          
          {isAdmin ? (
            <div className="space-y-6">
              <div className="bg-meld-steel/10 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-medium text-meld-steel mb-2">User Management</h2>
                <p className="text-meld-steel text-sm">
                  Manage users, roles, and permissions for the platform.
                </p>
              </div>
              <UsersTable />
            </div>
          ) : (
            <div>
              <p className="text-theme-charcoal/70">User profile and settings will go here.</p>
              <p className="text-sm text-theme-charcoal/50 mt-2">
                This is a placeholder page. Replace with your Figma Me module component.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 