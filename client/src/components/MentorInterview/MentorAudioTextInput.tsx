/* eslint-disable i18next/no-literal-string */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSpeechToText } from '~/hooks';

interface MentorAudioTextInputProps {
  mentorInterestId: string;
  stageId: number;
  onSubmit: (transcript: string) => void;
  onStateChange?: (state: { paused: boolean; transcript: string }) => void;
  onSave?: (saveFn: () => Promise<void>) => void;
  onSaveComplete?: (savedText: string) => void;
}

const MentorAudioTextInput: React.FC<MentorAudioTextInputProps> = ({
  mentorInterestId,
  stageId,
  onSubmit,
  onStateChange,
  onSave,
  onSaveComplete,
}) => {
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [fullTranscript, setFullTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [percent, setPercent] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const targetWords = 200;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch initial transcript
  useEffect(() => {
    fetch(`/api/mentor-interest/${mentorInterestId}/response/${stageId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.response_text) {
          setFullTranscript(data.response_text);
        } else {
          setFullTranscript('');
        }
      })
      .catch(console.error);
  }, [mentorInterestId, stageId]);

  // Calculate current display content and word count
  const currentContent = mode === 'audio' ? fullTranscript + interimTranscript : fullTranscript;

  // Update word count and percent when content changes
  useEffect(() => {
    const words = currentContent.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setPercent(Math.min(words / targetWords, 1));
  }, [currentContent]);

  // Save transcript to server
  const saveTranscript = useCallback(async () => {
    // During speech, only save the fullTranscript (not interim results)
    const contentToSave = mode === 'audio' && interimTranscript ? fullTranscript : currentContent;
    if (!contentToSave.trim()) return;
    
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/mentor-interest/${mentorInterestId}/response/${stageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_text: contentToSave }),
      });
      if (response.ok) {
        const data = await response.json();
        // Only update if we successfully saved and got a response
        setFullTranscript(data.response_text || contentToSave);
        setSaveStatus('saved');
        
        // Clear saved status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
        
        if (onSaveComplete) {
          onSaveComplete(data.response_text || contentToSave);
        }
      } else {
        setSaveStatus('idle');
      }
    } catch (error) {
      console.error(error);
      setSaveStatus('idle');
    }
  }, [fullTranscript, currentContent, mode, interimTranscript, mentorInterestId, stageId, onSaveComplete]);

  // Smart debounced saving - only save when content changes and user stops activity
  useEffect(() => {
    // Don't save if no content
    if (!fullTranscript.trim()) return;
    
    // Debounced save after 3 seconds of no changes to fullTranscript
    const timeout = setTimeout(() => {
      saveTranscript();
    }, 3000);
    return () => {
      clearTimeout(timeout);
    };
  }, [fullTranscript, saveTranscript]);

  // Expose save function to parent
  useEffect(() => {
    if (onSave) {
      onSave(saveTranscript);
    }
  }, [onSave, saveTranscript]);

  const { isListening, startRecording, stopRecording } = useSpeechToText(
    setInterimTranscript,
    (newText) => {
      // When speech recognition provides final text, append it to fullTranscript
      setFullTranscript(prev => prev + newText);
      setInterimTranscript(''); // Clear interim after adding to full
    },
  );

  useEffect(() => {
    onStateChange?.({
      paused: mode === 'text' || !isListening,
      transcript: currentContent,
    });
  }, [isListening, mode, currentContent, onStateChange]);

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
      // Only add interim transcript if it's not empty and hasn't been processed yet
      // This handles cases where speech recognition stops without a final result
      if (interimTranscript.trim()) {
        setFullTranscript(prev => {
          // Check if the interim text is already included in the full transcript
          if (!prev.includes(interimTranscript.trim())) {
            return prev + interimTranscript;
          }
          return prev;
        });
        setInterimTranscript('');
      }
      saveTranscript();
    } else {
      startRecording();
    }
  };

  const switchToText = () => {
    if (isListening) {
      stopRecording();
      // Only add interim transcript if it's not empty and hasn't been processed yet
      if (interimTranscript.trim()) {
        setFullTranscript(prev => {
          // Check if the interim text is already included in the full transcript
          if (!prev.includes(interimTranscript.trim())) {
            return prev + interimTranscript;
          }
          return prev;
        });
        setInterimTranscript('');
      }
    }
    saveTranscript();
    setMode('text');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const switchToAudio = () => {
    saveTranscript();
    setMode('audio');
  };

  const radius = 44;
  const stroke = 2;
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
              className={`absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200 ${isListening ? 'bg-white' : 'bg-[#B04A2F]'
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
            onBlur={saveTranscript}
            placeholder="Type your response..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(fullTranscript);
              }
            }}
          />
          <button type="button" className="mt-2 text-sm underline" onClick={switchToAudio}>
            Record instead
          </button>
        </>
      )}
      <div className="relative mt-2">
        {saveStatus !== 'idle' ? (
          <p className="text-sm text-gray-500">
            {saveStatus === 'saving' ? 'Saving...' : 'Saved ✓'}
          </p>
        ) : (
          <p className="text-sm text-gray-500">{wordCount} words</p>
        )}
      </div>
    </div>
  );
};

export default MentorAudioTextInput;
