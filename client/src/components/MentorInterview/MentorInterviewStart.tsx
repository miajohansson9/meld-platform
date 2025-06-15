/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MentorInterviewStart: React.FC = () => {
  const navigate = useNavigate();
  const { access_token } = useParams();
  const [mentorName, setMentorName] = useState<string>('');
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [personalizedIntro, setPersonalizedIntro] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);

  // Generate personalized introduction using the backend endpoint
  const generatePersonalizedIntro = async () => {
    if (!access_token) return;
    
    setIsGeneratingIntro(true);
    try {
      const response = await fetch(`/api/mentor-interview/${access_token}/generate-intro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalizedIntro(data.introduction);
      } else {
        console.error('Error generating intro:', await response.json().catch(() => ({})));
        setPersonalizedIntro('');
      }
    } catch (error) {
      console.error('Error generating personalized intro:', error);
      setPersonalizedIntro('');
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  // Fetch mentor's name when component mounts
  useEffect(() => {
    const fetchMentorInfo = async () => {
      console.log('=== FETCH MENTOR INFO DEBUG ===');
      console.log('access_token value:', access_token);
      console.log('access_token type:', typeof access_token);
      console.log('access_token length:', access_token?.length);
      
      if (!access_token) {
        console.error('No access_token found:', access_token);
        return;
      }

      console.log('Fetching mentor info for token:', access_token);
      const apiUrl = `/api/mentor-interview/${access_token}`;
      console.log('Full API URL:', apiUrl);

      try {
        console.log('About to make fetch request...');
        const response = await fetch(apiUrl);
        console.log('Fetch completed. Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
          console.log('Response is OK, parsing JSON...');
          const responseText = await response.text();
          console.log('Raw response text:', responseText);
          console.log('Response text length:', responseText.length);
          console.log('First 200 characters:', responseText.substring(0, 200));
          
          try {
            const mentorData = JSON.parse(responseText);
            console.log('Mentor profile data received:', mentorData);
            
            setMentorName(mentorData.firstName || 'there');
            setMentorProfile(mentorData);
            
            // Generate personalized intro if we have job title and company
            if (mentorData.jobTitle && mentorData.company) {
              console.log('Generating personalized intro for:', mentorData.jobTitle, 'at', mentorData.company);
              await generatePersonalizedIntro();
            } else {
              console.log('No jobTitle/company found, using default intro. JobTitle:', mentorData.jobTitle, 'Company:', mentorData.company);
            }
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response was not valid JSON. This suggests the backend is returning HTML instead of JSON.');
            setMentorName('there');
          }
        } else {
          const errorText = await response.text();
          console.error('Error fetching mentor profile:', response.status, errorText);
          setMentorName('there');
        }
      } catch (error) {
        console.error('Error fetching mentor info:', error);
        console.error('Error details:', (error as Error).message, (error as Error).stack);
        setMentorName('there');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentorInfo();
  }, [access_token]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F4EB] p-4">
        <div className="w-full max-w-2xl mx-auto text-center">
          {/* MELD Logo */}
          <div className="mb-8 flex justify-center">
            <img
              src="/assets/logo-b.svg"
              className="h-10 w-auto object-contain"
              alt="MELD"
            />
          </div>
          
          {/* Main Message */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-serif italic text-[#B04A2F] mb-4 leading-tight">
              Thank you for shaping what's next
            </h1>
            <p className="text-lg text-gray-700 font-light">
              Preparing your personalized MELD interview…
            </p>
          </div>
          
          {/* Three Dot Loading Animation */}
          <div className="mb-8 flex justify-center items-center space-x-1">
            <div className="w-2 h-2 bg-[#B04A2F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#B04A2F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#B04A2F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* Subtle subtext */}
          <p className="text-sm text-gray-500 font-light max-w-md mx-auto leading-relaxed">
            We're tailoring questions based on your expertise to create the most meaningful conversation for young women starting their careers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-[#F8F4EB]">
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
          onClick={() => navigate(`/mentor-interview/${access_token}/question/1`)}
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
            Don't have time now? Bookmark this page and come back later.
          </span>
        </div>
      </div>
    </div>
  );
};

export default MentorInterviewStart;
