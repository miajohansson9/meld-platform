# Different Question Feature Specification

## Overview
Add a "Different Question" button to the MentorQuestionCard component that allows mentors to reject questions that don't fit their expertise and request a different question for the same stage.

## User Story
As a mentor, I want to be able to click a "Different Question" button before I start answering a question, so that I can get a more relevant question that better matches my expertise and experience.

## Current System Analysis

### Database Schema (Current)
- **MentorResponse Model**: Currently has unique constraint on `(mentor_interest, stage_id)` 
- **Status enum**: `['pending', 'transcribed', 'submitted']`
- **Unique Index**: `{ mentor_interest: 1, stage_id: 1 }` prevents multiple responses per stage

### API Endpoints (Current)
- `POST /api/mentor-interview/:access_token/response/:stage_id` - upserts response
- `GET /api/mentor-interview/:access_token/response/:stage_id` - gets response
- `POST /api/mentor-interview/:access_token/generate-question` - generates next question

### Frontend Components (Current)
- **MentorQuestionCard**: Handles audio/text input and response submission
- **MentorInterviewQuestion**: Manages the interview flow and question display
- **Question Generation**: Uses previous answers to generate contextual follow-ups

## Required Changes

### 1. Database Schema Updates

#### MentorResponse Model Changes
File: `api/models/MentorResponse.js`

**Changes Needed:**
1. Add `'rejected'` to status enum
2. Remove unique constraint on `(mentor_interest, stage_id)`
3. Add new unique constraint on `(mentor_interest, stage_id, status)` where status is NOT 'rejected'
4. Add `rejection_reason` field (optional)

**New Status Enum:**
```javascript
status: {
  type: String,
  enum: ['pending', 'transcribed', 'submitted', 'rejected'],
  default: 'pending',
}
```

**New Fields:**
```javascript
rejection_reason: {
  type: String,
  required: false,
}
```

**New Index Strategy:**
```javascript
// Remove old unique constraint
// mentorResponseSchema.index({ mentor_interest: 1, stage_id: 1 }, { unique: true });

// Add partial unique index - only one non-rejected response per stage
mentorResponseSchema.index(
  { mentor_interest: 1, stage_id: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { status: { $ne: 'rejected' } }
  }
);
```

### 2. API Endpoint Modifications

#### Update `upsertMentorResponse` Function
File: `api/server/controllers/MentorInterestController.js`

**Changes Needed:**
1. Modify logic to handle rejection status
2. When status is 'rejected', create new response instead of updating existing
3. Validate that only one non-rejected response exists per stage

**New Logic Flow:**
```javascript
// For rejection requests
if (status === 'rejected') {
  // Create new response with rejected status
  const rejectedResponse = await MentorResponse.create({
    mentor_interest: mentor_interest_id,
    stage_id: parseInt(stage_id),
    response_text: response_text || 'Question doesn\'t fit mentor expertise. Choose different question',
    status: 'rejected',
    rejection_reason: rejection_reason || 'Question mismatch',
    version: 1
  });
  
  return res.json(rejectedResponse);
}

// For regular responses, check if active response exists
const existingActive = await MentorResponse.findOne({
  mentor_interest: mentor_interest_id,
  stage_id: parseInt(stage_id),
  status: { $ne: 'rejected' }
});
```

#### Update `getMentorResponse` Function
File: `api/server/controllers/MentorInterestController.js`

**Changes Needed:**
1. Modify to return only non-rejected responses by default
2. Add query parameter to include rejected responses if needed

**New Logic:**
```javascript
const response = await MentorResponse.findOne({
  mentor_interest: mentor_interest_id,
  stage_id,
  status: { $ne: 'rejected' } // Exclude rejected by default
});
```

#### Update `generateNextQuestion` Function
File: `api/server/controllers/MentorInterestController.js`

**Changes Needed:**
1. When generating questions, exclude rejected responses from context
2. Consider rejection reasons when generating new questions

**Updated Query:**
```javascript
const previousResponses = await MentorResponse.find({
  mentor_interest: mentor_interest_id,
  stage_id: { $lte: previous_stage_id },
  status: { $ne: 'rejected' } // Exclude rejected responses
}).sort({ stage_id: 1 });
```

### 3. Frontend Component Updates

#### MentorQuestionCard Component
File: `client/src/components/MentorInterview/MentorQuestionCard.tsx`

