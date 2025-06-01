/* eslint-disable i18next/no-literal-string */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import MentorAudioTextInput from './MentorAudioTextInput';

const TOTAL_QUESTIONS = 3; // Updated to match requirements (3 rounds)

interface Question {
  question: string;
  preamble?: string;
  supporting?: string;
  extraText?: string;
}

const MentorInterviewQuestion: React.FC = () => {
  const { step, mentor_interest_id } = useParams<{ step?: string; mentor_interest_id?: string }>();
  const navigate = useNavigate();
  const { token } = useAuthContext();
  const currentStep = Number(step) || 1;
  const [transcript, setTranscript] = useState('');
  const [paused, setPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [initialSavedAnswer, setInitialSavedAnswer] = useState('');
  const saveRef = useRef<(() => Promise<void>) | null>(null);

  // Helper function to generate question preamble
  const getQuestionPreamble = useCallback((step: number) => {
    if (step <= TOTAL_QUESTIONS) {
      return `Question ${step} of ${TOTAL_QUESTIONS}`;
    } else {
      return `Question ${step} (bonus)`;
    }
  }, []);

  // Hard-coded first question as per requirements
  const firstQuestion: Question = {
    preamble: "Let's begin with a question we ask every mentor.",
    supporting:
      'At MELD, we recognize that every woman—no matter her success—is working on something and through something.',
    question:
      "With that in mind, please tell us about:\n1. An exciting project or goal you're currently working on\n2. A meaningful challenge you're navigating through",
    extraText:
      "As you answer, please introduce yourself as if you were at a dinner party. Your answer will be used to help us choose personalized questions you'll be uniquely suited to answer.",
  };

  // Load current question content
  useEffect(() => {
    const loadQuestion = async () => {
      if (currentStep === 1) {
        setCurrentQuestion(firstQuestion);
        setTranscript('');
        // Load any existing answer for step 1
        try {
          const response = await fetch(`/api/mentor-interest/${mentor_interest_id}/response/${currentStep}`);
          if (response.ok) {
            const data = await response.json();
            setInitialSavedAnswer(data.response_text || '');
          } else {
            setInitialSavedAnswer('');
          }
        } catch (error) {
          console.error('Error loading saved answer:', error);
          setInitialSavedAnswer('');
        }
        // Make sure to clear loading state for question 1
        setIsLoadingQuestion(false);
        return;
      }

      // For steps 2+, load question from API with loading state
      setIsLoadingQuestion(true);
      setCurrentQuestion(null); // Clear previous question
      
      try {
        console.log(`Loading question for step ${currentStep}...`);
        const response = await fetch(
          `/api/mentor-interest/${mentor_interest_id}/response/${currentStep}`,
        );
        if (response.ok) {
          const data = await response.json();
          setCurrentQuestion({
            question: data.question || 'Question will be generated based on your previous responses.',
            preamble: getQuestionPreamble(currentStep),
            supporting: data.preamble || "Based on your previous answer, here's your next question:",
          });
          // Load the saved answer
          setInitialSavedAnswer(data.response_text || '');
        } else {
          // Show loading state instead of fallback text
          setCurrentQuestion({
            question: '',
            preamble: getQuestionPreamble(currentStep),
            supporting: 'Loading your personalized question...',
          });
          setInitialSavedAnswer('');
        }
        setTranscript('');
      } catch (error) {
        console.error('Error loading question:', error);
        setCurrentQuestion({
          question: '',
          preamble: getQuestionPreamble(currentStep),
          supporting: 'Error loading question. Please refresh the page.',
        });
        setTranscript('');
        setInitialSavedAnswer('');
      } finally {
        setIsLoadingQuestion(false);
      }
    };

    loadQuestion();
  }, [currentStep, mentor_interest_id]);

  const onInputStateChange = useCallback(
    ({ paused: p, transcript: t }: { paused: boolean; transcript: string }) => {
      setPaused(p);
      setTranscript(t);
    },
    [],
  );

  const handleSubmit = useCallback((text: string) => {
    setTranscript((prev) => prev + text);
  }, []);

  const handleSaveComplete = useCallback((savedText: string) => {
    // Update the initial saved answer when the child component saves successfully
    setInitialSavedAnswer(savedText);
  }, []);

  const goNext = useCallback(async () => {
    console.log(`Navigating from step ${currentStep} to step ${currentStep + 1}`);
    setIsLoadingQuestion(true); // Show loading immediately when navigation starts
    if (saveRef.current) {
      console.log('Saving current response before navigation...');
      await saveRef.current();
    }
    navigate(`/${mentor_interest_id}/mentor-interview/question/${currentStep + 1}`);
  }, [navigate, mentor_interest_id, currentStep]);

  const goBack = useCallback(() => {
    setIsLoadingQuestion(true); // Show loading immediately when navigation starts
    if (currentStep > 1) {
      navigate(`/${mentor_interest_id}/mentor-interview/question/${currentStep - 1}`);
    } else {
      navigate(`/${mentor_interest_id}/mentor-interview/start`);
    }
  }, [navigate, mentor_interest_id, currentStep]);

  // Handle response submission and proceed directly (skip tags for now)
  const handleResponseSaved = useCallback(async () => {
    console.log(`[Continue] Starting from question ${currentStep} with transcript:`, transcript.substring(0, 100));
    
    setIsLoading(true);
    try {
      console.log(`[Continue] Generating next question after stage ${currentStep}`);
      // For questions 1-2, generate next question directly without tags
      const nextQuestionResponse = await fetch(
        `/api/mentor-interest/${mentor_interest_id}/next-question`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            previous_stage_id: currentStep,
            answer_text: transcript,
          }),
        },
      );

      console.log(`[Continue] API response status: ${nextQuestionResponse.status}`);

      if (nextQuestionResponse.ok) {
        try {
          // Read response as text first to avoid "body stream already read" errors
          const responseText = await nextQuestionResponse.text();
          console.log('[Continue] Raw response:', responseText);
          
          // Check if this is the streaming issue
          if (responseText.includes('event:') || responseText.includes('data:')) {
            console.error('[Continue] Got streaming response instead of JSON');
            alert('Server returned streaming format instead of JSON. Please refresh the page and try again.');
            return;
          }
          
          // Try to parse as JSON
          const nextQuestionData = JSON.parse(responseText);
          console.log('[Continue] Next question generated:', nextQuestionData);
          
          // Check if this is an existing question vs newly generated
          if (nextQuestionData.stage_id) {
            console.log(`[Continue] Received question for stage ${nextQuestionData.stage_id}, calling goNext()`);
            // Move to next question regardless of whether it's new or existing
            goNext();
          } else {
            console.warn('[Continue] Response missing stage_id:', nextQuestionData);
            alert('Received incomplete response from server. Please try again.');
          }
        } catch (jsonError) {
          console.error('[Continue] Failed to parse JSON response:', jsonError);
          alert('Received invalid response from server. Please try again.');
        }
      } else {
        // Handle different error status codes
        const contentType = nextQuestionResponse.headers.get('content-type');
        let errorMessage = 'Failed to generate next question. Please try again.';
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await nextQuestionResponse.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await nextQuestionResponse.text();
            console.error('Non-JSON error response:', errorText);
            
            // Handle specific error cases
            if (nextQuestionResponse.status === 400) {
              errorMessage = 'Invalid request. Please check your answer and try again.';
            } else if (nextQuestionResponse.status === 401) {
              errorMessage = 'Authentication failed. Please refresh the page and try again.';
            } else if (nextQuestionResponse.status === 429) {
              errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (nextQuestionResponse.status >= 500) {
              errorMessage = 'Server error. Please try again in a few moments.';
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        console.error(`API Error (${nextQuestionResponse.status}):`, errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Network error generating next question:', error);
      
      // Handle different types of network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Network connection error. Please check your internet connection and try again.');
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, navigate, transcript, token, goNext, mentor_interest_id]);

  const handleSaveAndFinish = useCallback(async () => {
    // Save the current response and finish interview
    if (saveRef.current) {
      await saveRef.current();
      // Update the initial saved answer to reflect the save
      setInitialSavedAnswer(transcript);
    }
    // Navigate to completion page
    navigate(`/mentor-interview/complete`);
  }, [transcript, navigate]);

  const handleReviewAndFinish = useCallback(() => {
    navigate(`/mentor-interview/complete`);
  }, [navigate]);

  const handleSkipQuestion = useCallback(async () => {
    console.log(`[Skip] Starting skip from question ${currentStep}`);
    setIsLoading(true);
    try {
      // Generate next question without any answer (skip current question)
      const nextQuestionResponse = await fetch(
        `/api/mentor-interest/${mentor_interest_id}/next-question`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            previous_stage_id: currentStep,
            answer_text: '', // Empty for skipping
          }),
        },
      );

      console.log(`[Skip] API response status: ${nextQuestionResponse.status}`);

      if (nextQuestionResponse.ok) {
        try {
          // Read response as text first to avoid "body stream already read" errors
          const responseText = await nextQuestionResponse.text();
          console.log('[Skip] Raw response:', responseText);
          
          // Check if this is the streaming issue
          if (responseText.includes('event:') || responseText.includes('data:')) {
            console.error('[Skip] Got streaming response instead of JSON');
            alert('Server returned streaming format instead of JSON. Please refresh the page and try again.');
            return;
          }
          
          // Try to parse as JSON
          const nextQuestionData = JSON.parse(responseText);
          console.log('[Skip] Next question generated for skip:', nextQuestionData);
          
          // Check if this is an existing question vs newly generated
          if (nextQuestionData.stage_id) {
            console.log(`[Skip] Received question for stage ${nextQuestionData.stage_id}, calling goNext()`);
            // Move to next question
            goNext();
          } else {
            console.warn('[Skip] Response missing stage_id:', nextQuestionData);
            alert('Received incomplete response from server. Please try again.');
          }
        } catch (jsonError) {
          console.error('[Skip] Failed to parse JSON response:', jsonError);
          alert('Received invalid response from server. Please try again.');
        }
      } else {
        // Handle different error status codes
        const contentType = nextQuestionResponse.headers.get('content-type');
        let errorMessage = 'Failed to generate next question. Please try again.';
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await nextQuestionResponse.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await nextQuestionResponse.text();
            console.error('[Skip] Non-JSON error response:', errorText);
          }
        } catch (parseError) {
          console.error('[Skip] Error parsing error response:', parseError);
        }
        
        console.error(`[Skip] API Error (${nextQuestionResponse.status}):`, errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('[Skip] Network error skipping question:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      console.log('[Skip] Clearing loading state');
      setIsLoading(false);
    }
  }, [mentor_interest_id, currentStep, token, goNext]);

  // if there's no mentorInterestId in the URL, don't even render the input
  if (!mentor_interest_id || !currentQuestion) return null;

  const isFirst = currentStep === 1;

  // Determine the state of the current answer
  const hasContent = transcript.length > 0;
  const hasSavedAnswer = initialSavedAnswer.length > 0;
  const hasUnsavedChanges = transcript !== initialSavedAnswer && hasContent;
  
  // Special handling for question 3 - show finish/continue options
  const isQuestionThree = currentStep === 3;
  const isCompletedQuestionThree = isQuestionThree && (hasSavedAnswer || hasContent);
  const isBonusQuestion = currentStep > TOTAL_QUESTIONS;
  // For bonus questions, always show dual navigation (they've completed core interview)
  // For question 3, only show when there's content
  const shouldShowDualNavigation = isBonusQuestion || isCompletedQuestionThree;
  
  // Determine button text and action
  const getButtonConfig = () => {
    // For question 3 and bonus questions, show dual navigation when appropriate
    if (shouldShowDualNavigation) {
      // If there are unsaved changes, require saving first
      if (hasUnsavedChanges) {
        // For bonus questions, offer to save and finish
        const isBonus = currentStep > TOTAL_QUESTIONS;
        return {
          text: isBonus ? 'Save & Finish Interview →' : 'Save first →',
          action: isBonus ? handleSaveAndFinish : handleResponseSaved,
          show: paused && transcript.length > 50,
          showDualNavigation: false
        };
      } else {
        // Show dual navigation (always for bonus questions, or for question 3 with content)
        return {
          text: '',
          action: null,
          show: false,
          showDualNavigation: true
        };
      }
    }
    
    // For all other questions, use the original logic
    if (hasUnsavedChanges) {
      return {
        text: 'Save & continue →',
        action: handleResponseSaved,
        show: paused && transcript.length > 50,
        showDualNavigation: false
      };
    } else if (hasSavedAnswer) {
      // Always need to generate next question when continuing
      return {
        text: 'Continue →',
        action: handleResponseSaved,
        show: true,
        showDualNavigation: false
      };
    } else {
      return {
        text: 'Skip question →',
        action: handleSkipQuestion,
        show: !isFirst,
        showDualNavigation: false
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="flex flex-col items-center justify-center gap-6 bg-[#F8F4EB] p-4">
      {/* Progress Rail */}
      <div className="flex w-full flex-row items-center gap-4">
      <div className="w-px flex-1 bg-[#C9C9B6]" />
      {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => (
          <div
            key={idx}
            className={
              `my-2 h-3 w-3 flex-shrink-0 rounded-full border-2 ` +
              (currentStep > TOTAL_QUESTIONS || idx + 1 <= currentStep
                ? 'border-[#B04A2F] bg-[#B04A2F]'
                : 'border-[#C9C9B6] bg-white')
            }
          />
        ))}
        <div className="w-px flex-1 bg-[#C9C9B6]" />
        </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg sm:p-8">
        {/* Logo */}
        <div className="mb-4 flex justify-start">
          <img src="/assets/logo-b.svg" alt="MELD" className="h-7 w-auto" />
        </div>

        {/* Content */}
        <div className="font-serif mb-2 text-2xl leading-snug text-[#B04A2F]">
          {currentQuestion.preamble}
        </div>
        {currentQuestion.supporting && (
          <div className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {currentQuestion.supporting}
          </div>
        )}
        <div className="mb-4 whitespace-pre-line text-lg leading-snug text-black">
          {currentQuestion.question}
        </div>
        {currentQuestion.extraText && (
          <div className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {currentQuestion.extraText}
          </div>
        )}

        {/* Audio/Text Input */}
        {isLoadingQuestion ? (
          <div className="mt-4 flex w-full flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B04A2F]"></div>
            <p className="mt-4 text-sm text-gray-500">Loading your personalized question...</p>
          </div>
        ) : (
          <div className="mt-4 flex w-full flex-col items-center">
            <MentorAudioTextInput
              mentorInterestId={mentor_interest_id}
              stageId={currentStep}
              onSubmit={handleSubmit}
              onStateChange={onInputStateChange}
              onSave={(saveFn) => {
                saveRef.current = saveFn;
              }}
              onSaveComplete={handleSaveComplete}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8">
          {/* Dual navigation for question 3 and bonus questions */}
          {buttonConfig.showDualNavigation && !isLoadingQuestion && (
            <>
              {/* Main Action Buttons */}
              <div className="flex flex-col gap-3 mb-6">
                <button
                  className="w-full rounded-md bg-[#B04A2F] py-3 px-4 text-base font-medium text-white transition hover:bg-[#8a3a23] focus:outline-none focus:ring-2 focus:ring-[#B04A2F] focus:ring-offset-2"
                  onClick={handleReviewAndFinish}
                  disabled={isLoading}
                >
                  ✓ Finish Interview
                </button>
                <button
                  className="w-full rounded-md border-2 border-[#B04A2F] py-3 px-4 text-base font-medium text-[#B04A2F] transition hover:bg-[#B04A2F] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#B04A2F] focus:ring-offset-2"
                  onClick={hasContent || hasSavedAnswer ? handleResponseSaved : handleSkipQuestion}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating question...' : (hasContent || hasSavedAnswer ? '+ Answer another question' : 'Skip question')}
                </button>
              </div>
              
              {/* Secondary Navigation */}
              <div className="flex justify-center border-t border-gray-200 pt-4">
                <button 
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                  onClick={goBack}
                  disabled={isLoading}
                >
                  ← Go back to previous question
                </button>
              </div>
            </>
          )}

          {/* Single navigation for other cases */}
          {!buttonConfig.showDualNavigation && !isLoadingQuestion && (
            <div className="flex items-center justify-between">
              <button 
                className="text-sm text-gray-500 hover:text-gray-700 underline"
                onClick={goBack}
                disabled={isLoading}
              >
                ← Go back
              </button>

              {buttonConfig.show && (
                <button
                  className="text-sm text-[#B04A2F] hover:text-[#8a3a23] underline font-medium"
                  onClick={buttonConfig.action || (() => {})}
                  disabled={isLoading}
                >
                  {isLoading && (buttonConfig.action === handleResponseSaved || buttonConfig.action === handleSkipQuestion) ? 'Processing...' : buttonConfig.text}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorInterviewQuestion;
