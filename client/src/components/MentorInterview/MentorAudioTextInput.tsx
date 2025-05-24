/* eslint-disable i18next/no-literal-string */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSpeechToText } from '~/hooks';

interface MentorAudioTextInputProps {
  mentorInterestId: string;
  stageId: number;
  onSubmit: (transcript: string) => void;
  onStateChange?: (state: { paused: boolean; transcript: string }) => void;
}

const MentorAudioTextInput: React.FC<MentorAudioTextInputProps> = ({
  mentorInterestId,
  stageId,
  onSubmit,
  onStateChange,
}) => {
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [startingText, setStartingText] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [percent, setPercent] = useState(0);
  const maxWords = 300;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch initial transcript
  useEffect(() => {
    fetch(`/api/mentor-interest/${mentorInterestId}/response/${stageId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.response_text) {
          setStartingText(data.response_text);
          setFullTranscript(data.response_text);
        }
      })
      .catch(console.error);
  }, [mentorInterestId, stageId]);

  // Update word count and percent
  useEffect(() => {
    const displayTranscript = mode === 'audio' ? startingText + interimTranscript : fullTranscript;
    const words = displayTranscript.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setPercent(Math.min(words / maxWords, 1));
    setFullTranscript(displayTranscript);
  }, [startingText, fullTranscript, interimTranscript, mode]);

  // Save transcript to server
  const saveTranscript = useCallback(async () => {
    try {
      const response = await fetch(`/api/mentor-interest/${mentorInterestId}/response/${stageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_text: fullTranscript }),
      });
      if (response.ok) {
        const data = await response.json();
        setFullTranscript(data.response_text);
      }
    } catch (error) {
      console.error(error);
    }
  }, [mentorInterestId, stageId, fullTranscript]);

  // Save transcript periodically
  useEffect(() => {
    if (!fullTranscript && !interimTranscript) return;
    const timeout = setTimeout(saveTranscript, 1000);
    return () => clearTimeout(timeout);
  }, [fullTranscript, interimTranscript, saveTranscript]);

  const { isListening, startRecording, stopRecording } = useSpeechToText(
    setInterimTranscript,
    setFullTranscript,
  );

  useEffect(() => {
    onStateChange?.({
      paused: mode === 'text' || !isListening,
      transcript: fullTranscript,
    });
  }, [isListening, mode, fullTranscript, onStateChange]);

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
      if (fullTranscript || interimTranscript) saveTranscript();
    } else {
      startRecording();
    }
  };

  const switchToText = () => {
    if (isListening) stopRecording();
    if (fullTranscript || interimTranscript) saveTranscript();
    setMode('text');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const switchToAudio = () => {
    if (fullTranscript || interimTranscript) saveTranscript();
    setMode('audio');
  };

  const radius = 44;
  const stroke = 4;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - percent * circumference;

  return (
    <div className="flex w-full flex-col items-center">
      {mode === 'audio' ? (
        <>
          <div className="relative mb-2" style={{ width: 96, height: 96 }}>
            <svg width={96} height={96} viewBox="0 0 96 96" className="absolute left-0 top-0 z-10">
              <circle
                cx={48}
                cy={48}
                r={normalizedRadius}
                stroke="#ccc"
                strokeWidth={stroke}
                fill="none"
              />
              <circle
                cx={48}
                cy={48}
                r={normalizedRadius}
                stroke="#B04A2F"
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <button
              type="button"
              onClick={toggleRecording}
              aria-pressed={isListening}
              className={`absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200 ${
                isListening ? 'bg-white' : 'bg-[#B04A2F]'
              }`.replace(/\s+/g, ' ')}
            >
              <svg
                width={48}
                height={48}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx={24} cy={24} r={24} fill={isListening ? '#fff' : '#B04A2F'} />
                <path
                  d="M24 14C25.6569 14 27 15.3431 27 17V25C27 26.6569 25.6569 28 24 28C22.3431 28 21 26.6569 21 25V17C21 15.3431 22.3431 14 24 14Z"
                  fill={isListening ? '#B04A2F' : '#fff'}
                />
                <path
                  d="M30 25C30 28.3137 27.3137 31 24 31C20.6863 31 18 28.3137 18 25"
                  stroke={isListening ? '#B04A2F' : '#fff'}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                <path
                  d="M24 31V34"
                  stroke={isListening ? '#B04A2F' : '#fff'}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <button type="button" className="mt-2 text-sm underline" onClick={switchToText}>
            Type instead
          </button>
        </>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            className="min-h-[220px] w-full resize-y rounded border p-4 text-xl"
            value={fullTranscript}
            onChange={(e) => setFullTranscript(e.target.value)}
            placeholder="Type your response..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(fullTranscript);
              }
            }}
          />
          <p className="mt-2 text-sm text-gray-500">{wordCount} words</p>
          <button type="button" className="mt-2 text-sm underline" onClick={switchToAudio}>
            Record instead
          </button>
        </>
      )}
    </div>
  );
};

export default MentorAudioTextInput;