**Changes Needed:**
1. Add "Different Question" button in initial state
2. Handle rejection submission
3. Trigger question regeneration after rejection

**New Props:**
```typescript
interface MentorQuestionCardProps {
  // ... existing props
  onQuestionRejected?: () => void; // Callback when question is rejected
}
```

**New State:**
```typescript
const [isRequestingDifferentQuestion, setIsRequestingDifferentQuestion] = useState(false);
```

**New Functions:**
```typescript
const handleRequestDifferentQuestion = useCallback(async () => {
  try {
    setIsRequestingDifferentQuestion(true);
    
    // Submit rejection
    await fetch(`/api/mentor-interview/${accessToken}/response/${stageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        response_text: 'Question doesn\'t fit mentor expertise. Choose different question',
        status: 'rejected',
        rejection_reason: 'Question mismatch'
      }),
    });
    
    // Trigger question regeneration
    onQuestionRejected?.();
    
  } catch (error) {
    console.error('Error requesting different question:', error);
  } finally {
    setIsRequestingDifferentQuestion(false);
  }
}, [accessToken, stageId, onQuestionRejected]);
```

**UI Changes:**
```typescript
// Add button before recording/text input (only when idle)
{mode === 'audio' && recordingState === 'idle' && !hasStartedRecording && !transcript.trim() && (
  <div className="mb-4 flex justify-center">
    <button
      type="button"
      onClick={handleRequestDifferentQuestion}
      disabled={isRequestingDifferentQuestion}
      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
    >
      {isRequestingDifferentQuestion ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Requesting different question...</span>
        </div>
      ) : (
        'Different Question'
      )}
    </button>
  </div>
)}
```

#### MentorInterviewQuestion Component
File: `client/src/components/MentorInterview/MentorInterviewQuestion.tsx`

**Changes Needed:**
1. Handle question rejection callback
2. Regenerate question when rejected
3. Update question display

**New State:**
```typescript
const [isRegeneratingQuestion, setIsRegeneratingQuestion] = useState(false);
```

**New Functions:**
```typescript
const handleQuestionRejected = useCallback(async () => {
  try {
    setIsRegeneratingQuestion(true);
    
    // Get previous answers (excluding rejected ones)
    const previousResponse = await fetch(`/api/mentor-interview/${access_token}/response/${currentStep - 1}`);
    const prevData = previousResponse.ok ? await previousResponse.json() : null;
    
    // Generate new question
    const response = await fetch(`/api/mentor-interview/${access_token}/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        previous_stage_id: currentStep - 1,
        answer_text: prevData?.response_text || '',
      }),
    });
    
    if (response.ok) {
      const newQuestionData = await response.json();
      setCurrentQuestion(newQuestionData.question);
      setPreamble(newQuestionData.preamble);
    }
    
  } catch (error) {
    console.error('Error regenerating question:', error);
  } finally {
    setIsRegeneratingQuestion(false);
  }
}, [access_token, currentStep]);
```

**Component Updates:**
```typescript
<MentorQuestionCard
  accessToken={access_token}
  stageId={currentStep}
  isFinalQuestion={isFinalQuestion}
  onStateChange={onInputStateChange}
  onSave={(saveFn) => {
    saveRef.current = saveFn;
  }}
  onSaveComplete={onSaveComplete}
  onContinue={handleContinueImmediate}
  onFinalComplete={handleFinalQuestionComplete}
  onQuestionRejected={handleQuestionRejected} // NEW
/>
```

### 4. Question Generation Logic Updates

#### Enhanced Question Generation
File: `api/server/controllers/MentorInterestController.js`

**Changes Needed:**
1. When generating questions for a stage that has rejections, consider rejection patterns
2. Add logic to avoid similar questions that were previously rejected
3. Enhanced AI prompt to account for rejected questions

**Updated AI Prompt Addition:**
```javascript
// Add to existing prompt
if (rejectedQuestions.length > 0) {
  payload.push({
    role: 'user',
    content: `REJECTED QUESTIONS: The mentor has rejected these questions for not fitting their expertise:
${rejectedQuestions.map(q => `- ${q.question}`).join('\n')}

Please generate a question that addresses a different aspect of their expertise and avoids similar themes.`
  });
}
```

### 5. Admin Interface Updates

#### Admin Responses View
File: `api/server/controllers/MentorInterestController.js`

**Changes Needed:**
1. Update `getAdminMentorResponses` to include rejected responses
2. Add filtering options for response status
3. Show rejection reasons in admin view

**Updated Query:**
```javascript
{
  $match: {
    $or: [
      { response_text: { $exists: true, $ne: '' } },
      { status: 'rejected' }
    ]
  }
}
```

### 6. Data Migration Requirements

#### Database Migration Script
Create: `migrations/add-rejected-status-to-mentor-responses.js`

**Migration Tasks:**
1. Add 'rejected' to status enum
2. Remove old unique index
3. Add new partial unique index
4. Add rejection_reason field

```javascript
// Migration pseudo-code
db.mentorresponses.updateMany(
  {},
  { $set: { rejection_reason: null } }
);

// Update indexes
db.mentorresponses.dropIndex({ mentor_interest: 1, stage_id: 1 });
db.mentorresponses.createIndex(
  { mentor_interest: 1, stage_id: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: { $ne: 'rejected' } }
  }
);
```

## Testing Requirements

### Unit Tests
1. **MentorResponse model**: Test new status enum and index constraints
2. **API endpoints**: Test rejection flow and question regeneration
3. **Frontend components**: Test button interactions and state management

### Integration Tests
1. **End-to-end rejection flow**: Submit rejection → Generate new question → Display new question
2. **Multiple rejections**: Ensure multiple rejections work per stage
3. **Constraint validation**: Ensure only one active response per stage

### Edge Cases
1. **Rapid clicking**: Prevent multiple rejection submissions
2. **Network failures**: Handle API errors gracefully
3. **Question generation failures**: Fallback to generic questions
4. **Database constraint violations**: Proper error handling

## Performance Considerations

### Database Queries
- Partial unique index may impact query performance
- Consider adding compound indexes for common queries
- Monitor rejection patterns for optimization

### Frontend Performance
- Debounce rapid button clicks
- Show loading states during question regeneration
- Cache question data where appropriate

## Security Considerations

### Data Validation
- Validate rejection reasons on backend
- Sanitize user inputs
- Rate limiting on question generation

### Access Control
- Ensure only authenticated mentors can reject questions
- Validate access tokens on all rejection endpoints

## Deployment Steps

1. **Database Migration**: Apply database schema changes
2. **Backend Deployment**: Deploy API changes
3. **Frontend Deployment**: Deploy UI changes
4. **Testing**: Verify all functionality works
5. **Monitoring**: Watch for errors and performance issues

## Success Metrics

### Functional Metrics
- Rejection rate per stage
- Time to generate new questions
- User satisfaction with replacement questions

### Technical Metrics
- API response times
- Database query performance
- Error rates

## Future Enhancements

### Potential Improvements
1. **Question categorization**: Tag questions by expertise area
2. **Smart question selection**: Use ML to match questions to mentor profiles
3. **Rejection analytics**: Track which questions get rejected most
4. **Question pool management**: Maintain pre-generated questions per expertise area

### Scalability Considerations
1. **Question generation caching**: Cache generated questions
2. **Rejection pattern analysis**: Use data to improve question generation
3. **Personalized question banks**: Build mentor-specific question pools

## Rollback Plan

### Immediate Rollback
1. Disable "Different Question" button via feature flag
2. Revert to previous question generation logic
3. Monitor for any database issues

### Full Rollback
1. Revert database schema changes
2. Redeploy previous API version
3. Redeploy previous frontend version
4. Verify system stability

---

## Files to Modify

### Backend Files
1. `api/models/MentorResponse.js` - Database schema changes
2. `api/server/controllers/MentorInterestController.js` - API logic updates
3. `api/validation/mentorInterest.js` - Add rejection validation (if needed)

### Frontend Files
1. `client/src/components/MentorInterview/MentorQuestionCard.tsx` - Add rejection button
2. `client/src/components/MentorInterview/MentorInterviewQuestion.tsx` - Handle rejection callbacks

### Migration Files
1. `migrations/add-rejected-status-to-mentor-responses.js` - Database migration

### Test Files
1. `tests/models/MentorResponse.test.js` - Model tests
2. `tests/controllers/MentorInterestController.test.js` - API tests  
3. `tests/components/MentorQuestionCard.test.js` - Component tests

---

This specification provides a comprehensive plan for implementing the "Different Question" feature while maintaining system integrity and user experience. 