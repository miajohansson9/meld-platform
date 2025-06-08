/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface MentorResponse {
  stage_id: number;
  question: string;
  preamble?: string;
  response_text: string;
  audio_url?: string;
  status: 'pending' | 'submitted';
}



const MentorInterviewReview: React.FC = () => {
  const navigate = useNavigate();
  const { access_token } = useParams();
  const [responses, setResponses] = useState<MentorResponse[]>([]);
  const [editedAnswers, setEditedAnswers] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);

  // Load responses and clean them automatically
  useEffect(() => {
    const loadResponses = async () => {
      if (!access_token) {
        console.error('No access_token found in params:', access_token);
        setError('Invalid mentor interview access token');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('Loading review for access token:', access_token);

        // Fetch all responses
        const responsesRes = await fetch(`/api/mentor-interview/${access_token}/responses?all=true`);
        console.log('API Response status:', responsesRes.status);

        if (!responsesRes.ok) {
          const errorText = await responsesRes.text();
          console.error('API Error:', responsesRes.status, errorText);
          throw new Error(`Failed to fetch responses: ${responsesRes.status} - ${errorText}`);
        }

        const responsesData = await responsesRes.json();
        console.log('Received responses:', responsesData);
        setResponses(responsesData);

        // Check if answers have already been submitted
        const hasSubmittedAnswers = responsesData.some((r: MentorResponse) => r.status === 'submitted');

        if (hasSubmittedAnswers) {
          console.log('Answers already submitted, showing submitted state');
          setIsAlreadySubmitted(true);
        }

        // Use original response text directly (no AI cleaning)
        const originalAnswers: { [key: number]: string } = {};
        responsesData.forEach((r: MentorResponse) => {
          if (r.response_text && r.response_text.trim()) {
            originalAnswers[r.stage_id] = r.response_text;
          }
        });
        setEditedAnswers(originalAnswers);

      } catch (err) {
        console.error('Error loading responses:', err);
        setError(`Failed to load responses: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadResponses();
  }, [access_token, navigate]);

  const handleTextChange = (stageId: number, newText: string) => {
    setEditedAnswers(prev => ({
      ...prev,
      [stageId]: newText,
    }));
  };

  const handleSubmit = async () => {
    if (!access_token || isSaving) return;

    try {
      setIsSaving(true);
      setError(null);

      // Prepare final answers for submission
      const finalAnswers = Object.entries(editedAnswers).map(([stageId, text]) => ({
        stage_id: parseInt(stageId),
        text: text || '',
      }));

      const response = await fetch(`/api/mentor-interview/${access_token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      if (response.ok) {
        // Navigate to complete page on success
        navigate('/mentor-interview/complete');
      } else {
        const errorText = await response.text();
        console.error('Submit error:', response.status, errorText);
        throw new Error(`Failed to submit responses: ${response.status}`);
      }
    } catch (err) {
      console.error('Error submitting responses:', err);
      setError('Failed to submit responses. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const hasAnswersToSubmit = Object.values(editedAnswers).some(text => text && text.trim().length > 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F4EB] p-4">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <img src="/assets/logo-b.svg" alt="MELD" className="h-8 w-auto" />
          </div>
          <h2 className="font-serif text-xl text-[#B04A2F] mb-4 flex items-center justify-center gap-2">
            Loading Your Responses
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#B04A2F]/20 border-t-[#B04A2F]"></div>
          </h2>
        </div>
      </div>
    );
  }

  // Add error state rendering
  if (error && responses.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F4EB] p-4">
        <div className="text-center">
          <div className="mb-4 text-red-600 text-lg">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#B04A2F] text-white rounded hover:bg-[#8a3a23]"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F8F4EB] p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <div className="mb-4 flex justify-center">
            <img src="/assets/logo-b.svg" alt="MELD" className="h-8 w-auto" />
          </div>
          <h1 className="font-serif text-3xl text-[#B04A2F] mb-2">
            {isAlreadySubmitted ? 'Your Submitted Answers' : 'Review Your Answers'}
          </h1>
          <p className="text-gray-600 mb-4">
            {isAlreadySubmitted
              ? 'Thank you for submitting your interview responses. Your answers are now read-only.'
              : 'Review and edit your responses before submitting. Your answers have been automatically cleaned for clarity.'
            }
          </p>


          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {isAlreadySubmitted && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800 font-medium">Interview Submitted Successfully</p>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Your mentor interview responses have been submitted and are now read-only.
              </p>
            </div>
          )}
        </div>

        {/* Answer Cards */}
        {responses.map((response, index) => (
          <div key={response.stage_id} className="bg-white rounded-lg shadow-lg p-6">
            {/* Stage Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-block bg-[#B04A2F] text-white px-3 py-1 rounded-full text-sm font-medium">
                Answer {index + 1} of {responses.length}
              </span>
              <span className="text-sm text-gray-500">
                {editedAnswers[response.stage_id] && getWordCount(editedAnswers[response.stage_id])} words
              </span>
            </div>

            {/* Question */}
            <div className="mb-4">
              {response.preamble && (
                <div className="font-serif text-xl text-[#B04A2F] mb-2">
                  {response.preamble}
                </div>
              )}
              <div className="text-lg text-gray-800">
                {response.question}
              </div>
            </div>

            {/* Original Audio Recording (Collapsible) */}
            {response.audio_url && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2">
                  🎵 Play original audio recording
                </summary>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                  <audio 
                    controls 
                    className="w-full"
                    preload="metadata"
                  >
                    <source src={response.audio_url} type="audio/webm" />
                    <source src={response.audio_url} type="audio/wav" />
                    <source src={response.audio_url} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-xs text-gray-500 mt-2">
                    Original audio recording for this response
                  </p>
                </div>
              </details>
            )}

            {/* Fallback: Original Transcript (if no audio available) */}
            {!response.audio_url && response.response_text && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2">
                  📄 View original transcript
                </summary>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 border-l-4 border-gray-300">
                  {response.response_text}
                </div>
              </details>
            )}

            {/* Cleaned/Editable Answer */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isAlreadySubmitted
                  ? 'Submitted Response'
                  : `Your Response ${editedAnswers[response.stage_id] !== response.response_text ? '(AI-cleaned)' : '(Original)'}`
                }
              </label>
              <textarea
                value={editedAnswers[response.stage_id] || response.response_text || ''}
                onChange={(e) => handleTextChange(response.stage_id, e.target.value)}
                className={`w-full p-4 border rounded-lg resize-y focus:ring-2 focus:border-transparent ${isAlreadySubmitted
                  ? 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-[#B04A2F]'
                }`}
                rows={6}
                placeholder="Your response will appear here..."
                disabled={isAlreadySubmitted}
                readOnly={isAlreadySubmitted}
                style={{ minHeight: '150px' }}
              />
            </div>
          </div>
        ))}

        {/* Submit Button - Fixed Bottom Right */}
        {!isAlreadySubmitted && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={handleSubmit}
              disabled={isSaving || !hasAnswersToSubmit}
              className={`px-8 py-4 rounded-lg font-medium shadow-lg transition-all duration-200 ${isSaving || !hasAnswersToSubmit
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#B04A2F] text-white hover:bg-[#8a3a23] hover:shadow-xl transform hover:scale-105'
                }`}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                '✓ Submit Interview'
              )}
            </button>
          </div>
        )}

        {/* Bottom Spacing */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default MentorInterviewReview;