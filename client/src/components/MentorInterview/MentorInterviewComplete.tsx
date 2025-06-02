import React from 'react';
import { useNavigate } from 'react-router-dom';

const MentorInterviewComplete: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F8F4EB] p-4">
      {/* Card */}
      <div className="w-full max-w-lg rounded-lg bg-white p-6 text-center shadow-lg sm:p-8">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img src="/assets/logo-b.svg" alt="MELD" className="h-8 w-auto" />
        </div>

        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="font-serif mb-4 text-2xl leading-snug text-[#B04A2F]">
          You're done! You're Now a Part of MELD's Founding Story
        </div>

        <p className="mb-6 text-base leading-relaxed text-gray-600">
          Thank you for sharing your hard-earned insights. What you’ve contributed today isn’t just a reflection of your journey—it’s fuel for the next generation of women to lead, speak up, and trust themselves.
        </p>

        <div className="mb-6 text-base leading-relaxed text-gray-600">
          Your experiences will be shared with ambitious young women navigating big questions—questions you've lived through. Every sentence you’ve shared is now part of a growing library of mentorship, built by women, for women.
        </div>
      </div>
    </div>
  );
};

export default MentorInterviewComplete;
