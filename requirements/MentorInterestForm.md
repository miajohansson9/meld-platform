# MELD Mentor Participation Form

## Overview
MELD is building an AI-powered mentorship platform to empower young professional women with authentic, lived experiences from accomplished mentors. This initial participation form is designed to collect interest and foundational data from mentors, enabling us to follow up with targeted questions aligned with MELD’s four signature pillars: **Starting Points to Success**, **Profile & Presentation**, **Financial Fluency**, and **The Future of Work**. Responses will be stored in a structured format to support future retrieval-augmented generation (RAG) for personalized mentorship insights.

This form is the first step in engaging mentors for MELD’s proprietary knowledge base. It captures interest, career details, and privacy preferences to ensure respectful and compliant data use. The form is built to be shareable and scalable, integrating with the existing Librachat (React/Node.js) platform for seamless data collection.

---

## Mentor Participation Form

### Instructions
Thank you for your interest in contributing to MELD’s mentorship platform. This form collects basic information about your career and preferences for participation. Your responses will help us tailor follow-up questions that align with your expertise and MELD’s mission. All fields are optional unless marked as required, and you can choose what information you’re comfortable sharing publicly.

Estimated completion time: **5 minutes**

---

### Form Fields

#### 1. Personal Information
- **First Name** *(Required)*  
  *Example: Sarah*  
  [Text Input]

- **Last Name**  
  *Example: Nguyen*  
  [Text Input]

- **Email Address** *(Required)*  
  *Example: sarah.nguyen@example.com*  
  [Text Input]

#### 2. Professional Background
- **Job Title** *(Required)*  
  *Example: Director*  
  [Text Input]

- **Company**  
  *Example: Meta*  
  [Text Input]

- **Industry** *(Required)*  
  *Example: Technology*  
  [Dropdown: Technology, Finance, Healthcare, Education, Non-Profit, Marketing, Other (with text input)]

- **Career Stage** *(Required)*  
  *Example: Mid-career (8 years)*  
  [Dropdown: Early-career (0-5 years), Mid-career (5-15 years), Senior-career (15+ years)]

#### 3. Mentorship Interests
- **Which MELD pillars are you most interested in contributing to?** *(Select all that apply)*  
  [Checkbox Options: Starting Points to Success, Profile & Presentation, Financial Fluency, The Future of Work]

- **What topics or experiences are you most excited to share?**  
  *Example: Navigating early leadership roles, negotiating salaries, or adapting to remote work*  
  [Textarea]

#### 4. Privacy Preferences
- **What information are you comfortable sharing publicly?** *(Select all that apply)*  
  [Checkbox Options: First Name, Job Title, Industry, Career Stage, None]  
  *Note: Last Name and Company will not be shared publicly unless explicitly authorized in follow-up.*

- **Do you consent to MELD storing your responses for future use in our mentorship platform?** *(Required)*  
  [Radio Buttons: Yes, No]

#### 5. Additional Comments
- **Anything else you’d like us to know?**  
  *Example: I’m particularly passionate about supporting first-generation professionals.*  
  [Textarea]

---

### Submission
- **Submit Button**: [Submit Form]  
  *On submission, display confirmation message: “Thank you for your interest in MELD! We’ll follow up with tailored questions based on your expertise.”*

---

## Technical Integration with Librachat
This form will be implemented as a new React component within the forked Librachat project. Below is the proposed structure:

- **Frontend (React)**:  
  - Create a `MentorParticipationForm` component using Tailwind CSS for styling.  
  - Use controlled inputs for form fields, with validation for required fields (e.g., First Name, Email, Job Title).  
  - Store form state using React’s `useState` hook.  
  - On submission, send a POST request to the backend API endpoint.

- **Backend (Node.js)**:  
  - Add a new `/api/mentor-participation` endpoint to handle form submissions.  
  - Store responses in a MongoDB collection (or existing database used by Librachat) with the following schema:  
    ```json
    {
      firstName: String,
      lastName: String,
      email: String,
      jobTitle: String,
      company: String,
      industry: String,
      careerStage: String,
      pillars: [String],
      topics: String,
      privacy: [String],
      consent: Boolean,
      comments: String,
      dateSubmitted: Date
    }
    ```
  - Return a success response to the frontend for confirmation.

- **Data Export**:  
  - Add an admin route to export form responses as a CSV file, compatible with Google Sheets, using a library like `json2csv`.  
  - Fields in CSV: `First Name`, `Last Name`, `Email`, `Job Title`, `Company`, `Industry`, `Career Stage`, `Pillars`, `Topics`, `Privacy`, `Consent`, `Comments`, `Date Submitted`.

---

## Privacy and Compliance
- All data will be stored securely in compliance with GDPR and CCPA.  
- Mentors’ privacy preferences will be strictly honored, with clear options to opt out of public sharing.  
- Consent for data storage is mandatory, and mentors can request data deletion via email.

---

## Next Steps
- **Form Deployment**: Integrate the form into Librachat and test on a local environment.  
- **Outreach**: Share the form link with MELD’s B2B2C targets (e.g., Aspen Institute, HBS Alumni Network).  
- **Follow-Up**: Based on responses, create pillar-specific question sets for mentors to answer in phase two.  
- **Data Pipeline**: Set up transcription and AI processing for Zoom call insights, syncing with form data for a unified knowledge base.

This form ensures MELD collects high-quality, structured data while respecting mentors’ time and privacy, laying the foundation for a robust RAG-powered mentorship engine.
