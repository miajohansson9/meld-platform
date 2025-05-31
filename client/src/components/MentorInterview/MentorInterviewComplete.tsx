import React from 'react';
import { useNavigate } from 'react-router-dom';

const MentorInterviewComplete: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F8F4EB] p-4">
      {/* Card */}
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg sm:p-8">
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
          Interview Complete!
        </div>

        <div className="mb-6 text-base leading-relaxed text-gray-600">
          Thank you for sharing your insights and experiences. Your responses will help us
          understand how you can best contribute to the MELD community.
        </div>

        <div className="mb-8 text-sm text-gray-500">
          We'll review your responses and be in touch soon about next steps.
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full rounded-lg bg-[#B04A2F] px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-[#8F3A25]"
          >
            Return to Home
          </button>

          <button
            onClick={() => navigate('/mentor-interest')}
            className="w-full rounded-lg border border-[#B04A2F] bg-white px-6 py-3 font-medium text-[#B04A2F] transition-colors duration-200 hover:bg-[#F8F4EB]"
          >
            View Other Opportunities
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorInterviewComplete;
