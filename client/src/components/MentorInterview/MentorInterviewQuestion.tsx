/* eslint-disable i18next/no-literal-string */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import MentorAudioTextInput from './MentorAudioTextInput';
import TagSelector from './TagSelector';

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
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);

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
        // Clear transcript since child component will load its own
        setTranscript('');
        return;
      }

      // For steps 2-3, load question from API
      try {
        const response = await fetch(
          `/api/mentor-interest/${mentor_interest_id}/response/${currentStep}`,
        );
        if (response.ok) {
          const data = await response.json();
          setCurrentQuestion({
            question: data.question || `Question for step ${currentStep}`,
            preamble: `Question ${currentStep} of ${TOTAL_QUESTIONS}`,
            supporting: data.preamble || "Based on your previous answer, here's your next question:",
          });
        } else {
          // Fallback question if not found
          setCurrentQuestion({
            question: `Adaptive question ${currentStep} will be generated after your previous answer.`,
            preamble: `Question ${currentStep} of ${TOTAL_QUESTIONS}`,
            supporting: 'This question will be personalized based on your previous responses.',
          });
        }
        // Clear transcript since child component will load its own
        setTranscript('');
      } catch (error) {
        console.error('Error loading question:', error);
        setCurrentQuestion({
          question: `Question ${currentStep}`,
          preamble: `Question ${currentStep} of ${TOTAL_QUESTIONS}`,
          supporting: 'Loading...',
        });
        setTranscript('');
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

  const goNext = useCallback(async () => {
    if (saveRef.current) {
      await saveRef.current();
    }
    navigate(`/${mentor_interest_id}/mentor-interview/question/${currentStep + 1}`);
  }, [navigate, mentor_interest_id, currentStep]);

  // Handle response submission and show tag selector
  const handleResponseSaved = useCallback(async () => {
    if (currentStep >= TOTAL_QUESTIONS) {
      // Final question, redirect to completion
      navigate(`/mentor-interview/complete`);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch similar questions for tag selection
      const response = await fetch(
        `/api/mentor-interest/questions/similar?text=${encodeURIComponent(transcript)}&k=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setSimilarQuestions(data.items || []);
        setShowTagSelector(true);
      } else {
        console.error('Failed to fetch similar questions');
        // Continue without tag selection
        goNext();
      }
    } catch (error) {
      console.error('Error fetching similar questions:', error);
      goNext();
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, navigate, transcript, token, goNext]);

  // Handle tag submission and generate next question
  const handleTagsSubmit = useCallback(
    async (selectedTags: string[]) => {
      setIsLoading(true);
      try {
        // Save tags
        const tagsResponse = await fetch(`/api/mentor-interest/${mentor_interest_id}/response/${currentStep}/tags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ selected_tags: selectedTags }),
        });

        if (!tagsResponse.ok) {
          console.error('Failed to save tags');
          // Continue to try generating next question anyway
        }

        // Generate next question
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
              selected_tags: selectedTags,
            }),
          },
        );

        if (nextQuestionResponse.ok) {
          const nextQuestionData = await nextQuestionResponse.json();
          console.log('Next question generated:', nextQuestionData);
          // Move to next question only if successful
          goNext();
        } else {
          const errorText = await nextQuestionResponse.text();
          console.error('Failed to generate next question:', errorText);
          alert('Failed to generate next question. Please try again.');
        }
      } catch (error) {
        console.error('Error submitting tags:', error);
        alert('An error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [mentor_interest_id, currentStep, transcript, token, goNext],
  );

  // if there's no mentorInterestId in the URL, don't even render the input
  if (!mentor_interest_id || !currentQuestion) return null;

  const isFirst = currentStep === 1;

  // Extract all unique tags from similar questions
  const allTags = Array.from(new Set(similarQuestions.flatMap((q) => q.subTags || []))).slice(
    0,
    10,
  ); // Limit to 10 tags as per requirements

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
              (idx + 1 === currentStep
                ? 'border-[#B04A2F] bg-[#B04A2F]'
                : idx + 1 < currentStep
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
        <div className="mt-4 flex w-full flex-col items-center">
          <MentorAudioTextInput
            mentorInterestId={mentor_interest_id}
            stageId={currentStep}
            onSubmit={handleSubmit}
            onStateChange={onInputStateChange}
            onSave={(saveFn) => {
              saveRef.current = saveFn;
            }}
          />
        </div>

        {/* Tag Selector - shown after response is saved */}
        {showTagSelector && allTags.length > 0 && (
          <TagSelector options={allTags} onSubmit={handleTagsSubmit} disabled={isLoading} />
        )}

        {/* Navigation */}
        <div className="me-auto ms-auto mt-8 flex w-full items-center justify-between gap-8 px-2">
          <button className="text-sm text-[#222] underline">Resume Later</button>

          {paused && transcript.length > 50 && !showTagSelector ? (
            <button
              className="text-sm text-[#222] underline"
              onClick={handleResponseSaved}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Save & continue →'}
            </button>
          ) : (
            !isFirst &&
            !showTagSelector && (
              <button className="text-sm text-[#222] underline" onClick={goNext}>
                Skip question →
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorInterviewQuestion;
