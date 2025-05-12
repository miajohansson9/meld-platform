/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MentorInterviewStart: React.FC = () => {
  const navigate = useNavigate();
  const { mentor_interest_id } = useParams();

  return (
    <div className="w-authPageWidth bg-white px-6 py-4 shadow-lg sm:max-w-md sm:rounded-lg">
      <div className="mx-auto max-w-md p-6">
        {/* MELD Logo */}
        <div className="mb-8 flex w-full justify-start">
          <img
            src="/assets/logo-b.svg"
            className="h-7 w-auto object-contain dark:hidden"
            alt="MELD"
          />
        </div>

        {/* Greeting */}
        <h1 className="font-meld-italic font-meld-large font-serif mb-2 w-full text-5xl italic text-[#B04A2F]">
          Hi Mia,
        </h1>
        <hr className="mb-6 w-full border-t-2 border-[#B04A2F]" />

        {/* Intro Text */}
        <div className="mb-8 w-full text-base text-black">
          <p className="mb-4">Thank you for contributing your insights to MELD.</p>
          <p className="mb-4">
            We&apos;re here to empower young women through authentic, relatable experiences shared
            by accomplished leaders like you. Imagine we're having an informal conversation over
            coffee—you can type or speak your responses freely.
          </p>
          <p>
            Don&apos;t worry about sounding perfect; we will help you review and organize your
            answers afterward.
          </p>
        </div>

        {/* Ready Button */}
        <button
          className="mb-6 w-full rounded-md bg-[#B04A2F] py-3 text-lg text-white transition hover:bg-[#8a3a23]"
          onClick={() => navigate(`/${mentor_interest_id}/mentor-interview/question/1`)}
        >
          I'm ready &rarr;
        </button>

        {/* Schedule Option */}
        <div className="flex w-full items-center gap-3">
          <svg
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="text-neutral-800"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="2" />
            <path d="M16 3v4M8 3v4M3 9h18" strokeWidth="2" />
          </svg>
          <span className="text-base text-neutral-800">
            Don't have time now? Schedule a time to complete the interview.
          </span>
        </div>
      </div>
    </div>
  );
};

export default MentorInterviewStart;
