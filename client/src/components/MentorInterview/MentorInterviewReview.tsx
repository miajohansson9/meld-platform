/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface MentorResponse {
  stage_id: number;
  question: string;
  preamble?: string;
  response_text: string;
  status: 'pending' | 'submitted';
}

interface CleanedAnswer {
  stage_id: number;
  cleaned: string;
}

const MentorInterviewReview: React.FC = () => {
  const navigate = useNavigate();
  const { access_token } = useParams();
  const [responses, setResponses] = useState<MentorResponse[]>([]);
  const [editedAnswers, setEditedAnswers] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningText, setIsCleaningText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<'fetching' | 'cleaning'>('fetching');
  const [progress, setProgress] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(1);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);

  // Load responses and clean them automatically
  useEffect(() => {
    const loadResponsesAndClean = async () => {
      if (!access_token) {
        console.error('No access_token found in params:', access_token);
        setError('Invalid mentor interview access token');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setLoadingStep('fetching');
        setProgress(20);

        console.log('Loading review for access token:', access_token);

        // 1. Fetch all responses first
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
        setProgress(40);

        // Check if answers have already been submitted
        const hasSubmittedAnswers = responsesData.some((r: MentorResponse) => r.status === 'submitted');

        if (hasSubmittedAnswers) {
          console.log('Answers already submitted, showing submitted state');
          // Skip AI cleaning and go straight to completion
          const submittedAnswers: { [key: number]: string } = {};
          responsesData.forEach((r: MentorResponse) => {
            if (r.response_text && r.response_text.trim()) {
              submittedAnswers[r.stage_id] = r.response_text;
            }
          });
          setEditedAnswers(submittedAnswers);
          setProgress(100);
          setIsLoading(false);
          setIsCleaningText(false);
          setIsAlreadySubmitted(true);
          return; // Exit early, don't do AI cleaning
        }

        // 2. Prepare answers for AI cleaning
        const answersForCleaning = responsesData
          .filter((r: MentorResponse) => r.response_text && r.response_text.trim())
          .map((r: MentorResponse) => ({
            stage_id: r.stage_id,
            text: r.response_text,
          }));

        console.log('Answers for cleaning:', answersForCleaning.length);

        if (answersForCleaning.length > 0) {
          setIsCleaningText(true);
          setLoadingStep('cleaning');
          setProgress(40);
          setTotalAnswers(answersForCleaning.length);

          try {
            console.log('Auto-cleaning answers with AI (bulk call with simulated progress)...');

            // Start the fake progress simulation
            let currentAnswerIndex = 1;
            const progressInterval = setInterval(() => {
              if (currentAnswerIndex < answersForCleaning.length) {
                currentAnswerIndex++;
                setCurrentAnswer(currentAnswerIndex);
                const progressIncrement = 60 / answersForCleaning.length;
                const newProgress = 40 + (currentAnswerIndex * progressIncrement);
                setProgress(Math.round(newProgress));
              }
            }, 3000); // Update every 3 seconds

            try {
              // Make the actual bulk API call
              const cleanRes = await fetch(`/api/mentor-interview/${access_token}/grammar-fix`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answers: answersForCleaning }), // Send all answers at once
              });

              // Clear the progress simulation
              clearInterval(progressInterval);

              console.log('Grammar fix API response status:', cleanRes.status);

              if (cleanRes.ok) {
                try {
                  const cleanData = await cleanRes.json();
                  console.log('Cleaned data received:', cleanData);

                  if (cleanData.items && Array.isArray(cleanData.items)) {
                    const cleanedAnswers = cleanData.items.reduce((acc: { [key: number]: string }, item: CleanedAnswer) => {
                      acc[item.stage_id] = item.cleaned;
                      return acc;
                    }, {});
                    setEditedAnswers(cleanedAnswers);
                    console.log('AI cleaning completed successfully');
                  } else {
                    console.warn('Unexpected cleaned data format:', cleanData);
                    // Fallback to original text
                    const fallbackEdited: { [key: number]: string } = {};
                    responsesData.forEach((r: MentorResponse) => {
                      if (r.response_text && r.response_text.trim()) {
                        fallbackEdited[r.stage_id] = r.response_text;
                      }
                    });
                    setEditedAnswers(fallbackEdited);
                    setError('AI cleaning returned unexpected format. Using original answers.');
                  }
                } catch (jsonError) {
                  console.error('Failed to parse AI cleaning response as JSON:', jsonError);

                  // Fallback to original text when JSON parsing fails
                  const fallbackEdited: { [key: number]: string } = {};
                  responsesData.forEach((r: MentorResponse) => {
                    if (r.response_text && r.response_text.trim()) {
                      fallbackEdited[r.stage_id] = r.response_text;
                    }
                  });
                  setEditedAnswers(fallbackEdited);
                  setError('AI text cleaning service failed. Using original answers.');
                }
              } else {
                console.log('Grammar fix failed, using original text');

                // Fallback to original text if cleaning fails
                const fallbackEdited: { [key: number]: string } = {};
                responsesData.forEach((r: MentorResponse) => {
                  if (r.response_text && r.response_text.trim()) {
                    fallbackEdited[r.stage_id] = r.response_text;
                  }
                });
                setEditedAnswers(fallbackEdited);
                setError('AI text cleaning failed. You can still review and edit your original answers.');
              }

              // Show completion regardless of success/failure
              setCurrentAnswer(answersForCleaning.length);
              setProgress(100);
              console.log('AI cleaning process completed');
            } catch (apiError) {
              // Clear the progress simulation in case of API error
              clearInterval(progressInterval);
              throw apiError; // Re-throw to be handled by outer catch
            }

          } catch (cleaningError) {
            console.error('AI cleaning failed completely:', cleaningError);

            // Final fallback - use original text when everything fails
            const fallbackEdited: { [key: number]: string } = {};
            responsesData.forEach((r: MentorResponse) => {
              if (r.response_text && r.response_text.trim()) {
                fallbackEdited[r.stage_id] = r.response_text;
              }
            });
            setEditedAnswers(fallbackEdited);
            setError('AI text cleaning unavailable. You can still review and edit your original answers.');

            // Still show completion
            setCurrentAnswer(answersForCleaning.length);
            setProgress(100);
          }
        } else {
          console.log('No answers to clean');
          setEditedAnswers({});
        }

      } catch (err) {
        console.error('Error loading responses:', err);
        setError(`Failed to load responses: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
        setIsCleaningText(false);
      }
    };

    loadResponsesAndClean();
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
    const steps = [
      { key: 'fetching', label: 'Retrieving your responses', icon: '📄' },
      { key: 'cleaning', label: 'Enhancing clarity and grammar', icon: '✨' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === loadingStep);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F4EB] p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img src="/assets/logo-b.svg" alt="MELD" className="h-8 w-auto" />
          </div>

          {/* Main loading card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="font-serif text-xl text-[#B04A2F] mb-2 flex items-center justify-center gap-2">
                Reviewing Your Responses
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#B04A2F]/20 border-t-[#B04A2F]"></div>
              </h2>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-600">
                  {loadingStep === 'cleaning' && totalAnswers > 0 && currentAnswer > 0
                    ? `Enhancing ${currentAnswer} of ${totalAnswers}...`
                    : 'Retrieving your responses...'
                  }
                </span>
                <span className="text-xs font-medium text-[#B04A2F]">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#B04A2F] to-[#D4712A] h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.key} className="flex items-center gap-4">
                    {/* Step Icon */}
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                      ${isCompleted ? 'bg-green-100 text-green-600' :
                        isActive ? 'bg-[#B04A2F]/10 text-[#B04A2F]' :
                          'bg-gray-100 text-gray-400'}
                    `}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : isActive ? (
                        <div className="animate-pulse text-lg">{step.icon}</div>
                      ) : (
                        <span className="text-lg opacity-50">{step.icon}</span>
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="flex-1">
                      <p className={`
                        font-medium transition-all duration-300
                        ${isCompleted ? 'text-green-600' :
                          isActive ? 'text-[#B04A2F]' :
                            'text-gray-400'}
                      `}>
                        {step.label}
                      </p>
                      {isActive && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-[#B04A2F] rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-[#B04A2F] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-[#B04A2F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {loadingStep === 'cleaning' && totalAnswers > 0 && currentAnswer > 0
                              ? `Enhancing ${currentAnswer} of ${totalAnswers}...`
                              : 'In progress...'
                            }
                          </span>
                        </div>
                      )}
                      {isCompleted && (
                        <p className="text-xs text-green-600 mt-1">✓ Completed</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Encouraging message */}
            <div className="mt-8 p-4 bg-[#B04A2F]/5 rounded-lg border border-[#B04A2F]/10">
              <p className="text-sm text-gray-700 text-center">
                <span className="font-medium">Almost there!</span> Your answers are being refined to reflect your best insights clearly and professionally.
              </p>
            </div>
          </div>

          {/* Estimated time */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              This typically takes 30-60 seconds
            </p>
          </div>
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

          {isCleaningText && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[#B04A2F]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#B04A2F]"></div>
              <span className="text-sm">AI is cleaning your text...</span>
            </div>
          )}
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

            {/* Original Answer (Collapsible) */}
            {response.response_text && (
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
                disabled={isCleaningText || isAlreadySubmitted}
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
              disabled={isSaving || !hasAnswersToSubmit || isCleaningText}
              className={`px-8 py-4 rounded-lg font-medium shadow-lg transition-all duration-200 ${isSaving || !hasAnswersToSubmit || isCleaningText
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