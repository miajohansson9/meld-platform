/* eslint-disable i18next/no-literal-string */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MentorQuestionCard from './MentorQuestionCard';
import BackgroundTranscriptionIndicator from './BackgroundTranscriptionIndicator';
import { useTranscriptionStatus } from '~/hooks/Input/useTranscriptionStatus';

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
  const currentStep = Number(step) || 1;
  const [transcript, setTranscript] = useState('');
  const [paused, setPaused] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [canRequestDifferentQuestion, setCanRequestDifferentQuestion] = useState(false);
  const [isRequestingDifferentQuestion, setIsRequestingDifferentQuestion] = useState(false);
  const [onRequestDifferentQuestionHandler, setOnRequestDifferentQuestionHandler] = useState<(() => void) | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isRegeneratingQuestion, setIsRegeneratingQuestion] = useState(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);

  // Background transcription status tracking
  const {
    hasBackgroundProcessing,
    pendingStages,
  } = useTranscriptionStatus(
    access_token,
    true, // Background transcription is always enabled
    3000 // Poll every 3 seconds
  );

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

      try {
        const response = await fetch(`/api/mentor-interview/${access_token}/response/${currentStep}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentQuestion({
            question: data.question || 'Question will be generated based on your previous responses.',
            preamble: getQuestionPreamble(currentStep),
            supporting: data.preamble || "Based on your previous answer, here's your next question:",
          });
        } else {
          setCurrentQuestion({
            question: '',
            preamble: getQuestionPreamble(currentStep),
            supporting: 'Loading your personalized question...',
          });
        }
      } catch (error) {
        console.error('Error loading question:', error);
        setCurrentQuestion({
          question: '',
          preamble: getQuestionPreamble(currentStep),
          supporting: 'Error loading question. Please refresh the page.',
        });
      } finally {
        setIsLoadingQuestion(false);
      }
    };

    loadQuestion();
  }, [currentStep, access_token, getQuestionPreamble]);

  const onInputStateChange = useCallback(
    ({
      paused: p,
      transcript: t,
      hasAudio: a,
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
      setPaused(p);
      setTranscript(t);
      if (a !== undefined) {
        setHasAudio(a);
      }
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
    setTranscript(savedText);
  }, []);

  const goBack = useCallback(() => {
    setIsLoadingQuestion(true);
    if (currentStep > 1) {
      navigate(`/mentor-interview/${access_token}/question/${currentStep - 1}`);
    } else {
      navigate(`/mentor-interview/${access_token}/start`);
    }
  }, [navigate, access_token, currentStep]);

  // Handle navigation after question preloading is complete
  const handleContinueImmediate = useCallback(() => {
    if (currentStep === TOTAL_QUESTIONS) {
      // Final question - navigate to complete page with insights
      navigate(`/mentor-interview/${access_token}/complete`);
    } else {
      // Navigate to next question (preloading already handled by button)
      navigate(`/mentor-interview/${access_token}/question/${currentStep + 1}`);
    }
  }, [currentStep, navigate, access_token]);

  // Handle final question completion (after transcription or timeout)
  const handleFinalQuestionComplete = useCallback(() => {
    navigate(`/mentor-interview/${access_token}/complete`);
  }, [navigate, access_token]);

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



  if (!access_token || !currentQuestion) return null;

  const hasContent = transcript.trim().length > 0;
  const isFinalQuestion = currentStep === TOTAL_QUESTIONS;

  return (
    <div className="flex flex-col items-center justify-center gap-6 bg-[#F8F4EB] p-4">
      {/* Background Transcription Indicator */}
      <BackgroundTranscriptionIndicator
        hasBackgroundProcessing={hasBackgroundProcessing}
        pendingStages={pendingStages}
        isVisible={currentStep > 1} // Only show from question 2 onwards
      />

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
              isFinalQuestion={isFinalQuestion}
              onStateChange={onInputStateChange}
              onSave={(saveFn) => {
                saveRef.current = saveFn;
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
              disabled={isLoading}
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