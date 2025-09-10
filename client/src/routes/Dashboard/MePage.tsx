import React, { useState, useCallback } from 'react';
import { HeaderBar } from '~/components/figma';
import { useAuthContext } from '~/hooks/AuthContext';
import UsersTable from '~/components/Admin/UsersTable';
import UserInterestTable from '~/components/Admin/UserInterestTable';
import MentorAnswersTable from '~/components/Admin/MentorAnswersTable';
import MentorInterviewModal from '~/components/Admin/MentorInterviewModal';

// Define SystemRoles locally to match the backend
const SystemRoles = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MENTOR: 'MENTOR',
} as const;

interface SelectedMentor {
  mentor_id: string;
  mentor_name: string;
  mentor_email: string;
  responses: any[];
}

export default function MePage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('users');
  const [selectedMentor, setSelectedMentor] = useState<SelectedMentor | null>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  
  // Check if current user is an admin
  const isAdmin = user?.role === SystemRoles.ADMIN;

  // Centralized mentor selection handler
  const handleMentorSelect = useCallback((mentor: SelectedMentor) => {
    setSelectedMentor(mentor);
    setInterviewModalOpen(true);
  }, []);

  // Centralized modal close handler
  const handleInterviewModalClose = useCallback(() => {
    setInterviewModalOpen(false);
    setSelectedMentor(null);
  }, []);

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
              
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`${
                      activeTab === 'users'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors duration-200`}
                  >
                    Platform Users
                  </button>
                  <button
                    onClick={() => setActiveTab('user-interest')}
                    className={`${
                      activeTab === 'user-interest'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors duration-200`}
                  >
                    User Interest Signups
                  </button>
                  <button
                    onClick={() => setActiveTab('mentor-answers')}
                    className={`${
                      activeTab === 'mentor-answers'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors duration-200`}
                  >
                    Mentor Answers
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'users' && <UsersTable />}
                {activeTab === 'user-interest' && <UserInterestTable />}
                {activeTab === 'mentor-answers' && <MentorAnswersTable onMentorSelect={handleMentorSelect} />}
              </div>
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

      {/* Mentor Interview Modal - only for admin users */}
      {isAdmin && (
        <MentorInterviewModal
          isOpen={interviewModalOpen}
          onClose={handleInterviewModalClose}
          selectedMentor={selectedMentor}
        />
      )}
    </div>
  );
} 