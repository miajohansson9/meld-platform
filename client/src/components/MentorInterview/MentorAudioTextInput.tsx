/* eslint-disable i18next/no-literal-string */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useSpeechToTextIncremental } from '~/hooks';

interface MentorAudioTextInputProps {
  mentorInterestId: string;
  stageId: number;
  onStateChange?: (s: { paused: boolean; transcript: string }) => void;
  onSave?: (saveFn: () => Promise<void>) => void;
  onSaveComplete?: (text: string) => void;
}

const MentorAudioTextInput: React.FC<MentorAudioTextInputProps> = ({
  mentorInterestId,
  stageId,
  onStateChange,
  onSave,
  onSaveComplete,
}) => {
  /* ───────── state / refs ───────── */
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [transcript, setTranscript] = useState('');
  const savedRef = useRef('');                   // last text we know is on server
  const speechBaseRef = useRef('');              // transcript state when recording started
  const speechWordCountRef = useRef(0);          // highest word count during current speech session
  const lastTranscriptRef = useRef('');          // track transcript changes for reset detection
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ───────── load initial ───────── */
  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/mentor-interest/${mentorInterestId}/response/${stageId}`,
      );
      if (!res.ok) return;
      const { response_text = '' } = await res.json();
      savedRef.current = response_text;
      setTranscript(response_text);
    })().catch(console.error);
  }, [mentorInterestId, stageId]);

  /* ───────── save ───────── */
  const saveTranscript = useCallback(async () => {
    // Always get the current transcript value, not from closure
    const textareaValue = textareaRef.current?.value;
    const currentTranscript = textareaValue || transcript;
    const text = currentTranscript.trim();

    if (text === savedRef.current) return;

    const res = await fetch(
      `/api/mentor-interest/${mentorInterestId}/response/${stageId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_text: text }),
      },
    ).catch(console.error);

    if (res?.ok) {
      const { response_text = text } = await res.json();
      savedRef.current = response_text;
      onSaveComplete?.(response_text);
    }
  }, [mentorInterestId, stageId, transcript, onSaveComplete]);

  /* expose save → parent */
  useEffect(() => {
    onSave?.(saveTranscript);
  }, [onSave, saveTranscript]);

  /* ───────── speech hook ───────── */
  const { isListening, startRecording, stopRecording } = useSpeechToTextIncremental(
    // incremental - append chunk to existing
    (chunk) => {
      setTranscript((prev) => prev + chunk);
    },
    // correction - REPLACE current session with corrected session
    (sessionText) => {
      // Check if the session contains content that's already in our base
      // If so, the speech API has combined sessions - use session as the complete transcript
      if (speechBaseRef.current && sessionText.includes(speechBaseRef.current.trim())) {
        setTranscript(sessionText);
        speechBaseRef.current = sessionText;
        saveTranscript();
      } else {
        // Normal case - append session to base
        const newTranscript = speechBaseRef.current + sessionText;
        setTranscript(newTranscript);
      }
    },
    // final - no-op since we handle saving elsewhere
    () => {},
  );

  /* ───────── callbacks ───────── */
  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
      saveTranscript();
    } else {
      // Capture current transcript as base for new speech
      speechBaseRef.current = transcript;
      // Set initial word count for this speech session
      const words = transcript.trim();
      speechWordCountRef.current = words ? words.split(/\s+/).filter(Boolean).length : 0;
      startRecording();
    }
  };

  const switchToText = () => {
    if (isListening) stopRecording();
    setMode('text');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const switchToAudio = () => {
    setMode('audio');
    saveTranscript(); // Save when switching modes
  };

  /* ───────── parent state update ───────── */
  useEffect(() => {
    onStateChange?.({ paused: mode === 'text' || !isListening, transcript });
  }, [mode, isListening, transcript, onStateChange]);

  /* ───────── derived ───────── */
  const wordCount = useMemo(() => {
    const currentWords = transcript.trim();
    const actualCount = currentWords ? currentWords.split(/\s+/).filter(Boolean).length : 0;
    
    if (isListening) {
      // always update to actual count if it's higher (for real-time increases)
      const newCount = Math.max(actualCount, speechWordCountRef.current);
      speechWordCountRef.current = newCount;
      lastTranscriptRef.current = transcript;
      return newCount;
    } else {
      // When not listening, use actual count and reset high-water mark
      speechWordCountRef.current = 0;
      return actualCount;
    }
  }, [transcript, isListening]);

  const targetWords = 200;
  const percent = Math.min(wordCount / targetWords, 1);
  const radius = 44;
  const stroke = 2;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - percent * circumference;

  /* ───────── render (UNCHANGED styles) ───────── */
  return (
    <div className="flex w-full flex-col items-center">
      {mode === 'audio' ? (
        <>
          <div className="relative mb-2" style={{ width: 96, height: 96 }}>
            <svg
              width={96}
              height={96}
              viewBox="0 0 96 96"
              className="absolute left-0 top-0 z-10"
            >
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
              {/* original mic SVG */}
              <svg
                width={48}
                height={48}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx={24}
                  cy={24}
                  r={24}
                  fill={isListening ? '#fff' : '#B04A2F'}
                />
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
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
            }}
            placeholder="Type your response..."
            onBlur={saveTranscript}
          />
          <button type="button" className="mt-2 text-sm underline" onClick={switchToAudio}>
            Record instead
          </button>
        </>
      )}
      <p className="relative mt-2 text-sm text-gray-500">{wordCount} words</p>
    </div>
  );
};

export default MentorAudioTextInput;
