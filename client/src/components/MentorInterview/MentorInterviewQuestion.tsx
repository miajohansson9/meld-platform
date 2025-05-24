/* eslint-disable i18next/no-literal-string */
import React, { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MentorAudioTextInput from './MentorAudioTextInput';

const TOTAL_QUESTIONS = 5; // TODO: replace with dynamic count when available

const MentorInterviewQuestion: React.FC = () => {
  const { step, mentor_interest_id } = useParams<{ step?: string; mentor_interest_id?: string }>();
  const navigate = useNavigate();
  const currentStep = Number(step) || 1;
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
    setTranscript((prev) => prev + text);
  }, []);

  const goNext = useCallback(async () => {
    navigate(`/${mentor_interest_id}/mentor-interview/question/${currentStep + 1}`);
  }, [navigate, mentor_interest_id, currentStep]);

  // if there's no mentorInterestId in the URL, don't even render the input
  if (!mentor_interest_id) return null;

  const isFirst = currentStep === 1;

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
      As you answer, please introduce yourself as if you were at a dinner party. Your answer will be
      used to help us choose personalized questions you'll be uniquely suited to answer.
    </span>
  ) : null;

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
        <div className="font-serif mb-2 text-2xl leading-snug text-[#B04A2F]">{preamble}</div>
        <div className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {supporting}
        </div>
        <div className="mb-4 text-lg leading-snug text-black">{question}</div>
        {extraText && (
          <div className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {extraText}
          </div>
        )}

        {/* Audio/Text Input */}
        <div className="mt-4 flex w-full flex-col items-center">
          <MentorAudioTextInput
            mentorInterestId={mentor_interest_id}
            stageId={currentStep}
            onSubmit={handleSubmit}
            onStateChange={onInputStateChange}
          />
        </div>

        {/* Navigation */}
        <div className="ms-auto me-auto mt-8 flex w-full items-center justify-between gap-8 px-2">
          <button className="text-sm text-[#222] underline">Resume Later</button>

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