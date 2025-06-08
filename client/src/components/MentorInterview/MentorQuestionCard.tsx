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
  isFinalQuestion?: boolean; // NEW: indicates if this is the final question
  onStateChange?: (s: { paused: boolean; transcript: string; hasAudio: boolean }) => void;
  onSave?: (saveFn: () => Promise<void>) => void;
  onSaveComplete?: (text: string) => void;
  onContinue?: () => void; // Called for immediate navigation
  onFinalComplete?: () => void; // NEW: Called when final question transcription is ready
}

// Recording state machine
type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading' | 'complete';

const MentorQuestionCard: React.FC<MentorQuestionCardProps> = ({
  accessToken,
  stageId,
  isFinalQuestion = false,
  onStateChange,
  onSave,
  onSaveComplete,
  onContinue,
  onFinalComplete,
}) => {
  /* ───────── state / refs ───────── */
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [transcript, setTranscript] = useState('');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showFinalWait, setShowFinalWait] = useState(false); // NEW: show final question wait overlay
  
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
        const { response_text = '', audio_url = null } = data;
        
        savedRef.current = response_text;
        setTranscript(response_text);
        setAudioUrl(audio_url);
        
        // If we have an audio URL but no text, transcription may be in progress
        if (audio_url && !response_text) {
          setRecordingState('complete');
        }
      } catch (error) {
        console.error('Error loading response:', error);
      }
    })();
  }, [accessToken, stageId]);

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

  /* ───────── get signed upload URL ───────── */
  const getUploadUrl = useCallback(async (filename: string, contentType: string) => {
    console.log('[MentorQuestionCard] Requesting upload URL:', { filename, contentType });
    
    const response = await fetch(`/api/mentor-interview/${accessToken}/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename,
        content_type: contentType,
        // Use 'audio' as the base path for mentor interview recordings
        base_path: 'audio'
      }),
    });
    
    console.log('[MentorQuestionCard] Upload URL response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MentorQuestionCard] Upload URL request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to get upload URL: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[MentorQuestionCard] Upload URL response data:', data);
    
    // Return the full response for handling both S3 and server-side uploads
    if (data.use_server_upload) {
      return data; // Return full object for server-side upload
    } else {
      return data.upload_url; // Return URL string for S3 direct upload
    }
  }, [accessToken]);

  /* ───────── upload audio to S3 ───────── */
  const uploadAudioToS3 = useCallback(async (audioBlob: Blob) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `mentor-${stageId}-${timestamp}.webm`;
      const contentType = audioBlob.type || 'audio/webm';
      
      // Get upload URL/endpoint
      const uploadResponse = await getUploadUrl(filename, contentType);
      console.log('[MentorQuestionCard] Upload response:', uploadResponse);
      
      let uploadedUrl: string;
      
      if (typeof uploadResponse === 'string') {
        // S3 direct upload - uploadResponse is the presigned URL
        console.log('[MentorQuestionCard] Using S3 direct upload');
        const uploadResult = await fetch(uploadResponse, {
          method: 'PUT',
          body: audioBlob,
          headers: {
            'Content-Type': contentType,
          },
        });
        
        if (!uploadResult.ok) {
          throw new Error('Failed to upload audio to S3');
        }
        
        // Extract the permanent URL (remove query parameters)
        uploadedUrl = uploadResponse.split('?')[0];
      } else if (uploadResponse.use_server_upload) {
        // Server-side upload for non-S3 strategies
        console.log('[MentorQuestionCard] Using server-side upload');
        const formData = new FormData();
        formData.append('audio', audioBlob, filename);
        
        const uploadResult = await fetch(uploadResponse.upload_url, {
          method: uploadResponse.method || 'POST',
          body: formData,
        });
        
        if (!uploadResult.ok) {
          const errorText = await uploadResult.text();
          throw new Error(`Failed to upload audio to server: ${uploadResult.status} - ${errorText}`);
        }
        
        const result = await uploadResult.json();
        uploadedUrl = result.file_url;
      } else {
        throw new Error('Invalid upload response format');
      }
      
      console.log('[MentorQuestionCard] Upload successful:', uploadedUrl);
      return uploadedUrl;
      
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }, [stageId, getUploadUrl]);

  /* ───────── save audio URL and trigger background transcription ───────── */
  const saveAudioResponse = useCallback(async (audioUrl: string, durationMs: number) => {
    console.log('[MentorQuestionCard] Saving audio response:', { 
      audioUrl: audioUrl.substring(0, 50) + '...',
      durationMs,
      stageId,
      accessToken: accessToken?.substring(0, 10) + '...'
    });
    
    try {
      const response = await fetch(
        `/api/mentor-interview/${accessToken}/response/${stageId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio_url: audioUrl,
            duration_ms: durationMs,
            status: 'pending', // Marks for background transcription
          }),
        },
      );
      
      console.log('[MentorQuestionCard] Database save response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MentorQuestionCard] Database save failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to save audio response: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[MentorQuestionCard] Database save successful:', data);
      return data;
    } catch (error) {
      console.error('[MentorQuestionCard] Database save error:', error);
      throw error;
    }
  }, [accessToken, stageId]);

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
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
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
      setRecordingState('uploading');
      
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const durationMs = recordingDuration * 1000;
      
      console.log('[MentorQuestionCard] Starting recording save process:', {
        blobSize: audioBlob.size,
        durationMs,
        stageId
      });

      // Upload to S3
      console.log('[MentorQuestionCard] Attempting S3 upload...');
      const uploadedUrl = await uploadAudioToS3(audioBlob);
      console.log('[MentorQuestionCard] S3 upload successful:', uploadedUrl);
      
      // Save to database and trigger background transcription
      console.log('[MentorQuestionCard] Attempting database save...');
      await saveAudioResponse(uploadedUrl, durationMs);
      console.log('[MentorQuestionCard] Database save successful');
      
      setAudioUrl(uploadedUrl);
      setRecordingState('complete');
      
      // Clear chunks
      audioChunksRef.current = [];
      
    } catch (error) {
      const errorObj = error as Error;
      console.error('[MentorQuestionCard] Recording save failed:', {
        error: errorObj.message,
        stack: errorObj.stack,
        stageId,
        accessToken: accessToken?.substring(0, 10) + '...'
      });
      
      setRecordingState('idle');
      
      // Provide more specific error message
      let errorMessage = 'Failed to save recording. ';
      if (errorObj.message.includes('upload')) {
        errorMessage += 'Upload to storage failed. Please check your internet connection.';
      } else if (errorObj.message.includes('save') || errorObj.message.includes('response')) {
        errorMessage += 'Database save failed. Please try again.';
      } else {
        errorMessage += `Error: ${errorObj.message}`;
      }
      
      alert(errorMessage);
    }
  }, [recordingDuration, uploadAudioToS3, saveAudioResponse, stageId, accessToken]);

  /* ───────── continue to next question ───────── */
  const handleContinue = useCallback(() => {
    // For audio mode, ensure recording is stopped and uploaded
    if (mode === 'audio' && recordingState === 'complete' && audioUrl) {
      if (isFinalQuestion) {
        // For final question, show wait overlay
        setShowFinalWait(true);
      } else {
        // FUTURE TODO: Implement synchronous transcription flow
        // Instead of continuing immediately, we should:
        // 1. Call /api/mentor-interview/:access_token/transcribe/:stage_id
        // 2. Wait for transcription to complete (with loading state)
        // 3. Only then call onContinue() so next question has full context
        // 
        // Example implementation:
        // try {
        //   setTranscriptionState('transcribing');
        //   const response = await fetch(`/api/mentor-interview/${accessToken}/transcribe/${stageId}`, {
        //     method: 'POST'
        //   });
        //   const result = await response.json();
        //   if (result.success) {
        //     onContinue?.(); // Now next question will have full conversation context
        //   } else {
        //     // Handle transcription failure, maybe continue anyway with warning
        //     onContinue?.();
        //   }
        // } catch (error) {
        //   console.error('Transcription failed:', error);
        //   onContinue?.(); // Continue anyway if transcription fails
        // } finally {
        //   setTranscriptionState('idle');
        // }
        
        // For now, continue immediately (background transcription)
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
  }, [mode, recordingState, audioUrl, isFinalQuestion, onContinue, onFinalComplete, saveTranscript]);

  /* ───────── final question wait handlers ───────── */
  const handleFinalTranscriptionComplete = useCallback(() => {
    setShowFinalWait(false);
    onFinalComplete?.();
  }, [onFinalComplete]);

  const handleFinalTimeout = useCallback(() => {
    setShowFinalWait(false);
    onFinalComplete?.();
  }, [onFinalComplete]);

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
    const hasAudio = audioUrl !== null || recordingState === 'complete';
    
    onStateChange?.({ 
      paused: isPaused, 
      transcript, 
      hasAudio 
    });
  }, [mode, recordingState, transcript, audioUrl, onStateChange]);

  /* ───────── derived state ───────── */
  const wordCount = useMemo(() => {
    const words = transcript.trim();
    return words ? words.split(/\s+/).filter(Boolean).length : 0;
  }, [transcript]);

  const canContinue = useMemo(() => {
    if (mode === 'audio') {
      return recordingState === 'complete' && audioUrl !== null;
    } else {
      return transcript.trim().length > 0;
    }
  }, [mode, recordingState, audioUrl, transcript]);

  /* ───────── format duration ───────── */
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /* ───────── render recording controls ───────── */
  const renderRecordingControls = () => {
    if (recordingState === 'uploading') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B04A2F] mb-4"></div>
          <p className="text-sm text-gray-600">Uploading your recording...</p>
        </div>
      );
    }

    if (recordingState === 'complete' && audioUrl) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-2">Recording saved!</p>
          <p className="text-xs text-gray-500">Duration: {formatDuration(recordingDuration)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {isFinalQuestion 
              ? 'Transcription will be processed before review'
              : 'Transcription will be processed in the background'
            }
          </p>
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
          
          {recordingState === 'idle' && (
            <button 
              type="button" 
              className="text-sm underline text-gray-600 hover:text-gray-800" 
              onClick={switchToText}
            >
              Type instead
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
  return (
    <>
      <div className="w-full">
        {mode === 'audio' ? (
          <>
            {renderRecordingControls()}
            {canContinue && (
              <button
                type="button"
                onClick={handleContinue}
                className="w-full mt-4 px-4 py-2 bg-[#B04A2F] text-white rounded-md hover:bg-[#8a3a23] transition-colors"
              >
                {isFinalQuestion ? 'Review Your Answers' : 'Continue to Next Question'}
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
            <div className="flex justify-between items-center mt-2">
              <button 
                type="button" 
                className="text-sm underline text-gray-600 hover:text-gray-800" 
                onClick={switchToAudio}
              >
                Record instead
              </button>
              {canContinue && (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="px-4 py-2 bg-[#B04A2F] text-white rounded-md hover:bg-[#8a3a23] transition-colors"
                >
                  {isFinalQuestion ? 'Review Answers' : 'Continue'}
                </button>
              )}
            </div>
          </>
        )}
        
        <p className="mt-2 text-sm text-gray-500">{wordCount} words</p>
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