/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MentorInterviewStart: React.FC = () => {
  const navigate = useNavigate();
  const { mentor_interest_id } = useParams();
  const [mentorName, setMentorName] = useState<string>('');
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [personalizedIntro, setPersonalizedIntro] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);

  // Generate personalized introduction using the backend endpoint
  const generatePersonalizedIntro = async (mentorId: string) => {
    setIsGeneratingIntro(true);
    try {
      const response = await fetch(`/api/mentor-interest/${mentorId}/generate-intro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalizedIntro(data.introduction);
      } else {
        // Fallback to the original template if API fails
        const errorData = await response.json().catch(() => ({}));
        console.error('Error generating intro:', errorData);
        setPersonalizedIntro('');
      }
    } catch (error) {
      console.error('Error generating personalized intro:', error);
      // Fallback - let the component use the original template
      setPersonalizedIntro('');
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  // Fetch mentor's name when component mounts
  useEffect(() => {
    const fetchMentorInfo = async () => {
      if (!mentor_interest_id) return;

      try {
        const response = await fetch(`/api/mentor-interest/${mentor_interest_id}`);
        if (response.ok) {
          const mentorData = await response.json();
          setMentorName(mentorData.firstName || 'there');
          setMentorProfile(mentorData);
          
          // Generate personalized intro if we have job title and company
          if (mentorData.jobTitle && mentorData.company) {
            await generatePersonalizedIntro(mentor_interest_id);
          }
        } else {
          setMentorName('there'); // Fallback greeting
        }
      } catch (error) {
        console.error('Error fetching mentor info:', error);
        setMentorName('there'); // Fallback greeting
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentorInfo();
  }, [mentor_interest_id]);

  // Show loading state while fetching mentor data
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F4EB] p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B04A2F]"></div>
          <span className="text-[#B04A2F] text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-[#F8F4EB] p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg sm:p-8">
        {/* MELD Logo */}
        <div className="mb-4 flex justify-start">
          <img
            src="/assets/logo-b.svg"
            className="h-7 w-auto object-contain dark:hidden"
            alt="MELD"
          />
        </div>

        {/* Greeting */}
        <h1 className="font-meld-italic font-meld-large font-serif mb-2 text-3xl italic text-[#B04A2F]">
          Hi {mentorName},
        </h1>
        <hr className="mb-6 w-full border-t-2 border-[#B04A2F]" />

        {/* Intro Text */}
        <div className="mb-8 text-base text-black">
          <p className="mb-4">
            Thank you for contributing your insights to MELD. We're here to empower young women through authentic, relatable experiences shared by accomplished leaders like you.
          </p>
          <p className="mb-4">
            {isGeneratingIntro ? (
              <span className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#B04A2F]"></div>
                Personalizing your introduction...
              </span>
            ) : personalizedIntro ? (
              personalizedIntro
            ) : mentorProfile && mentorProfile.jobTitle && mentorProfile.company ? (
              `As a ${mentorProfile.jobTitle} at ${mentorProfile.company}, your experience offers critical insights for women in their 20s navigating the early stages of their professional journey.`
            ) : (
              'Your experience offers critical insights for women in their 20s navigating the early stages of their professional journey.'
            )}
            {' '}
            Think of this as the conversation you wish you could have had with a mentor when you were 22—candid, supportive, and full of real-world wisdom.
          </p>
          <p>
            Don't worry about sounding perfect; we will help you review and refine your answers afterward.
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
        <div className="flex items-center gap-3 text-neutral-800">
          <svg
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="flex-shrink-0"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="2" />
            <path d="M16 3v4M8 3v4M3 9h18" strokeWidth="2" />
          </svg>
          <span className="text-base">
            Don't have time now? Schedule a time to complete the interview.
          </span>
        </div>
      </div>
    </div>
  );
};

export default MentorInterviewStart;
