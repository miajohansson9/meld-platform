import React from 'react';
import { Outlet } from 'react-router-dom';

const MentorInterview: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-cream">
      <div className="m-2 flex w-full max-w-md flex-col items-center rounded-lg bg-white">
        <Outlet />
      </div>
    </div>
  );
};

export default MentorInterview;
