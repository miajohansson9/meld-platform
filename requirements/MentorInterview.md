# MELD Mentor Sign-Up & AI Conversational Interview Feature

## Overview

MELD connects young professional women with authentic mentorship directly from executive women through an AI-powered conversational experience. This feature guides mentors seamlessly from sign-up to an AI-driven interview, capturing authentic advice and stories that enrich MELD’s curated knowledge base.

*Note:* The mentor sign-up form has already been implemented and saves submissions to the existing `mentorinterest` table. The creation of a user profile with a randomly generated password upon form submission has not yet been implemented and is detailed below.

---

## Feature Requirements

### Step 1: Mentor Profile Creation (to be implemented)

Currently, mentor submissions are saved to the existing `mentorinterest` table. Extend functionality to also:

* Automatically create a new user profile with:

  * `fullName`: Captured from the submitted form.
  * `password`: Secure, randomly generated string.
  * `type`: Set to `"mentor"`.
  * `mentorFormId`: Unique identifier linked to the mentor's submission.
  * `dateCreated`: Timestamp of profile creation.

After successful submission and profile creation, automatically redirect mentors to:

```
/c/new?mentorFormId={{mentorFormId}}
```

---

### Step 2: AI-Guided Conversational Interview

Upon reaching the `/c/new` page:

* Retrieve the `mentorFormId` from the URL query parameters.
* Fetch the mentor's profile information from the `mentorinterest` table using the `mentorFormId`.
* Dynamically inject this profile information into a predefined, thoughtfully crafted system prompt (fetched from the `prompts` collection by prompt ID).
* Use this prompt to set the context and guide the conversational AI interviewer.

#### System Prompt

* **Prompt Name:** `MentorInterviewPrompt`
* **Prompt ID:** `prompt_mentor_interview_001`

The system prompt should dynamically inject the profile information from the associated `mentorinterest` submission into the conversation for context:

```markdown
You are MELD’s AI interviewer—empathetic, insightful, and supportive. Your purpose is to help {{current_user}} comfortably share genuine stories and practical career advice, as if she's mentoring a younger woman face-to-face.

Mentor Profile Information:
- **Full Name:** {{fullName}}
- **Job Title:** {{jobTitle}}
- **Company:** {{company}}
- **Industry:** {{industry}}
- **Career Stage:** {{careerStage}}
- **Interest Pillars:** {{pillars}}

Begin the conversation warmly:

"Hi {{current_user}}, thank you for contributing your insights to MELD. We're here to empower young women through authentic, relatable experiences shared by accomplished leaders like you. Imagine we’re having an informal conversation over coffee—you can type or speak your responses freely. Don’t worry about sounding perfect; you’ll have the chance to review everything afterward."

Open the dialogue with MELD’s foundational question:

"At MELD, we always recognize that every woman—no matter her success—is working on something and through something. With that in mind, what are you currently working on, and what are you working through?"

Based on her response, select three meaningful follow-up questions from the existing `mentorquestions` table. After suggesting each question, confirm thoughtfully:

"Does this question feel relevant and comfortable for you to answer right now, or would you prefer another?"

Once three answers are recorded, summarize warmly:

"Thank you for sharing these insights. Here's what we've captured. Please feel free to edit as needed. When you’re ready, click 'Submit.'"

Upon submission, show genuine appreciation:

"Thank you so much, {{current_user}}. Your experiences are now part of MELD’s invaluable collection of authentic wisdom, directly benefiting the next generation of professional women."

Finally, encourage mentor-to-mentor outreach:

"If you know another woman whose wisdom could significantly impact young professionals, we invite you to share MELD with her using this personalized link. You might say something like:

> Hi [Friend’s Name],  
> I recently shared some experiences on MELD, a platform empowering young women with authentic, real-world mentorship. Your insights would be incredibly valuable here, and I immediately thought of you. If you’re interested, you can share your perspective through this link: [https://yourdomain.com/mentor-signup?from={{mentorFormId}}]. Your voice can genuinely make a difference."

Mentors joining through your link will be recognized as "Founding Contributors."
```

---

## Technical Specifications

### Database Schema Updates

**Users Collection (new functionality):**

```json
{
  "fullName": String,
  "password": String,
  "type": "mentor",
  "mentorFormId": String,
  "dateCreated": Date
}
```

**Prompts Collection (existing functionality):**

```json
{
  "id": "prompt_mentor_interview_001",
  "name": "MentorInterviewPrompt",
  "description": "Conversational AI prompt for mentor interviews",
  "command": "mentor-interview",
  "content": String (markdown prompt above)
}
```

**MentorAnswers Collection (to be implemented):**

```json
{
  "mentorFormId": String,
  "initialQuestionResponse": String,
  "questionsAndResponses": [
    {
      "questionId": String,
      "questionText": String,
      "mentorResponse": String
    }
  ],
  "dateSubmitted": Date
}
```

### Implementation Notes

* **Password Generation:** Securely generate random passwords using methods such as Node.js's `crypto.randomBytes`.
* **Prompt Loading:** Dynamically retrieve the `MentorInterviewPrompt` from the database using the specified prompt ID (`prompt_mentor_interview_001`).
* **Variable Injection:** Populate variables `{{current_user}}`, `{{fullName}}`, `{{jobTitle}}`, `{{company}}`, `{{industry}}`, `{{careerStage}}`, `{{pillars}}`, and `{{mentorFormId}}` from the mentor's form submission when loading the prompt.
* **Routing:** Use React Router for redirection to the conversational interface (`/c/new`).

---

## Privacy & Compliance

* Ensure clear communication of data storage practices and mentor privacy rights.
* Comply fully with GDPR, CCPA, and relevant privacy legislation.

---

## Next Steps & Testing

* [ ] Implement mentor user profile creation and automatic redirection.
* [ ] Create `MentorAnswers` collection.
* [ ] Integrate conversational AI flow on the `/c/new` page.
* [ ] Conduct testing with mentors to validate conversational experience and gather feedback.
* [ ] Track effectiveness and usage of mentor referral links.

---

This structured approach ensures mentors can comfortably and authentically contribute their valuable insights to MELD, enriching the mentorship platform with meaningful, real-world advice.
