import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSpeechToText } from '~/hooks';

interface MentorAudioTextInputProps {
  onSubmit: (transcript: string) => void;
  disabled?: boolean;
  onStateChange?: (state: { paused: boolean; transcript: string }) => void;
  onAutoSave?: (transcript: string, paused: boolean) => void;
}

const MentorAudioTextInput: React.FC<MentorAudioTextInputProps> = ({
  onSubmit,
  disabled = false,
  onStateChange,
  onAutoSave,
}) => {
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onTranscriptionComplete = useCallback(
    (finalText: string) => {
      setTranscript(finalText);
      onSubmit(finalText);
    },
    [onSubmit],
  );

  const { isListening, isLoading, startRecording, stopRecording } = useSpeechToText(
    setTranscript,
    onTranscriptionComplete,
  );

  // Sync isRecording & timer with speech-to-text hook
  useEffect(() => {
    if (isListening) {
      setIsRecording(true);
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => {
          setTimer((t) => t + 1);
        }, 1000);
      }
    } else {
      if (isRecording) setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [isListening, isRecording]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.({ paused: !isRecording, transcript });
  }, [isRecording, transcript, onStateChange]);

  // Keyboard shortcuts
  const toggleRecording = useCallback(() => {
    if (disabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [disabled, isRecording, startRecording, stopRecording]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (mode === 'audio' && e.code === 'Space') {
        e.preventDefault();
        toggleRecording();
      }
      if (mode === 'text' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit(transcript);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, transcript, toggleRecording, onSubmit, disabled]);

  const switchToText = () => {
    if (isRecording) stopRecording();
    setMode('text');
    setTimeout(() => {
      textareaRef.current?.focus();
      const len = textareaRef.current?.value.length || 0;
      textareaRef.current?.setSelectionRange(len, len);
    }, 0);
  };

  const switchToAudio = () => {
    setMode('audio');
    startRecording();
  };

  // Format timer as mm:ss
  const formatTimer = (t: number) => {
    const minutes = Math.floor(t / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (t % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Debounce for typing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (transcript.length > 0 && transcript.length % 50 === 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onAutoSave?.(transcript, false);
      }, 500);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [transcript, onAutoSave]);

  // Save on pause (immediate)
  useEffect(() => {
    if (!isRecording && transcript.length > 0) {
      onAutoSave?.(transcript, true);
    }
  }, [isRecording, transcript, onAutoSave]);

  return (
    <div className="flex w-full flex-col items-center">
      {mode === 'audio' ? (
        <>
          <button
            type="button"
            onClick={toggleRecording}
            disabled={disabled}
            aria-pressed={isRecording}
            className={`mb-2 flex h-20 w-20 items-center justify-center rounded-full border-4 transition-colors duration-200 ${isRecording ? 'border-[#B04A2F] bg-white' : 'border-[#B04A2F] bg-[#B04A2F]'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`.replace(
              /\s+/g,
              ' ',
            )}
          >
            {/* Microphone SVG */}
            <svg
              width={48}
              height={48}
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx={24} cy={24} r={24} fill={isRecording ? '#fff' : '#B04A2F'} />
              <path
                d="M24 14C25.6569 14 27 15.3431 27 17V25C27 26.6569 25.6569 28 24 28C22.3431 28 21 26.6569 21 25V17C21 15.3431 22.3431 14 24 14Z"
                fill={isRecording ? '#B04A2F' : '#fff'}
              />
              <path
                d="M30 25C30 28.3137 27.3137 31 24 31C20.6863 31 18 28.3137 18 25"
                stroke={isRecording ? '#B04A2F' : '#fff'}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <path
                d="M24 31V34"
                stroke={isRecording ? '#B04A2F' : '#fff'}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex min-h-[24px] items-center justify-center">
            {isRecording || timer > 0 ? (
              <span className="font-serif inline-block rounded-full bg-theme-rose px-4 py-1 text-lg font-semibold text-theme-charcoal">
                {formatTimer(timer)}
              </span>
            ) : (
              'record your response'
            )}
          </div>
          <button
            type="button"
            className="mt-2 text-sm text-[#222] underline"
            onClick={switchToText}
            disabled={disabled}
          >
            Type instead
          </button>
        </>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            className="min-h-[220px] w-full resize-y rounded border border-[#C9C9B6] p-4 text-xl"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={disabled}
            placeholder="Type your response..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(transcript);
              }
            }}
          />
          <button
            type="button"
            className="mt-2 text-sm text-[#222] underline"
            onClick={switchToAudio}
            disabled={disabled}
          >
            Record instead
          </button>
        </>
      )}
    </div>
  );
};

export default MentorAudioTextInput;
