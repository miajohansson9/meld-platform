/* eslint-disable i18next/no-literal-string */
import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MentorAudioTextInput from './MentorAudioTextInput';

const TOTAL_QUESTIONS = 5; // TODO: replace with dynamic count when available

const MentorInterviewQuestion: React.FC = () => {
  const { step, mentor_interest_id } = useParams();
  const navigate = useNavigate();
  const currentStep = Number(step) || 1;

  const isFirst = currentStep === 1;

  // Question content
  const preamble = isFirst ? (
    <span>
      Let's begin with a question we ask <i>every mentor</i>.
    </span>
  ) : (
    'Preamble for this question'
  );

  const supporting = isFirst ? (
    <span>
      At MELD, we recognize that every woman—no matter her success—is working <i>on</i> something
      and <i>through</i> something.
    </span>
  ) : (
    'Supporting text for this question'
  );

  const question = isFirst ? (
    <b>
      With that in mind, please tell us about:
      <br />
      1. An exciting project or goal you're currently working <i>on</i>
      <br />
      2. A meaningful challenge you're navigating <i>through</i>
    </b>
  ) : (
    `Question prompt for step ${currentStep}`
  );

  const extraText = isFirst ? (
    <span>
      As you answer, please include a bit about yourself. Your answer will be used to help us choose
      personalized questions you'll be uniquely suited to answer.
    </span>
  ) : null;

  // Local input state
  const [transcript, setTranscript] = useState('');
  const [paused, setPaused] = useState(false);

  const onInputStateChange = useCallback(
    ({ paused: p, transcript: t }: { paused: boolean; transcript: string }) => {
      setPaused(p);
      setTranscript(t);
    },
    [],
  );

  const handleSubmit = useCallback((text: string) => {
    setTranscript(text);
    // You can post to server here
  }, []);

  const handleAutoSave = useCallback(
    async (transcript: string, paused: boolean) => {
      if (!mentor_interest_id || !currentStep) return;
      const questionText = typeof question === 'string' ? question : '';
      const response = await fetch(
        `/api/mentor-interest/${mentor_interest_id}/response/${currentStep}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: questionText, response_text: transcript }),
        },
      );
      if (!response.ok) {
        console.error('Failed to save response:', response.statusText);
      }
    },
    [mentor_interest_id, currentStep, question],
  );

  const goNext = useCallback(() => {
    if (!mentor_interest_id) return;
    navigate(`/${mentor_interest_id}/mentor-interview/question/${currentStep + 1}`);
  }, [navigate, mentor_interest_id, currentStep]);

  return (
    <div className="relative flex min-h-screen w-full max-w-md flex-col items-center justify-center rounded-lg bg-white p-12 shadow-lg">
      {/* Logo */}
      <div className="absolute left-6 top-6">
        <img src="/assets/logo-b.svg" alt="MELD" className="h-7 w-auto dark:hidden" />
      </div>

      {/* Progress Dots */}
      <div className="absolute left-[-10px] top-0 flex h-full w-8 flex-col items-center justify-center">
        <div className="relative mb-[10vh] mt-[10vh] flex h-5/6 flex-col items-center justify-between">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#C9C9B6]" />
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => (
            <div
              key={idx}
              className={`relative z-10 m-2 h-3 w-3 rounded-full border-2 ${
                idx + 1 === currentStep
                  ? 'border-[#B04A2F] bg-[#B04A2F]'
                  : 'border-[#C9C9B6] bg-white'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="mt-20 w-full max-w-md rounded-lg p-0">
        <div className="font-serif mb-2 w-full text-2xl leading-snug text-[#B04A2F]">
          {preamble}
        </div>
        <div className="mb-4 w-full leading-snug text-black">{supporting}</div>
        <div className="mb-4 w-full text-lg leading-snug text-black">{question}</div>
        {extraText && <div className="mb-4 w-full leading-snug text-black">{extraText}</div>}

        {/* Audio/Text Input */}
        <div className="mt-4 flex w-full flex-col items-center">
          <MentorAudioTextInput
            onSubmit={handleSubmit}
            onStateChange={onInputStateChange}
            onAutoSave={handleAutoSave}
          />
        </div>

        {/* Navigation */}
        <div className="mt-8 flex w-full items-center justify-between px-2">
          <button className="flex items-center gap-1 text-sm text-[#222] underline">
            Resume Later
          </button>

          {paused && transcript.length > 50 ? (
            <button className="text-sm text-[#222] underline" onClick={goNext}>
              Save & continue →
            </button>
          ) : (
            !isFirst && (
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
