# MELD Mentor Interviewer UI

## Overview  
The Mentor Interviewer UI guides executive mentors through a series of pre-defined questions, captures their responses (audio or text), and hands off answers to our hidden AI engine for next-question selection. This spec covers **only the front-end user experience** within our LibreChat fork.

---

## Feature Requirements

### 1. Interview Entry & Scheduling  
- **Route:** `/mentor-interview/start`

### 2. Question Screen  
- **Route:** `/mentor-interview/question/:step`  
- **Layout:**  
  - Full-screen card (max-width 480px on desktop; edge-to-edge on mobile)  
  - Left-edge vertical progress indicator with one dot per question; highlight current dot.  
  - Top-left: MELD logo (clickable → home).  
- **Question Content:**  
  - Preamble in serif, italic heading.  
  - Prompt in bold within body text.  
- **Audio Recorder:**  
  - Centered circular record/stop button (≥64px target).  
  - States & captions:  
    - Idle: "Record your response"  
    - Recording: "Recording… Tap to stop"  
    - Processing: animated ellipsis "…"  

### 3. Alternative Input & Navigation  
- **"Type instead"** toggle below recorder swaps in a resizable textarea (min 3 rows).  
- **"Skip question →"** link advances to next question without capturing input.  
- **Keyboard Shortcuts:**  
  - `Space` to start/stop recording.  
  - `Enter` in textarea to submit.

### 4. Review Modal  
- Triggered immediately after a response (audio blob or text) is captured.  
- **Contents:**  
  - Audio player with playback controls OR editable text field.  
  - Buttons:  
    - **"Accept & Next"** → `/mentor-interview/question/:step+1`  
    - **"Re-record / Edit"** → return to step screen  

### 5. Completion Screen  
- **Route:** `/mentor-interview/complete`  
- **Contents:**  
  - Thank-you headline + summary ("Your insights will power MELD's knowledge base.")  
  - Primary CTA: **"Return to dashboard"**  
  - Secondary link: **"Invite another mentor"** (pre-populated referral share link)

---

## Technical Specifications

### Front-End Stack  
- **Framework:** React + TypeScript  
- **Styling:** Tailwind CSS (reuse MELD design tokens)  
- **Routing:** React Router v6  
- **State:** Context or Redux slice (`mentorInterview`)  

### Key Components  
| Component               | Responsibility                                    |
|-------------------------|---------------------------------------------------|
| `InterviewLayout`       | Global wrapper, renders header + progress bar     |
| `QuestionCard`          | Displays question text + subtext                 |
| `AudioRecorderButton`   | Handles Web Audio API recording states            |
| `TextResponseInput`     | Renders textarea, handles submit                  |
| `ReviewModal`           | Shows playback/editor + action buttons            |
| `CompletionScreen`      | Final thank-you and share CTA                     |

### Data Flow  
1. Fetch question list on mount via existing `/api/mentor/questions`.  
2. On record/text submit, store in local state and open `ReviewModal`.  
3. On accept, POST to `/api/mentor/answers` and increment `step`.  
4. On skip, increment `step` without POST.  
5. On final step accept, redirect to `/mentor-interview/complete`.

---

## Acceptance Criteria  
1. Mentor can proceed through all questions without page reload.  
2. Progress bar accurately reflects current step.  
3. Review modal appears after each response and honors re-record/edit flows.  
4. "Type instead" and "Skip" actions function correctly.  
5. Final completion screen displays correct CTAs.

---

## Privacy & Compliance  
- All recordings and transcripts stored securely via our existing encrypted API.  
- Disclose storage duration and usage in mentor privacy notice.  
- Ensure GDPR/CCPA compliance for audio data handling.  
