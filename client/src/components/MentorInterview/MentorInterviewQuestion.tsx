/* eslint-disable i18next/no-literal-string */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import MentorQuestionCard from './MentorQuestionCard';

const TOTAL_QUESTIONS = 6; // 6 questions total

interface Question {
  question: string;
  preamble?: string;
  supporting?: string;
  extraText?: string;
}

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

const MentorInterviewQuestion: React.FC = () => {
  const { step, access_token } = useParams<{ step?: string; access_token?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentStep = Number(step) || 1;
  const [canRequestDifferentQuestion, setCanRequestDifferentQuestion] = useState(false);
  const [isRequestingDifferentQuestion, setIsRequestingDifferentQuestion] = useState(false);
  const [onRequestDifferentQuestionHandler, setOnRequestDifferentQuestionHandler] = useState<(() => void) | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isRegeneratingQuestion, setIsRegeneratingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to generate question preamble
  const getQuestionPreamble = useCallback((step: number) => {
    return `Question ${step} of ${TOTAL_QUESTIONS}`;
  }, []);

  // Load current question content
  useEffect(() => {
    const loadQuestion = async () => {
      if (currentStep === 1) {
        setCurrentQuestion(firstQuestion);
        setIsLoadingQuestion(false);
        return;
      }

      // For steps 2+, load question from API with loading state
      setIsLoadingQuestion(true);
      setCurrentQuestion(null);
      setError(null);

      try {
        const response = await fetch(`/api/mentor-interview/${access_token}/response/${currentStep}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentQuestion({
            question: data.question || 'Question will be generated based on your previous responses.',
            preamble: getQuestionPreamble(currentStep),
            supporting: data.preamble || "Based on your previous answer, here's your next question:",
          });
        } else if (response.status === 404) {
          try {
            const errorData = await response.json();
            setError(errorData.error || 'This interview link has expired or is no longer valid. Please contact MELD for a new invitation.');
          } catch {
            setError('This interview link has expired or is no longer valid. Please contact MELD for a new invitation.');
          }
        } else if (response.status === 403) {
          try {
            const errorData = await response.json();
            setError(errorData.error || 'Access denied. This interview may have already been completed or the link has expired.');
          } catch {
            setError('Access denied. This interview may have already been completed or the link has expired.');
          }
        } else {
          setError(`Unable to load question (Error ${response.status}). Please try again or contact support.`);
        }
      } catch (error) {
        console.error('Error loading question:', error);
        setError('Network error. Please check your internet connection and try again.');
      } finally {
        setIsLoadingQuestion(false);
      }
    };

    loadQuestion();
  }, [currentStep, access_token, getQuestionPreamble]);

  const onInputStateChange = useCallback(
    ({
      canRequestDifferentQuestion: c,
      isRequestingDifferentQuestion: r,
      onRequestDifferentQuestion: h
    }: {
      paused: boolean;
      transcript: string;
      hasAudio?: boolean;
      canRequestDifferentQuestion?: boolean;
      isRequestingDifferentQuestion?: boolean;
      onRequestDifferentQuestion?: () => void;
    }) => {
      if (c !== undefined) {
        setCanRequestDifferentQuestion(c);
      }
      if (r !== undefined) {
        setIsRequestingDifferentQuestion(r);
      }
      if (h !== undefined) {
        setOnRequestDifferentQuestionHandler(() => h);
      }
    },
    [],
  );

  const onSaveComplete = useCallback((savedText: string) => {
    // Response saved successfully
  }, []);

  const goBack = useCallback(() => {
    setIsLoadingQuestion(true);
    const queryString = searchParams.toString();
    const queryParam = queryString ? `?${queryString}` : '';
    
    if (currentStep > 1) {
      navigate(`/mentor-interview/${access_token}/question/${currentStep - 1}${queryParam}`);
    } else {
      navigate(`/mentor-interview/${access_token}/start${queryParam}`);
    }
  }, [navigate, access_token, currentStep, searchParams]);

  // Handle navigation after question preloading is complete
  const handleContinueImmediate = useCallback(() => {
    const queryString = searchParams.toString();
    const queryParam = queryString ? `?${queryString}` : '';
    
    if (currentStep === TOTAL_QUESTIONS) {
      // Final question - navigate to complete page with insights
      navigate(`/mentor-interview/${access_token}/complete${queryParam}`);
    } else {
      // Navigate to next question (preloading already handled by button)
      navigate(`/mentor-interview/${access_token}/question/${currentStep + 1}${queryParam}`);
    }
  }, [currentStep, navigate, access_token, searchParams]);

  // Handle final question completion (after transcription or timeout)
  const handleFinalQuestionComplete = useCallback(() => {
    const queryString = searchParams.toString();
    const queryParam = queryString ? `?${queryString}` : '';
    navigate(`/mentor-interview/${access_token}/complete${queryParam}`);
  }, [navigate, access_token, searchParams]);

  // Handle question rejection and regeneration
  const handleQuestionRejected = useCallback(async () => {
    try {
      setIsRegeneratingQuestion(true);

      // Get previous answers (excluding rejected ones)
      const previousResponse = await fetch(`/api/mentor-interview/${access_token}/response/${currentStep - 1}`);
      const prevData = previousResponse.ok ? await previousResponse.json() : null;

      // Generate new question for the CURRENT stage (not previous stage)
      // The API will automatically consider rejected questions for this stage
      const response = await fetch(`/api/mentor-interview/${access_token}/generate-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previous_stage_id: currentStep - 1,
          answer_text: prevData?.response_text || '',
          force_regenerate: true, // Force regeneration even if question exists
        }),
      });

      if (response.ok) {
        const responseText = await response.text();

        if (responseText.includes('event:') || responseText.includes('data:')) {
          alert('Server returned streaming format. Please refresh the page and try again.');
          return;
        }

        const newQuestionData = JSON.parse(responseText);

        if (newQuestionData.question) {
          setCurrentQuestion({
            question: newQuestionData.question,
            preamble: getQuestionPreamble(currentStep),
            supporting: newQuestionData.preamble || "Here's your new question:",
          });
        }
      } else {
        alert('Failed to generate new question. Please try again.');
      }

    } catch (error) {
      console.error('Error regenerating question:', error);
      alert('Error generating new question. Please try again.');
    } finally {
      setIsRegeneratingQuestion(false);
    }
  }, [access_token, currentStep, getQuestionPreamble]);

  if (!access_token) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F4EB] p-4">
        <div className="w-full max-w-lg mx-auto text-center">
          {/* MELD Logo */}
          <div className="mb-8 flex justify-center">
            <img
              src="/assets/logo-b.svg"
              className="h-10 w-auto object-contain"
              alt="MELD"
            />
          </div>
          
          {/* Error Message */}
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-serif italic text-[#B04A2F] mb-4">
                Unable to Load Question
              </h1>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {error}
              </p>
            </div>
            
            <div className="text-sm text-gray-500">
              <p className="mb-2">Need help?</p>
              <p>Contact MELD support for assistance with your interview.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const isFinalQuestion = currentStep === TOTAL_QUESTIONS;

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
              (idx + 1 <= currentStep
                ? 'border-[#B04A2F] bg-[#B04A2F]'
                : 'border-[#C9C9B6] bg-white')
            }
          />
        ))}
        <div className="w-px flex-1 bg-[#C9C9B6]" />
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg sm:p-8">
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
        {(isLoadingQuestion || isRegeneratingQuestion) ? (
          <div className="mt-4 flex w-full flex-col items-center justify-center py-12">
            <p className="mt-4 text-sm text-gray-500">
              Loading your personalized question...
            </p>
          </div>
        ) : (
          <div className="mt-4 flex w-full flex-col items-center">
            <MentorQuestionCard
              accessToken={access_token}
              stageId={currentStep}
              question={currentQuestion.question}
              preamble={currentQuestion.supporting || currentQuestion.preamble}
              isFinalQuestion={isFinalQuestion}
              onStateChange={onInputStateChange}
              onSave={() => {
                // Save function handled internally by MentorQuestionCard
              }}
              onSaveComplete={onSaveComplete}
              onContinue={handleContinueImmediate}
              onFinalComplete={handleFinalQuestionComplete}
              onQuestionRejected={handleQuestionRejected}
            />
          </div>
        )}

        {/* Bottom navigation */}
        {!isLoadingQuestion && (
          <div className="mt-4 flex justify-between items-center border-t border-gray-200 pt-4">
            <button
              className="text-sm text-gray-500 hover:text-gray-700 underline"
              onClick={goBack}
            >
              ← Go back
            </button>

            {canRequestDifferentQuestion && (
              <button
                className="text-sm text-gray-500 hover:text-gray-700 underline flex items-center gap-1"
                onClick={onRequestDifferentQuestionHandler || undefined}
                disabled={isRequestingDifferentQuestion}
              >
                {isRequestingDifferentQuestion ? (
                  <>
                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Requesting...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Different Question
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorInterviewQuestion;