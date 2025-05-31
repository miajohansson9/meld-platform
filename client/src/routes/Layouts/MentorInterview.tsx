import React from 'react';
import { Outlet } from 'react-router-dom';

const MentorInterview: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-cream">
      <Outlet />
    </div>
  );
};

export default MentorInterview;
