/* eslint-disable i18next/no-literal-string */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import FinalQuestionWaitOverlay from './FinalQuestionWaitOverlay';

interface MentorQuestionCardProps {
  accessToken: string;
  stageId: number;
  question?: string; // NEW: The current question text
  preamble?: string; // NEW: The current preamble text
  isFinalQuestion?: boolean; // NEW: indicates if this is the final question
  onStateChange?: (s: { paused: boolean; transcript: string; hasAudio: boolean; canRequestDifferentQuestion?: boolean; isRequestingDifferentQuestion?: boolean; onRequestDifferentQuestion?: () => void }) => void;
  onSave?: (saveFn: () => Promise<void>) => void;
  onSaveComplete?: (text: string) => void;
  onContinue?: () => void; // Called for immediate navigation
  onFinalComplete?: () => void; // NEW: Called when final question transcription is ready
  onQuestionRejected?: () => void; // NEW: Called when question is rejected
}

// Recording state machine
type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'transcribing' | 'complete' | 'error';

const MentorQuestionCard: React.FC<MentorQuestionCardProps> = ({
  accessToken,
  stageId,
  question,
  preamble,
  isFinalQuestion = false,
  onStateChange,
  onSave,
  onSaveComplete,
  onContinue,
  onFinalComplete,
  onQuestionRejected,
}) => {
  /* ───────── state / refs ───────── */
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [transcript, setTranscript] = useState('');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isEditingTranscription, setIsEditingTranscription] = useState(false);
  const [editedText, setEditedText] = useState<string>('');
  const [showFinalWait, setShowFinalWait] = useState(false); // NEW: show final question wait overlay
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStartedRecording, setHasStartedRecording] = useState(false);
  const [isRequestingDifferentQuestion, setIsRequestingDifferentQuestion] = useState(false);
  
  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedRef = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ───────── load initial ───────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/mentor-interview/${accessToken}/response/${stageId}`,
        );
        if (!res.ok) return;
        
        const data = await res.json();
        const { response_text = '', duration_ms } = data;
        
        savedRef.current = response_text;
        setTranscript(response_text);
        
        // If we have transcribed text, set it as completed
        if (response_text) {
          setTranscribedText(response_text);
          setRecordingState('complete');
          
          // Set duration if available and we're in audio mode
          if (duration_ms && mode === 'audio') {
            setRecordingDuration(Math.floor(duration_ms / 1000));
            setHasStartedRecording(true); // Mark as having started recording if we have audio content
          }
        }
      } catch (error) {
        console.error('Error loading response:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accessToken, stageId, mode]);

  /* ───────── recording timer ───────── */
  useEffect(() => {
    if (recordingState === 'recording') {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [recordingState]);

  /* ───────── save text ───────── */
  const saveTranscript = useCallback(async () => {
    const textareaValue = textareaRef.current?.value;
    const currentTranscript = textareaValue || transcript;
    const text = currentTranscript.trim();

    if (text === savedRef.current) return;

    try {
      const res = await fetch(
        `/api/mentor-interview/${accessToken}/response/${stageId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response_text: text }),
        },
      );

      if (res?.ok) {
        const { response_text = text } = await res.json();
        savedRef.current = response_text;
        onSaveComplete?.(response_text);
      }
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  }, [accessToken, stageId, transcript, onSaveComplete]);

  /* ───────── expose save → parent ───────── */
  useEffect(() => {
    onSave?.(saveTranscript);
  }, [onSave, saveTranscript]);

  /* ───────── recording controls ───────── */
  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      
      // Create MediaRecorder with webm format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        await handleRecordingComplete();
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');
      setRecordingDuration(0);
      setHasStartedRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert(
        'Microphone access is off.\n\n' +
        'Use Safari instead or enable microphone access by following these steps:\n' +
        '• Open the iOS Settings app ▸ Chrome ▸ Microphone (and Speech Recognition) ▸ Allow.\n' +
        '• Return here and tap “Record”.'
      );
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  }, [recordingState]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  }, [recordingState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');
      
      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
    }
  }, [recordingState]);

  /* ───────── handle recording completion ───────── */
  const handleRecordingComplete = useCallback(async () => {
    try {
      setRecordingState('transcribing');
      
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const durationMs = recordingDuration * 1000;
      
      console.log('[MentorQuestionCard] Starting synchronous transcription:', {
        blobSize: audioBlob.size,
        durationMs,
        stageId
      });

      // Create form data with audio blob for immediate transcription
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration_ms', durationMs.toString());
      
      // POST directly to mentor response endpoint (multipart) for immediate transcription
      const response = await fetch(`/api/mentor-interview/${accessToken}/response/${stageId}`, {
        method: 'POST',
        body: formData  // Multipart with audio
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`Transcription failed: ${result.error || 'Unknown error'}`);
      }
      
      console.log('[MentorQuestionCard] Transcription completed:', result);
      
      // Show transcribed text to user
      setTranscribedText(result.response_text);
      setTranscript(result.response_text);
      savedRef.current = result.response_text;
      setRecordingState('complete');
      
      // Notify parent of completion
      onSaveComplete?.(result.response_text);
      
      // Clear chunks
      audioChunksRef.current = [];
      
    } catch (error) {
      const errorObj = error as Error;
      console.error('[MentorQuestionCard] Transcription failed:', {
        error: errorObj.message,
        stack: errorObj.stack,
        stageId,
        accessToken: accessToken?.substring(0, 10) + '...'
      });
      
      setRecordingState('error');
      
      // Provide specific error message
      const errorMessage = `Transcription failed: ${errorObj.message}`;
      alert(errorMessage);
    }
  }, [recordingDuration, stageId, accessToken, onSaveComplete]);

  /* ───────── continue to next question ───────── */
  const handleContinue = useCallback(() => {
    // For audio mode, transcription is already complete
    if (mode === 'audio' && recordingState === 'complete' && transcribedText) {
      if (isFinalQuestion) {
        // For final question, proceed directly (transcription already done)
        onFinalComplete?.();
      } else {
        // Transcription is complete, next question will have full context
        onContinue?.();
      }
    } else if (mode === 'text') {
      // For text mode, save and continue
      saveTranscript().then(() => {
        if (isFinalQuestion) {
          // For final question in text mode, proceed directly (no transcription needed)
          onFinalComplete?.();
        } else {
          onContinue?.();
        }
      });
    }
  }, [mode, recordingState, transcribedText, isFinalQuestion, onContinue, onFinalComplete, saveTranscript]);

  /* ───────── final question wait handlers ───────── */
  const handleFinalTranscriptionComplete = useCallback(() => {
    setShowFinalWait(false);
    onFinalComplete?.();
  }, [onFinalComplete]);

  const handleFinalTimeout = useCallback(() => {
    setShowFinalWait(false);
    onFinalComplete?.();
  }, [onFinalComplete]);

  /* ───────── different question handler ───────── */
  const handleRequestDifferentQuestion = useCallback(async () => {
    try {
      setIsRequestingDifferentQuestion(true);
      
      // Submit rejection
      await fetch(`/api/mentor-interview/${accessToken}/response/${stageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          response_text: 'Question doesn\'t fit mentor expertise. Choose different question.',
          status: 'rejected',
          rejection_reason: 'Question mismatch',
          question: question || 'Question text not available',
          preamble: preamble || 'Preamble not available'
        }),
      });
      
      // Trigger question regeneration
      onQuestionRejected?.();
      
    } catch (error) {
      console.error('Error requesting different question:', error);
      alert('Failed to request different question. Please try again.');
    } finally {
      setIsRequestingDifferentQuestion(false);
    }
  }, [accessToken, stageId, onQuestionRejected]);

  /* ───────── mode switching ───────── */
  const switchToText = useCallback(() => {
    if (recordingState === 'recording' || recordingState === 'paused') {
      stopRecording();
    }
    setMode('text');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [recordingState, stopRecording]);

  const switchToAudio = useCallback(() => {
    setMode('audio');
    saveTranscript(); // Save when switching modes
  }, [saveTranscript]);

  /* ───────── parent state update ───────── */
  useEffect(() => {
    const isPaused = mode === 'text' || recordingState === 'paused' || recordingState === 'idle';
    const hasAudio = transcribedText.length > 0 || recordingState === 'complete';
    
    onStateChange?.({ 
      paused: isPaused, 
      transcript: transcribedText || transcript, 
      hasAudio,
      canRequestDifferentQuestion: stageId > 1 && !transcript.trim() && !transcribedText.trim() && recordingState !== 'recording' && recordingState !== 'transcribing',
      isRequestingDifferentQuestion,
      onRequestDifferentQuestion: handleRequestDifferentQuestion
    });
  }, [mode, recordingState, transcript, transcribedText, onStateChange, stageId, isRequestingDifferentQuestion, handleRequestDifferentQuestion, recordingDuration]);

  /* ───────── derived state ───────── */
  const wordCount = useMemo(() => {
    const words = transcript.trim();
    return words ? words.split(/\s+/).filter(Boolean).length : 0;
  }, [transcript]);

  const canContinue = useMemo(() => {
    if (mode === 'audio') {
      return recordingState === 'complete' && transcribedText.length > 0 && !isEditingTranscription;
    } else {
      return transcript.trim().length > 0;
    }
  }, [mode, recordingState, transcribedText, transcript, isEditingTranscription]);

  /* ───────── format duration ───────── */
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /* ───────── render recording controls ───────── */
  const renderRecordingControls = () => {
    if (recordingState === 'transcribing') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#B04A2F] border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#B04A2F]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">Transcribing your recording...</p>
              <p className="text-sm text-gray-600 mt-1">This usually takes 5 to 10 seconds</p>
            </div>
          </div>
        </div>
      );
    }

    if (recordingState === 'complete' && transcribedText) {
      return (
        <div className="space-y-6">
          {/* Simple success indicator */}
          <div className="flex items-center justify-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Recording transcribed successfully!</span>
          </div>
          
          {/* Transcription content - minimal */}
          {isEditingTranscription ? (
            <div className="space-y-4">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Edit your transcription..."
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditedText(transcribedText);
                    setIsEditingTranscription(false);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Save the edited text
                    setTranscribedText(editedText);
                    setIsEditingTranscription(false);
                    // Save to database
                    try {
                      await fetch(`/api/mentor-interview/${accessToken}/response/${stageId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ response_text: editedText }),
                      });
                      onSaveComplete?.(editedText);
                    } catch (error) {
                      console.error('Error saving edited text:', error);
                    }
                  }}
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Clean transcription display */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 leading-relaxed">{transcribedText}</p>
              </div>
              
              {/* Minimal action links */}
              <div className="flex justify-center gap-6 text-sm">
                <button
                  onClick={() => {
                    setEditedText(transcribedText);
                    setIsEditingTranscription(true);
                  }}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  Edit transcription
                </button>
                <button
                  onClick={() => {
                    // Reset to idle state for re-recording
                    setRecordingState('idle');
                    setTranscribedText('');
                    setRecordingDuration(0);
                    setHasStartedRecording(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  Delete and re-record
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (recordingState === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-red-600 mb-2">Transcription failed</p>
          <p className="text-xs text-gray-500">Please try recording again</p>
          <button 
            onClick={() => setRecordingState('idle')}
            className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-8">
        {/* Duration display */}
        {recordingDuration > 0 && (
          <div className="mb-4 text-lg font-mono text-gray-700">
            {formatDuration(recordingDuration)}
          </div>
        )}

        {/* Recording button */}
        <div className="relative mb-4">
          <button
            type="button"
            onClick={
              recordingState === 'idle' ? startRecording :
              recordingState === 'recording' ? pauseRecording :
              recordingState === 'paused' ? resumeRecording :
              undefined
            }
            disabled={recordingState === 'stopped'}
            className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 ${
              recordingState === 'recording' 
                ? 'bg-red-500 hover:bg-red-600' 
                : recordingState === 'paused'
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-[#B04A2F] hover:bg-[#8a3a23]'
            } ${recordingState === 'stopped' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {recordingState === 'recording' ? (
              // Pause icon
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : recordingState === 'paused' ? (
              // Resume/Play icon
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            ) : (
              // Microphone icon
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          {/* Recording indicator */}
          {recordingState === 'recording' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full animate-pulse border-2 border-white">
              <div className="w-2 h-2 bg-white rounded-full absolute top-1 left-1 animate-ping"></div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Stop & Save
            </button>
          )}
        </div>

        {/* Status text */}
        <p className="mt-3 text-xs text-gray-500 text-center">
          {recordingState === 'idle' && 'Tap to start recording'}
          {recordingState === 'recording' && 'Recording... Tap to pause'}
          {recordingState === 'paused' && 'Paused. Tap to resume or stop to save'}
          {recordingState === 'stopped' && 'Processing...'}
        </p>
      </div>
    );
  };

  /* ───────── render ───────── */
  if (isLoading) {
    return <div>Loading...</div>
  }

  /* ───────── render mode selector ───────── */
  const renderModeSelector = () => {
    if (hasStartedRecording || recordingState === 'complete' || recordingState === 'transcribing') {
      return null; // Don't show mode selector after recording has started or completed
    }

    // Also hide if user has already typed content
    if (transcript.trim().length > 0) {
      return null;
    }

    return (
      <div className="mb-2 flex items-center justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('audio')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'audio'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎤 Record
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'text'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✏️ Write
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-full">
        {renderModeSelector()}
        
        {mode === 'audio' ? (
          <>
            {renderRecordingControls()}
            {canContinue && !isEditingTranscription && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    // Update status to 'submitted' when continuing
                    await fetch(`/api/mentor-interview/${accessToken}/response/${stageId}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        response_text: transcribedText,
                        status: 'submitted'
                      }),
                    });
                    
                    onSaveComplete?.(transcribedText);

                    // If final question, generate insights first
                    if (isFinalQuestion) {
                      try {
                        const insightsResponse = await fetch(`/api/mentor-interview/${accessToken}/generate-insights`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                        });
                        
                        if (insightsResponse.ok) {
                          const insightsData = await insightsResponse.json();
                          // Store insights in localStorage for the complete page
                          localStorage.setItem('mentor_insights', JSON.stringify(insightsData));
                        }
                      } catch (insightsError) {
                        console.error('Error generating insights:', insightsError);
                        // Continue anyway if insights fail
                      }
                      
                      onContinue?.();
                      return;
                    }

                    // For non-final questions, preload next question before navigation
                    try {
                      const response = await fetch(`/api/mentor-interview/${accessToken}/generate-question`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          previous_stage_id: stageId,
                          answer_text: transcribedText,
                        }),
                      });

                      if (response.ok) {
                        const responseText = await response.text();
                        if (!responseText.includes('event:') && !responseText.includes('data:')) {
                          const nextQuestionData = JSON.parse(responseText);
                          if (nextQuestionData.stage_id) {
                            // Question is ready, now navigate
                            onContinue?.();
                            return;
                          }
                        }
                      }
                    } catch (questionError) {
                      console.error('Error preloading next question:', questionError);
                    }
                    
                    // If preloading fails, still navigate
                    onContinue?.();
                    
                  } catch (error) {
                    console.error('Error submitting response:', error);
                    // Still continue even if API call fails
                    onContinue?.();
                  }
                  // Don't reset isSubmitting here - let navigation handle it
                }}
                className={`w-full mt-8 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#B04A2F] hover:bg-[#8a3a23]'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isFinalQuestion ? 'Wrapping up interview...' : 'Preparing next question...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{isFinalQuestion ? 'Approve Transcript & Continue' : 'Approve Transcript & Continue'}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </button>
            )}
          </>
        ) : (
          <>


            <textarea
              ref={textareaRef}
              className="min-h-[220px] w-full resize-y rounded border p-4 text-xl"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type your response..."
              onBlur={saveTranscript}
            />
            <div className="flex justify-end items-center mt-2">
              {canContinue && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      // Update status to 'submitted' when continuing
                      await fetch(`/api/mentor-interview/${accessToken}/response/${stageId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          response_text: transcript,
                          status: 'submitted'
                        }),
                      });
                      
                      onSaveComplete?.(transcript);

                      // If final question, generate insights first
                      if (isFinalQuestion) {
                        try {
                          const insightsResponse = await fetch(`/api/mentor-interview/${accessToken}/generate-insights`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                          });
                          
                          if (insightsResponse.ok) {
                            const insightsData = await insightsResponse.json();
                            // Store insights in localStorage for the complete page
                            localStorage.setItem('mentor_insights', JSON.stringify(insightsData));
                          }
                        } catch (insightsError) {
                          console.error('Error generating insights:', insightsError);
                          // Continue anyway if insights fail
                        }
                        
                        onContinue?.();
                        return;
                      }

                      // For non-final questions, preload next question before navigation
                      try {
                        const response = await fetch(`/api/mentor-interview/${accessToken}/generate-question`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            previous_stage_id: stageId,
                            answer_text: transcript,
                          }),
                        });

                        if (response.ok) {
                          const responseText = await response.text();
                          if (!responseText.includes('event:') && !responseText.includes('data:')) {
                            const nextQuestionData = JSON.parse(responseText);
                            if (nextQuestionData.stage_id) {
                              // Question is ready, now navigate
                              onContinue?.();
                              return;
                            }
                          }
                        }
                      } catch (questionError) {
                        console.error('Error preloading next question:', questionError);
                      }
                      
                      // If preloading fails, still navigate
                      onContinue?.();
                      
                    } catch (error) {
                      console.error('Error submitting response:', error);
                      // Still continue even if API call fails
                      onContinue?.();
                    }
                    // Don't reset isSubmitting here - let navigation handle it
                  }}
                  className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#B04A2F] hover:bg-[#8a3a23]'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isFinalQuestion ? 'Wrapping up interview...' : 'Preparing next question...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>{isFinalQuestion ? 'Approve Transcript & Continue' : 'Approve Transcript & Continue'}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </button>
              )}
            </div>
          </>
        )}
        

      </div>

      {/* Final Question Wait Overlay */}
      <FinalQuestionWaitOverlay
        accessToken={accessToken}
        stageId={stageId}
        isVisible={showFinalWait}
        onTranscriptionComplete={handleFinalTranscriptionComplete}
        onTimeout={handleFinalTimeout}
        maxWaitTime={15000} // 15 seconds
        pollInterval={2000}  // Poll every 2 seconds
      />
    </>
  );
};

export default MentorQuestionCard; 