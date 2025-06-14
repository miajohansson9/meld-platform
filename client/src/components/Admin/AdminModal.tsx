import React, { useState } from 'react';
import { OGDialog, OGDialogContent, OGDialogTitle } from '~/components/ui/OriginalDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/Tabs';
import { useAuthContext } from '~/hooks/AuthContext';
import MentorResponsesTable from '../Admin/MentorResponsesTable';
import MentorQuestionsTable from './MentorQuestionsTable';
import MentorAnswersTable from './MentorAnswersTable';
import UsersTable from './UsersTable';

export default function AdminModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuthContext();
  const [tab, setTab] = useState('mentor');
  
  const isAdmin = user?.role === 'ADMIN'; 

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="w-11/12 bg-background text-text-primary shadow-2xl">
        <OGDialogTitle>Admin Panel</OGDialogTitle>
        <Tabs className="max-w-full overflow-x-hidden" value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger
              className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 whitespace-nowrap"
              value="mentor"
            >
              Mentors
            </TabsTrigger>
            <TabsTrigger
              className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 whitespace-nowrap"
              value="mentor-answers"
            >
              Answers
            </TabsTrigger>
            <TabsTrigger
              className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 whitespace-nowrap"
              value="mentor-questions"
            >
              Questions
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 whitespace-nowrap"
                value="users"
              >
                Users
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent className="p-0" value="mentor">
            <MentorResponsesTable />
          </TabsContent>
          <TabsContent className="p-0" value="mentor-answers">
            <MentorAnswersTable />
          </TabsContent>
          <TabsContent className="p-0" value="mentor-questions">
            <MentorQuestionsTable />
          </TabsContent>
          {isAdmin && (
            <TabsContent className="p-0" value="users">
              <UsersTable />
            </TabsContent>
          )}
        </Tabs>
      </OGDialogContent>
    </OGDialog>
  );
} 