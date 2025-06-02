/* eslint-disable i18next/no-literal-string */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MentorAudioTextInput from './MentorAudioTextInput';

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
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);

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
    ({ paused: p, transcript: t }: { paused: boolean; transcript: string }) => {
      setPaused(p);
      setTranscript(t);
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

  // Unified action handler - handles all continue/skip/finish actions
  const handleAction = useCallback(async (actionType: 'continue' | 'skip' | 'finish') => {
    setIsLoading(true);
    
    try {
      // Always save current content first (if any)
      if (saveRef.current && transcript.trim()) {
        await saveRef.current();
      }
      
      if (actionType === 'finish') {
        navigate(`/mentor-interview/${access_token}/review`);
        return;
      }

      // Generate next question (continue or skip)
      const response = await fetch(`/api/mentor-interview/${access_token}/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previous_stage_id: currentStep,
          answer_text: actionType === 'skip' ? '' : transcript,
        }),
      });

      if (response.ok) {
        const responseText = await response.text();
        
        if (responseText.includes('event:') || responseText.includes('data:')) {
          alert('Server returned streaming format instead of JSON. Please refresh the page and try again.');
          return;
        }
        
        const nextQuestionData = JSON.parse(responseText);
        
        if (nextQuestionData.stage_id) {
          // Navigate to next question
          setIsLoadingQuestion(true);
          navigate(`/mentor-interview/${access_token}/question/${currentStep + 1}`);
        } else {
          alert('Received incomplete response from server. Please try again.');
        }
      } else {
        alert('Failed to generate next question. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, transcript, navigate, access_token]);

  if (!access_token || !currentQuestion) return null;

  const hasContent = transcript.trim().length > 0;
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
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg sm:p-8">
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
              accessToken={access_token}
              stageId={currentStep}
              onStateChange={onInputStateChange}
              onSave={(saveFn) => {
                saveRef.current = saveFn;
              }}
              onSaveComplete={onSaveComplete}
            />
          </div>
        )}

        {/* Simplified Navigation */}
        {!isLoadingQuestion && (
          <div className="mt-8">
            {isFinalQuestion ? (
              // Final question: Review Answers button as per MentorReviewSubmitSpec.md
              <>
                <div className="mb-6">
                  <button
                    className="w-full rounded-md bg-[#B04A2F] py-3 px-4 text-base font-medium text-white transition hover:bg-[#8a3a23] focus:outline-none focus:ring-2 focus:ring-[#B04A2F] focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={() => handleAction('finish')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                          <div className="absolute inset-0 rounded-full h-5 w-5 border-2 border-transparent border-t-white animate-pulse"></div>
                        </div>
                        <span className="animate-pulse">Preparing your review...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Review Your Answers
                      </div>
                    )}
                  </button>
                </div>
                
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
            ) : (
              // Questions 1-9: Continue to next question
              <div className="flex items-center justify-between">
                <button 
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                  onClick={goBack}
                  disabled={isLoading}
                >
                  ← Go back
                </button>

                {(hasContent || currentStep > 1) && (
                  <button
                    className="text-sm text-[#B04A2F] hover:text-[#8a3a23] underline font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                    onClick={() => handleAction(hasContent ? 'continue' : 'skip')}
                    disabled={isLoading || (!hasContent && !paused)}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse">
                          {hasContent ? 'Saving Answer' : 'Moving ahead'}
                        </span>
                        <div className="animate-spin rounded-full h-3 w-3 border border-[#B04A2F]/30 border-t-[#B04A2F]"></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {hasContent ? (
                          <>
                            <span>Continue</span>
                            <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>Skip question</span>
                            <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </>
                        )}
                      </div>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorInterviewQuestion;