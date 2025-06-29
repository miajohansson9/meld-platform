# MELD Chat Interface Implementation Guide

> **Transform LibreChat into MELD: A Narrative-Focused AI Mentorship Platform**
>
> **Target:** High-potential women (20s-30s) seeking meaning-making guidance, not productivity tracking
> **Core Principle:** AI listens far more than it talks, creating space for story-telling and reflection

---

## 📋 TABLE OF CONTENTS

1. [**System Overview & Architecture**](#system-overview--architecture) - What we're building
2. [**Pre-Implementation Setup**](#pre-implementation-setup) - Environment, assets, database prep
3. [**Implementation Phases**](#implementation-phases) - Step-by-step build plan  
4. [**Core Components**](#core-components) - Data models, services, APIs
5. [**Frontend Implementation**](#frontend-implementation) - Journal-inspired UI components
6. [**Testing & Validation**](#testing--validation) - Comprehensive testing strategy
7. [**Deployment & Production**](#deployment--production) - Go-live procedures

---

## 📖 SYSTEM OVERVIEW & ARCHITECTURE

### Psychological Foundation
MELD is built on **Narrative Identity Theory** - helping users create coherent past→present→future stories that drive resilience and self-direction. Unlike productivity apps, MELD focuses on meaning-making through empathetic listening and reflection.

### Core Architecture Principles

1. **Daily Conversations** - Each day = one conversation with time-based sessions
2. **Time-Aware Intelligence** - Different prompts based on morning/afternoon/evening  
3. **Contextual Memory** - RAG-powered system with event tracking
4. **Nightly Processing** - All AI analysis during low-usage hours
5. **Human-Like Flow** - Natural mentor behavior patterns

### Unified Data Flow
```
User Opens App → Session Check → Time-Aware Prompt → Conversation → Nightly Processing → Tomorrow's Context
```

### 1. **Daily Conversation + Session Management** (Single System)
```javascript
// One conversation per day, multiple sessions within
// api/models/Conversation.js
{
  conversationId: String,
  user: String,
  date: Date, // YYYY-MM-DD
  title: String, // "January 15th, 2024"
  
  sessions: [{
    sessionId: String,
    startTime: Date,
    sessionType: String, // 'morning', 'afternoon', 'evening'
    promptType: String, // 'daily-planning', 'open-space', 'evening-reflection' 
    initialPrompt: String,
    followUpPrompt: String, // Only for morning sessions
    userEngaged: Boolean
  }],
  
  // AI Processing Results (from nightly job)
  dailySummary: String,
  extractedEvents: [String], // Event IDs
  identifiedThemes: [String],
  processingStatus: String
}
```

#### 2. **Unified Prompt Service** (Replaces Multiple Conversation Starter Systems)
```javascript
// api/services/UnifiedPromptService.js - Single service for all prompts
class UnifiedPromptService {
  
  async generatePrompt(userId, sessionType) {
    const context = await this.getContext(userId); // Gets goals, themes, events, recent activity
    
    switch (sessionType) {
      case 'morning':
        return {
          initial: `Good morning ${context.user.name}! What does your day look like today?`,
          followUp: await this.generateGoalEnergyPrompt(context) // AI-generated based on their goals + why
        };
        
      case 'afternoon':
        return { initial: "What's on your mind?" };
        
      case 'evening':
        // Check for event follow-ups FIRST
        const eventFollowUp = await this.checkEventFollowUps(userId);
        return eventFollowUp || { initial: "How did today go for you?" };
    }
  }
  
  async generateGoalEnergyPrompt(context) {
    // AI generates: "With what energy do you want to approach [goal] today? 
    // I remember how important [their why] is to your vision."
  }
}
```

#### 3. **Nightly Processing Job** (Single Job for Everything)
```javascript
// api/workers/nightlyProcessor.js - All AI processing happens here
schedule.scheduleJob('0 2 * * *', async () => {
  const yesterday = moment().subtract(1, 'day').toDate();
  const activeUsers = await getActiveUsers(yesterday);
  
  for (const userId of activeUsers) {
    const conversation = await getDailyConversation(userId, yesterday);
    
    // Process everything in sequence:
    await extractEventsFromMessages(conversation);      // Find "presentation Tuesday"
    await detectEventUpdates(conversation);            // Find "moved to Friday"  
    await generateDailySummary(conversation);          // Create memory
    await extractThemesAndInsights(conversation);      // Identify patterns
  }
});
```

### Frontend Flow (Simplified)

#### Single Session Check
```typescript
// client/src/hooks/useSessionCheck.ts 
const { sessionState } = useSessionCheck(conversationId);

// sessionState contains:
// - needsPrompt: boolean
// - promptData: { initial, followUp?, sessionType }
// - conversationId: string (today's conversation, auto-created)
```

#### Single Landing Component
```typescript
// client/src/components/Chat/Landing.tsx
if (sessionState.needsPrompt) {
  return (
    <div>
      <Prompt text={sessionState.promptData.initial} />
      {sessionState.promptData.followUp && (
        <FollowUpPrompt text={sessionState.promptData.followUp} />
      )}
    </div>
  );
}
return <ChatView />; // Continue conversation
```

### Minimal API Surface (3 Endpoints)

```javascript
// 1. Session check (handles everything)
POST /api/sessions/check { conversationId? }
→ Returns: { needsPrompt, promptData, conversationId }

// 2. Daily conversation (auto-created)
GET /api/conversations/daily/:date
POST /api/conversations/daily

// 3. Send message (existing, just add sessionId tracking)
POST /api/ask/openAI { text, conversationId, sessionId }
```

---

## 🛠 PRE-IMPLEMENTATION SETUP

### Environment Variables Required
```bash
# Add to .env file
MELD_PROCESSING_TIME=02:00          # Nightly processing time
MELD_SESSION_TIMEOUT_HOURS=8        # Session expiry
OPENAI_MEMORY_MODEL=gpt-4           # For context processing
MELD_COACH_MODE_DEFAULT=true        # Default coach mode state
OPENAI_API_KEY=sk-...               # OpenAI API key
MONGO_URI=mongodb://...             # MongoDB connection
```

### Asset Verification Checklist
```bash
# Verify MELD assets exist and are accessible
ls -la client/public/assets/logo-b.svg       # MELD logo
ls -la client/public/assets/fonts/TAN-*      # MELD fonts
grep -r "theme-maroon" client/tailwind.config.js  # Color palette

# Test asset loading
curl -I http://localhost:3090/assets/logo-b.svg  # Should return 200
curl -I http://localhost:3090/assets/fonts/TAN-ANGLETON.woff2  # Should return 200
```

### Database Migration Required
```javascript
// Create: api/migrations/001_add_meld_conversation_schema.js
const migration = async () => {
  await db.collection('conversations').updateMany(
    { sessions: { $exists: false } },
    { 
      $set: {
        sessions: [],
        date: new Date(), // Add daily conversation date
        dailySummary: '',
        extractedEvents: [],
        identifiedThemes: [],
        processingStatus: 'pending'
      }
    }
  );
};

// Run migration
node api/migrations/001_add_meld_conversation_schema.js

// Create performance indexes
mongosh $MONGO_URI --eval "
  db.conversations.createIndex({ user: 1, date: 1 });
  db.scheduledEvents.createIndex({ userId: 1, eventDate: 1 });
  db.conversations.createIndex({ 'sessions.sessionType': 1 });
"
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Visual Branding & Journal Aesthetics (Day 1-2)
**Goal:** Transform LibreChat UI into warm, journal-like experience

| Priority | File | Task |
|----------|------|------|
| 1 | `client/src/index.css` | Add MELD colors, journal CSS patterns |
| 2 | `client/src/components/Chat/Landing.tsx` | Create journal-style landing page |
| 3 | `client/src/components/Chat/Header/MeldHeader.tsx` | MELD-branded header |
| 4 | `client/src/components/Nav/Nav.tsx` | Update sidebar styling |

### Phase 2: Core Architecture (Day 3-4)  
**Goal:** Implement session management and daily conversations

| Priority | File | Task |
|----------|------|------|
| 5 | `api/models/Conversation.js` | Add session support and processing fields |
| 6 | `api/services/SessionManager.js` | Time-aware session logic |
| 7 | `api/services/UnifiedPromptService.js` | AI-powered prompt generation |
| 8 | `api/server/routes/sessions.js` | Session check API |

### Phase 3: Integration (Day 5)
**Goal:** Connect frontend to backend with full error handling

| Priority | File | Task |
|----------|------|------|
| 9 | `client/src/hooks/useSessionCheck.ts` | Frontend session hook |
| 10 | `api/server/routes/conversations.js` | Daily conversation API |
| 11 | `api/server/index.js` | Wire up all routes |

### Phase 4: Event System (Week 2)
**Goal:** Add intelligent event tracking and follow-ups

| Priority | File | Task |
|----------|------|------|
| 12 | `api/models/ScheduledEvent.js` | Event tracking schema |
| 13 | `api/workers/nightlyProcessor.js` | Batch AI processing |
| 14 | `api/services/EventDetectionService.js` | Extract events from messages |

---

## 🎨 JOURNAL-INSPIRED DESIGN SYSTEM

**Core Philosophy:** MELD should feel like a beautiful, personal journal rather than a tech product. The interface should be minimal, warm, and focused on content over chrome.

### Design Principles

#### Visual Language
- **Generous White Space** - Breathing room around all content
- **Content-First Layout** - Interface elements fade into background
- **Warm, Soft Colors** - No harsh contrasts or bright accents  
- **Serif Typography** - More personal and readable than sans-serif
- **Card-Based Entries** - Each conversation session feels like a journal page
- **Subtle Shadows** - Soft, paper-like depth without hard edges
- **Minimal Navigation** - Hide comment out or delete complexity, show only what's needed now

#### Critical CSS Patterns
```css
/* Paper-like conversation cards */
.conversation-card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  padding: 28px;
  margin-bottom: 20px;
  border: 1px solid rgba(175, 175, 175, 0.08);
}

/* Journal input styling */
.journal-input {
  border: none;
  background: transparent;
  font-family: 'TAN-ANGLETON', serif;
  font-size: 1.1rem;
  line-height: 1.7;
  color: #2F292B;
}

/* Minimal timestamp styling */
.entry-timestamp {
  font-size: 0.8rem;
  color: #999;
  font-weight: 400;
  margin-bottom: 16px;
  font-family: system-ui, sans-serif;
  letter-spacing: 0.5px;
}
```

### MELD Brand Assets (Available in Codebase)

#### Color Palette
```javascript
// tailwind.config.js - Complete MELD color system
theme: {
  extend: {
    colors: {
      'theme-maroon': '#692011',    // Deep burgundy
      'theme-rose': '#F2DBDB',      // Soft pink
      'theme-steel': '#3B3C50',     // Blue-gray
      'theme-charcoal': '#2F292B',  // Dark gray
      'theme-rust': '#BD3C28',      // Rust/terracotta (PRIMARY ACCENT)
      'theme-sage': '#CFCBA0',      // Sage green
      'theme-frost': '#DDECEA',     // Light mint
      'theme-cream': '#F8F4EB',     // Warm cream (PRIMARY BACKGROUND)
    }
  }
}
```

#### Typography System
```css
/* TAN-ANGLETON serif font family */
@font-face {
  font-family: 'TAN-ANGLETON';
  src: url('/assets/fonts/TAN-ANGLETON.woff2') format('woff2');
}

@font-face {
  font-family: 'TAN-ANGLETON-ITALIC';
  src: url('/assets/fonts/TAN-ANGLETON-ITALIC.woff2') format('woff2');
}

/* Utility classes */
.font-meld { font-family: 'TAN-ANGLETON', serif; font-size: 1.3rem; }
.font-meld-italic { font-family: 'TAN-ANGLETON-ITALIC', serif; font-size: 1.3rem; }
.font-meld-large { font-family: 'TAN-ANGLETON-ITALIC', serif; font-size: 2.5rem; }
```

#### Logo & Assets
- **Logo File:** `/public/assets/logo-b.svg`
- **Usage:** `<img src="/assets/logo-b.svg" alt="MELD" className="h-8 w-auto" />`

---

## 🔧 CORE COMPONENTS

### Data Models & Schemas

#### Enhanced Conversation Schema
```javascript
// api/models/Conversation.js - Extended for daily conversations + sessions
{
  // LibreChat base fields
  conversationId: String,
  user: String,
  title: String, // ie Saturday, June 28
  messages: [ObjectId],
  endpoint: String,
  model: String,
  createdAt: Date,
  updatedAt: Date,
  
  // MELD additions
  date: Date, // YYYY-MM-DD for daily conversations
  sessions: [{
    sessionId: String,
    startTime: Date,
    endTime: Date,
    sessionType: String, // 'morning', 'afternoon', 'evening'
    promptType: String, // 'daily-planning', 'open-space', 'evening-reflection'
    initialPrompt: String,
    followUpPrompt: String,
    userEngaged: Boolean,
    messageCount: Number
  }],
  
  // Memory & Context (populated by nightly processing)
  dailySummary: String,
  identifiedThemes: [String],
  extractedGoals: [String],
  emotionalTrend: String,
  
  // Processing flags
  processingStatus: String, // 'pending', 'processed', 'error'
  lastProcessedAt: Date
}
```

#### Scheduled Event Schema
```javascript
// api/models/ScheduledEvent.js - Event tracking with intelligent follow-ups
{
  userId: String,
  eventText: String, // "big presentation", "interview"
  eventType: String, // "presentation", "interview", "deadline"
  importance: Number, // 1-10 priority
  
  // Timing
  mentionedDate: Date,
  scheduledDate: Date,
  originalTimeText: String, // "Tuesday", "next week"
  
  // Context for intelligent follow-ups
  conversationId: String,
  messageId: String,
  contextBefore: String,
  contextAfter: String,
  emotionalTone: String,
  
  // Follow-up management
  status: String, // 'scheduled', 'ready-for-followup', 'completed', 'canceled'
  followUpDate: Date,
  followUpCompleted: Boolean,
  
  // Update tracking ("moved to Friday" scenarios)
  updates: [{
    updateDate: Date,
    updateType: String, // 'reschedule', 'cancel', 'add-details'
    changes: Object,
    confidence: Number
  }]
}
```

#### Enhanced Message Schema
```javascript
// Extend existing message schema with MELD fields
{
  // LibreChat base fields
  messageId: String,
  conversationId: String,
  user: String,
  text: String,
  sender: String,
  isCreatedByUser: Boolean,
  createdAt: Date,
  
  // MELD additions
  sessionId: String, // Links to conversation session
  sessionType: String, // 'morning', 'afternoon', 'evening'
  promptType: String, // 'daily-planning', 'open-space', 'evening-reflection'
  
  // AI Processing Results (added during nightly processing)
  extractedEvents: [String], // Event IDs found in this message
  identifiedThemes: [String],
  emotionalTone: String,
  keyInsights: [String],
  
  // Processing status
  aiProcessed: Boolean,
  processedAt: Date
}
```

### Service Architecture

#### Session Manager Service
**Purpose:** Handle all session detection, creation, and management logic

**Key Methods:**
- `handleSessionRequest(userId, conversationId)` - Main entry point
- `getSessionType(currentTime)` - Determine morning/afternoon/evening
- `findOrCreateDailyConversation(userId)` - Daily conversation management
- `checkSessionPromptNeeded(conversation, sessionType)` - Prompt logic
- `markSessionEngaged(sessionId)` - Track user engagement

#### Unified Prompt Service  
**Purpose:** Generate contextual prompts using AI and user memory

**Key Methods:**
- `generatePrompt(userId, sessionType)` - Main prompt generation
- `generateMorningPrompt(context)` - Daily planning + goal energy
- `generateEveningPrompt(context)` - Event follow-ups or reflection
- `generateGoalEnergyPrompt(context)` - AI-powered goal motivation
- `checkEventFollowUps(userId)` - Priority event follow-ups

#### Nightly Processor
**Purpose:** Batch AI processing for memory, events, and insights

**Key Methods:**
- `processUserDay(userId, date)` - Process all user activity
- `extractEventsFromMessages(conversation)` - Find time-bound events
- `detectEventUpdates(conversation)` - Handle event changes
- `generateDailySummary(conversation)` - Create memory summaries
- `extractThemesAndInsights(conversation)` - Identify narrative patterns

### API Architecture

#### Session Endpoints
```javascript
// POST /api/sessions/check - Main session logic
{
  conversationId?: string
} 
→ Returns: {
  needsPrompt: boolean,
  promptData?: { initial: string, followUp?: string },
  conversationId: string,
  sessionType: string
}

// POST /api/sessions/engage - Mark session as engaged  
{
  sessionId: string
}
→ Returns: { success: boolean }
```

#### Daily Conversation Endpoints
```javascript
// GET /api/conversations/daily/:date - Fetch daily conversation
→ Returns: Conversation object with sessions and messages

// POST /api/conversations/daily - Create daily conversation
{
  date: string, // YYYY-MM-DD
  title?: string
}
→ Returns: New conversation object
```

---

## 🎨 FRONTEND IMPLEMENTATION

### Component Architecture

#### Landing Page (Journal Style)
**File:** `client/src/components/Chat/Landing.tsx`
**Purpose:** Journal-inspired session prompt interface

**Key Features:**
- Time-aware greeting
- Paper-like prompt cards
- Minimal, warm styling
- Auto-redirect to conversation after response

#### Session Check Hook
**File:** `client/src/hooks/useSessionCheck.ts`
**Purpose:** Manage session state with error handling

**Key Features:**
- TypeScript with comprehensive error handling
- Loading states and error boundaries  
- Automatic conversation routing
- Session engagement tracking

#### Journal Chat Interface
**File:** `client/src/components/Chat/JournalChatView.tsx`
**Purpose:** Main conversation interface with journal aesthetics

**Key Features:**
- Message cards with paper-like styling
- Timestamp formatting
- Auto-resizing input with keyboard shortcuts
- Minimal, content-focused layout

#### MELD Header Component
**File:** `client/src/components/Chat/Header/MeldHeader.tsx`
**Purpose:** Branded header with coach mode toggle

**Key Features:**
- MELD logo and date display
- Coach mode toggle with rust accent
- Minimal, warm styling

---

## 🧪 TESTING & VALIDATION

### Unit Testing Strategy
- **Session Flow Testing** - Verify morning → afternoon → evening progression
- **Prompt Generation Testing** - Test AI prompt generation with context
- **Event Detection Testing** - Validate event extraction from user messages
- **Database Migration Testing** - Ensure schema changes work correctly

### Integration Testing Strategy  
- **End-to-End User Journey** - Complete session creation and engagement flow
- **API Error Handling** - Test all error scenarios with proper logging
- **Frontend State Management** - Verify session state transitions
- **Cross-Browser Compatibility** - Ensure journal styling works across browsers

### Performance Testing Strategy
- **Session Response Times** - Must complete < 500ms
- **Database Query Performance** - Monitor slow queries
- **Memory Usage Monitoring** - Track nightly processing efficiency
- **Asset Loading Performance** - Verify fonts and images load quickly

---

## 🚀 DEPLOYMENT & PRODUCTION

### Production Checklist
- Environment variables configured
- Database migrations applied
- Performance indexes created
- Assets verified and accessible
- Error logging configured
- Health check endpoints working

### Monitoring & Maintenance
- Daily health checks for API/DB/processing jobs
- Error log monitoring with alerts
- Session creation tracking
- Performance metrics collection
- Regular data backups

---

## 📝 DETAILED CODE IMPLEMENTATION

*The following sections contain copy-paste ready code with full imports, error handling, and TypeScript definitions.*

### Backend Implementation

#### Session Manager Service
```javascript
// File: api/services/SessionManager.js
  {/* MELD Logo */}
  <img 
    src="/assets/logo-b.svg" 
    alt="MELD" 
    className="h-12 w-auto mb-8"
  />
  
  {/* Time-aware greeting with MELD typography */}
  <h1 className="font-meld-large text-theme-charcoal mb-4">
    Good morning, {userName}!
  </h1>
  
  {/* Session prompt with MELD styling */}
  <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
    <p className="text-theme-charcoal mb-4">
      {sessionPrompt.initialPrompt}
    </p>
    
    {/* MELD-styled input */}
    <input 
      type="text"
      placeholder="Start anywhere..."
      className="w-full p-3 border border-gray-200 rounded-lg focus:border-theme-rust focus:outline-none"
    />
    
    {/* MELD accent button */}
    <button className="mt-3 w-full bg-theme-rust text-white py-3 rounded-lg hover:bg-opacity-90">
      Continue
    </button>
  </div>
</div>
```

#### 2. **Header Component** - `client/src/components/Chat/Header.tsx`

**Current State**: LibreChat header with generic styling
**MELD Requirements**:
```jsx
<header className="bg-theme-cream border-b border-gray-200 px-4 py-3">
  <div className="flex items-center justify-between">
    {/* MELD Logo */}
    <img 
      src="/assets/logo-b.svg" 
      alt="MELD" 
      className="h-8 w-auto"
    />
    
    {/* Date with MELD typography */}
    <div className="font-meld text-theme-charcoal">
      {moment().format('MMMM Do, YYYY')}
    </div>
    
    {/* Coach Mode Toggle - MELD rust accent */}
    <div className="flex items-center space-x-3">
      <span className="text-theme-charcoal">Coach Mode</span>
      <button 
        className={`w-12 h-6 rounded-full transition-colors ${
          coachMode ? 'bg-theme-rust' : 'bg-gray-300'
        }`}
        onClick={() => setCoachMode(!coachMode)}
      >
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
          coachMode ? 'translate-x-6' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  </div>
</header>
```

#### 3. **Sidebar Navigation** - `client/src/components/Nav/Nav.tsx`

**Current State**: LibreChat sidebar with generic icons
**MELD Requirements**:
```jsx
<nav className="bg-white border-r border-gray-200 w-64 h-full shadow-sm">
  {/* MELD Logo at top */}
  <div className="p-4 border-b border-gray-100">
    <img 
      src="/assets/logo-b.svg" 
      alt="MELD" 
      className="h-10 w-auto"
    />
  </div>
  
  {/* Navigation items with MELD styling */}
  <div className="p-4 space-y-2">
    <NavItem 
      icon="grid" 
      label="Today" 
      active={true}
      className="text-theme-rust bg-theme-rose"
    />
    <NavItem 
      icon="chat" 
      label="Archive" 
      className="text-theme-charcoal hover:bg-gray-50"
    />
    <NavItem 
      icon="book" 
      label="Story Archive" 
      className="text-theme-charcoal hover:bg-gray-50"
    />
    <NavItem 
      icon="settings" 
      label="Settings" 
      className="text-theme-charcoal hover:bg-gray-50"
    />
  </div>
</nav>
```

#### 4. **Chat Interface** - `client/src/components/Chat/ChatView.tsx`

**Current State**: Generic chat interface
**MELD Requirements**:
```jsx
<div className="flex h-screen bg-theme-cream">
  {/* Sidebar */}
  <MeldSidebar />
  
  {/* Main chat area */}
  <div className="flex-1 flex flex-col">
    <MeldHeader />
    
    {/* Messages area */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(message => (
        <MessageBubble 
          key={message.id}
          message={message}
          className={
            message.isUser 
              ? "bg-white text-theme-charcoal" 
              : "bg-theme-frost text-theme-charcoal"
          }
        />
      ))}
    </div>
    
    {/* Input area with MELD styling */}
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-center space-x-3">
        <input 
          type="text"
          placeholder="Start anywhere..."
          className="flex-1 p-3 border border-gray-200 rounded-lg focus:border-theme-rust focus:outline-none"
        />
        <button className="p-3 bg-theme-rust text-white rounded-lg hover:bg-opacity-90">
          <PlusIcon className="w-5 h-5" />
        </button>
        <button className="p-3 bg-theme-rust text-white rounded-lg hover:bg-opacity-90">
          <MicrophoneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</div>
```

#### 5. **Message Components** - `client/src/components/Chat/Messages/`

**MELD Message Styling**:
```jsx
// User messages
<div className="flex justify-end mb-4">
  <div className="bg-white rounded-lg p-4 max-w-md shadow-sm border border-gray-100">
    <p className="text-theme-charcoal">{message.text}</p>
    <span className="text-xs text-gray-500 mt-2">{formatTime(message.createdAt)}</span>
  </div>
</div>

// AI messages
<div className="flex justify-start mb-4">
  <div className="bg-theme-frost rounded-lg p-4 max-w-md">
    <p className="text-theme-charcoal">{message.text}</p>
    <span className="text-xs text-gray-500 mt-2">{formatTime(message.createdAt)}</span>
  </div>
</div>

// Special reflection messages
<div className="flex justify-center mb-4">
  <div className="bg-theme-rose rounded-lg p-4 max-w-lg border-l-4 border-theme-rust">
    <p className="font-meld-italic text-theme-charcoal">{reflectionText}</p>
  </div>
</div>
```

---

### Step-by-Step Implementation

#### **WEEK 1: MELD Branding & Core Foundation**

##### Day 1: Apply MELD Visual Branding

**File 1: Update Global Styles**
```javascript
// client/src/index.css - Add MELD theme variables
:root {
  --theme-cream: #F8F4EB;
  --theme-rust: #BD3C28;
  --theme-charcoal: #2F292B;
  --theme-rose: #F2DBDB;
  --theme-frost: #DDECEA;
  --theme-sage: #CFCBA0;
  --theme-steel: #3B3C50;
  --theme-maroon: #692011;
}

/* Override LibreChat default styles */
body {
  background-color: var(--theme-cream);
  color: var(--theme-charcoal);
}

/* MELD button styles */
.btn-meld-primary {
  background-color: var(--theme-rust);
  color: white;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  transition: all 0.2s;
}

.btn-meld-primary:hover {
  background-color: var(--theme-rust);
  opacity: 0.9;
}
```

**File 2: Update Landing Component**
```jsx
// client/src/components/Chat/Landing.tsx - Complete MELD transformation
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useSessionCheck } from '~/hooks/useSessionCheck';

const Landing = () => {
  const { user } = useAuthContext();
  const { sessionState, loading } = useSessionCheck();
  const [userInput, setUserInput] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-rust"></div>
      </div>
    );
  }

  if (!sessionState?.needsPrompt) {
    return <ChatView />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-theme-cream px-4">
      {/* MELD Logo */}
      <img 
        src="/assets/logo-b.svg" 
        alt="MELD" 
        className="h-12 w-auto mb-8"
      />
      
      {/* Time-aware greeting */}
      <h1 className="font-meld-large text-theme-charcoal mb-6 text-center">
        {sessionState.promptData.initial}
      </h1>
      
      {/* Main prompt interface */}
      <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Start anywhere..."
          className="w-full p-3 border border-gray-200 rounded-lg focus:border-theme-rust focus:outline-none resize-none h-32"
          rows={4}
        />
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <button className="p-2 text-theme-rust hover:bg-theme-rose rounded-lg">
              <PlusIcon className="w-5 h-5" />
            </button>
            <button className="p-2 text-theme-rust hover:bg-theme-rose rounded-lg">
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={() => handleSubmit(userInput)}
            disabled={!userInput.trim()}
            className="btn-meld-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
      
      {/* Follow-up prompt if it exists (morning sessions) */}
      {sessionState.promptData.followUpPrompt && (
        <div className="mt-6 bg-theme-frost rounded-lg p-4 max-w-md">
          <p className="font-meld-italic text-theme-charcoal text-center">
            {sessionState.promptData.followUpPrompt}
          </p>
        </div>
      )}
    </div>
  );
};

export default Landing;
```

**File 3: Create MELD Header Component**
```jsx
// client/src/components/Chat/Header/MeldHeader.tsx - New file
import React from 'react';
import moment from 'moment';

const MeldHeader = () => {
  const [coachMode, setCoachMode] = useState(true);
  
  return (
    <header className="bg-theme-cream border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* MELD Logo */}
        <div className="flex items-center space-x-4">
          <img 
            src="/assets/logo-b.svg" 
            alt="MELD" 
            className="h-8 w-auto"
          />
          <span className="font-meld text-theme-charcoal">
            {moment().format('MMMM Do, YYYY')}
          </span>
        </div>
        
        {/* Coach Mode Toggle */}
        <div className="flex items-center space-x-3">
          <span className="text-theme-charcoal font-medium">Coach Mode</span>
          <button 
            className={`relative w-12 h-6 rounded-full transition-colors ${
              coachMode ? 'bg-theme-rust' : 'bg-gray-300'
            }`}
            onClick={() => setCoachMode(!coachMode)}
          >
            <div className={`absolute w-5 h-5 bg-white rounded-full transition-transform top-0.5 ${
              coachMode ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MeldHeader;
```

##### Day 2: Implement Daily Conversation Schema

**File 4: Enhanced Conversation Model**
```javascript
// api/models/Conversation.js - Extend existing model
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: Date,
  sessionType: { 
    type: String, 
    enum: ['morning', 'afternoon', 'evening'],
    required: true 
  },
  promptType: { 
    type: String, 
    enum: ['daily-planning', 'open-space', 'evening-reflection'],
    required: true 
  },
  initialPrompt: String,
  followUpPrompt: String,
  userEngaged: { type: Boolean, default: false },
  messageCount: { type: Number, default: 0 }
});

// Extend existing conversation schema
const conversationSchema = new mongoose.Schema({
  // Existing LibreChat fields
  conversationId: { type: String, unique: true, required: true },
  user: { type: String, required: true },
  title: { type: String, default: 'New Chat' },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  endpoint: String,
  model: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // MELD additions
  date: { type: Date, index: true }, // Daily conversation date
  sessions: [sessionSchema],
  lastActiveSession: String,
  
  // AI Processing Results
  dailySummary: String,
  extractedEvents: [String],
  identifiedThemes: [String],
  extractedGoals: [String],
  emotionalTrend: String,
  processingStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'processed', 'error'],
    default: 'pending'
  },
  lastProcessedAt: Date
});

// Indexes for efficient queries
conversationSchema.index({ user: 1, date: 1 });
conversationSchema.index({ user: 1, processingStatus: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
```

**File 5: Session Management Service**
```javascript
// api/services/SessionManager.js - New file
const Conversation = require('../models/Conversation');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class SessionManager {
  
  /**
   * Main session check - handles all session logic
   */
  async handleSessionRequest(userId, conversationId = null) {
    const currentTime = new Date();
    const sessionType = this.getSessionType(currentTime);
    
    // Find or create today's conversation
    const conversation = await this.findOrCreateDailyConversation(userId, conversationId);
    
    // Check if session prompt is needed
    const sessionState = await this.checkSessionPromptNeeded(
      conversation, 
      sessionType, 
      currentTime
    );
    
    return {
      ...sessionState,
      conversationId: conversation.conversationId
    };
  }

  /**
   * Determine session type based on current time
   */
  getSessionType(currentTime = new Date()) {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Find today's conversation or create new one
   */
  async findOrCreateDailyConversation(userId, conversationId) {
    const today = moment().startOf('day');
    const todayEnd = moment().endOf('day');
    
    // If conversationId provided, check if it's today's conversation
    if (conversationId) {
      const existing = await Conversation.findOne({ 
        conversationId, 
        user: userId 
      });
      
      if (existing && moment(existing.date).isBetween(today, todayEnd, null, '[]')) {
        return existing;
      }
    }
    
    // Find existing conversation for today
    let conversation = await Conversation.findOne({
      user: userId,
      date: { $gte: today.toDate(), $lte: todayEnd.toDate() }
    });
    
    // Create new daily conversation if none exists
    if (!conversation) {
      conversation = await Conversation.create({
        conversationId: uuidv4(),
        user: userId,
        title: moment().format('MMMM Do, YYYY'),
        date: today.toDate(),
        endpoint: 'openAI', // Default endpoint
        model: 'gpt-4',
        sessions: [],
        processingStatus: 'pending'
      });
    }
    
    return conversation;
  }

  /**
   * Check if user needs a session prompt
   */
  async checkSessionPromptNeeded(conversation, sessionType, currentTime) {
    // Find active session for current time period
    const activeSession = conversation.sessions.find(session => 
      session.sessionType === sessionType && 
      moment(session.startTime).isSame(currentTime, 'day')
    );

    if (activeSession) {
      // Session exists - check if user has engaged
      if (!activeSession.userEngaged) {
        // Check if prompt should be regenerated (time shift)
        const shouldRegenerate = this.shouldRegeneratePrompt(activeSession, currentTime);
        
        return {
          needsPrompt: true,
          regeneratePrompt: shouldRegenerate,
          sessionId: activeSession.sessionId,
          sessionType: shouldRegenerate ? this.getSessionType(currentTime) : activeSession.sessionType
        };
      }
      
      // User has engaged - no prompt needed
      return { 
        needsPrompt: false, 
        sessionId: activeSession.sessionId 
      };
    }

    // No session for this time period - need new prompt
    return {
      needsPrompt: true,
      createNewSession: true,
      sessionType
    };
  }

  /**
   * Check if prompt should be regenerated due to time shift
   */
  shouldRegeneratePrompt(session, currentTime) {
    const timeSincePrompt = moment(currentTime).diff(moment(session.startTime), 'hours');
    const originalSessionType = session.sessionType;
    const currentSessionType = this.getSessionType(currentTime);
    
    // Time period changed - regenerate
    if (originalSessionType !== currentSessionType) {
      return true;
    }
    
    // Morning prompt given but it's been >4 hours - switch to open-ended
    if (originalSessionType === 'morning' && timeSincePrompt > 4) {
      return true;
    }
    
    return false;
  }

  /**
   * Create new session within conversation
   */
  async createSession(conversationId, sessionType, promptData) {
    const sessionId = uuidv4();
    const session = {
      sessionId,
      startTime: new Date(),
      sessionType,
      promptType: promptData.promptType,
      initialPrompt: promptData.initialPrompt,
      followUpPrompt: promptData.followUpPrompt || null,
      userEngaged: false,
      messageCount: 0
    };

    await Conversation.updateOne(
      { conversationId },
      { 
        $push: { sessions: session },
        $set: { lastActiveSession: sessionId }
      }
    );

    return session;
  }

  /**
   * Mark session as engaged when user responds
   */
  async markSessionEngaged(sessionId) {
    await Conversation.updateOne(
      { 'sessions.sessionId': sessionId },
      { 
        $set: { 
          'sessions.$.userEngaged': true,
          'sessions.$.endTime': new Date()
        }
      }
    );
  }
}

module.exports = SessionManager;
```

##### Day 3: Unified Prompt Service

**File 6: Unified Prompt Service**
```javascript
// api/services/UnifiedPromptService.js - New file
const OpenAI = require('openai');
const User = require('../models/User');
const ScheduledEvent = require('../models/ScheduledEvent');

class UnifiedPromptService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Generate appropriate prompt based on session type and context
   */
  async generatePrompt(userId, sessionType, context = {}) {
    const userContext = await this.getUserContext(userId);
    
    switch (sessionType) {
      case 'morning':
        return await this.generateMorningPrompt(userContext);
      case 'afternoon':
        return await this.generateAfternoonPrompt(userContext);
      case 'evening':
        return await this.generateEveningPrompt(userContext);
      default:
        return this.getDefaultPrompt();
    }
  }

  /**
   * Morning prompts: Planning + goal energy
   */
  async generateMorningPrompt(userContext) {
    const greeting = `Good morning ${userContext.user.firstName || userContext.user.name}! What does your day look like today?`;
    
    let followUpPrompt = null;
    
    // Generate AI follow-up if user has active goals
    if (userContext.activeGoals && userContext.activeGoals.length > 0) {
      followUpPrompt = await this.generateGoalEnergyPrompt(
        userContext.activeGoals[0], 
        userContext
      );
    }
    
    return {
      promptType: 'daily-planning',
      initialPrompt: greeting,
      followUpPrompt
    };
  }

  /**
   * Afternoon prompts: Open-ended if morning was missed
   */
  async generateAfternoonPrompt(userContext) {
    return {
      promptType: 'open-space',
      initialPrompt: "What's on your mind?"
    };
  }

  /**
   * Evening prompts: Event follow-ups or reflection
   */
  async generateEveningPrompt(userContext) {
    // Check for event follow-ups first (highest priority)
    const eventFollowUp = await this.checkEventFollowUps(userContext.user._id);
    
    if (eventFollowUp) {
      return {
        promptType: 'evening-reflection',
        initialPrompt: eventFollowUp.text,
        eventContext: eventFollowUp.eventId
      };
    }
    
    // General evening reflection  
    const reflectionPrompt = userContext.hadConversationToday 
      ? "How are you feeling about your day?"
      : "How did today go for you?";
    
    return {
      promptType: 'evening-reflection',
      initialPrompt: reflectionPrompt
    };
  }

  /**
   * Generate AI-powered goal energy prompt
   */
  async generateGoalEnergyPrompt(goal, userContext) {
    const systemPrompt = `You are MELD, an AI mentor. Generate a follow-up question about approaching a goal with the right energy.

CORE PRINCIPLE: Ask "what" → "how" → tie to their "why" (motivational)

USER'S GOAL: ${goal.text}
GOAL'S WHY: ${goal.motivationalWhy || 'Not specified'}
USER CONTEXT: ${userContext.recentThemes ? userContext.recentThemes.join(', ') : 'None'}

Generate a follow-up that:
1. References their specific goal
2. Asks about their approach/energy for today
3. Ties back to their deeper "why" for motivation

Examples:
- "With what energy do you want to approach your networking goal today? I remember how important building meaningful connections is to your vision of impactful work."
- "How do you want to show up for that creative project today? Your passion for authentic self-expression really came through when we talked about this."

Keep it personal, encouraging, and tied to their deeper motivations. Maximum 2 sentences.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 150
      });

      return completion.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
      console.error('Error generating goal energy prompt:', error);
      return null;
    }
  }

  /**
   * Check for scheduled events needing follow-up
   */
  async checkEventFollowUps(userId) {
    const readyEvents = await ScheduledEvent.find({
      userId,
      status: 'ready-for-followup',
      followUpDate: { $lte: new Date() }
    }).sort({ importance: -1, scheduledDate: 1 });

    if (readyEvents.length === 0) return null;

    const event = readyEvents[0];
    const followUpText = await this.generateEventFollowUp(event);
    
    return {
      text: followUpText,
      eventId: event._id
    };
  }

  /**
   * Generate natural event follow-up
   */
  async generateEventFollowUp(event) {
    const daysSince = Math.floor((new Date() - event.scheduledDate) / (1000 * 60 * 60 * 24));
    const timeReference = this.getTimeReference(event.scheduledDate, daysSince);
    
    const systemPrompt = `Generate a brief, caring follow-up question about a user's event.

Event: ${event.eventText}
When: ${timeReference}
Original context: "${event.contextBefore} ${event.eventText} ${event.contextAfter}"
User's emotional tone: ${event.emotionalTone}

Generate a warm, specific follow-up that shows you remembered. Keep it to 1 sentence.

Examples:
- "How did that big presentation go on Tuesday?"
- "How are you feeling after yesterday's interview?"
- "Did you meet that project deadline you were working toward?"`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 100
      });

      return completion.choices[0]?.message?.content?.trim();
    } catch (error) {
      console.error('Error generating event follow-up:', error);
      return `How did that ${event.eventText} go?`;
    }
  }

  /**
   * Get comprehensive user context
   */
  async getUserContext(userId) {
    return {
      user: await User.findById(userId),
      activeGoals: await this.getActiveGoals(userId),
      recentThemes: await this.getRecentThemes(userId),
      hadConversationToday: await this.checkTodaysActivity(userId),
      upcomingEvents: await this.getUpcomingEvents(userId)
    };
  }

  /**
   * Helper methods for context gathering
   */
  async getActiveGoals(userId) {
    // Implementation depends on goal storage system
    // For now, return empty array
    return [];
  }

  async getRecentThemes(userId) {
    // Implementation depends on theme extraction system
    return [];
  }

  async checkTodaysActivity(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const conversation = await require('../models/Conversation').findOne({
      user: userId,
      date: { $gte: today }
    });
    
    return conversation && conversation.messages.length > 0;
  }

  async getUpcomingEvents(userId) {
    return await ScheduledEvent.find({
      userId,
      status: 'scheduled',
      scheduledDate: { $gte: new Date() }
    }).sort({ scheduledDate: 1 });
  }

  getTimeReference(eventDate, daysSince) {
    if (daysSince === 0) return 'today';
    if (daysSince === 1) return 'yesterday';
    if (daysSince <= 7) return `${daysSince} days ago`;
    return new Date(eventDate).toLocaleDateString();
  }

  getDefaultPrompt() {
    return {
      promptType: 'open-space',
      initialPrompt: "What's on your mind today?"
    };
  }
}

module.exports = UnifiedPromptService;
```

##### Day 4-5: API Integration

**File 7: Session Check API Endpoint**
```javascript
// api/server/routes/sessions.js - New file
const express = require('express');
const SessionManager = require('../services/SessionManager');
const UnifiedPromptService = require('../services/UnifiedPromptService');
const requireJwtAuth = require('../middleware/requireJwtAuth');

const router = express.Router();

/**
 * Main session check endpoint - handles all session logic
 */
router.post('/check', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.body;
    
    const sessionManager = new SessionManager();
    const promptService = new UnifiedPromptService();
    
    // Get session state
    const sessionState = await sessionManager.handleSessionRequest(userId, conversationId);
    
    // Generate prompt if needed
    if (sessionState.needsPrompt) {
      const promptData = await promptService.generatePrompt(
        userId, 
        sessionState.sessionType,
        sessionState
      );
      
      // Create session if needed
      if (sessionState.createNewSession) {
        const session = await sessionManager.createSession(
          sessionState.conversationId,
          sessionState.sessionType,
          promptData
        );
        sessionState.sessionId = session.sessionId;
      }
      
      sessionState.promptData = promptData;
    }
    
    res.json(sessionState);
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Session check failed' });
  }
});

/**
 * Mark session as engaged when user responds
 */
router.post('/engage', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const sessionManager = new SessionManager();
    await sessionManager.markSessionEngaged(sessionId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Session engagement error:', error);
    res.status(500).json({ error: 'Failed to mark session as engaged' });
  }
});

module.exports = router;
```

**File 8: Daily Conversation API Endpoints**
```javascript
// api/server/routes/conversations.js - Add to existing file
const express = require('express');
const Conversation = require('../models/Conversation');
const moment = require('moment');
const requireJwtAuth = require('../middleware/requireJwtAuth');

const router = express.Router();

/**
 * Get daily conversation by date
 */
router.get('/daily/:date', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const date = moment(req.params.date, 'YYYY-MM-DD');
    
    if (!date.isValid()) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const conversation = await Conversation.findOne({
      user: userId,
      date: {
        $gte: date.startOf('day').toDate(),
        $lte: date.endOf('day').toDate()
      }
    }).populate('messages');

    if (!conversation) {
      return res.status(404).json({ message: 'No conversation found for this date' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching daily conversation:', error);
    res.status(500).json({ error: 'Failed to fetch daily conversation' });
  }
});

/**
 * Create daily conversation
 */
router.post('/daily', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, title } = req.body;
    const conversationDate = moment(date, 'YYYY-MM-DD');

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      user: userId,
      date: {
        $gte: conversationDate.startOf('day').toDate(),
        $lte: conversationDate.endOf('day').toDate()
      }
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // Create new daily conversation
    const newConversation = await Conversation.create({
      conversationId: require('uuid').v4(),
      user: userId,
      title: title || conversationDate.format('MMMM Do, YYYY'),
      date: conversationDate.toDate(),
      endpoint: req.body.endpoint || 'openAI',
      model: req.body.model || 'gpt-4',
      sessions: [],
      processingStatus: 'pending'
    });

    res.json(newConversation);
  } catch (error) {
    console.error('Error creating daily conversation:', error);
    res.status(500).json({ error: 'Failed to create daily conversation' });
  }
});

module.exports = router;
```

**File 9: Update Main App Router**
```javascript
// api/server/index.js - Add new routes
const express = require('express');
const sessionRoutes = require('./routes/sessions');
const conversationRoutes = require('./routes/conversations');

const app = express();

// ... existing middleware ...

// Add new MELD routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/conversations', conversationRoutes);

// ... existing routes ...
```

**File 10: Frontend Session Hook**
```typescript
// client/src/hooks/useSessionCheck.ts - New file
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SessionState {
  needsPrompt: boolean;
  sessionType: 'morning' | 'afternoon' | 'evening';
  sessionId?: string;
  conversationId: string;
  promptData?: {
    promptType: string;
    initialPrompt: string;
    followUpPrompt?: string;
  };
}

export const useSessionCheck = (conversationId?: string) => {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSession();
  }, [conversationId]);

  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sessions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      });

      if (!response.ok) {
        throw new Error('Session check failed');
      }

      const data = await response.json();
      setSessionState(data);

      // Redirect to today's conversation if needed
      if (data.conversationId && data.conversationId !== conversationId) {
        navigate(`/c/${data.conversationId}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const markSessionEngaged = async (sessionId: string) => {
    try {
      await fetch('/api/sessions/engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
    } catch (err) {
      console.error('Failed to mark session as engaged:', err);
    }
  };

  return {
    sessionState,
    loading,
    error,
    recheckSession: checkSession,
    markSessionEngaged
  };
};
```

This comprehensive implementation guide provides:

1. **Complete MELD Branding** - Colors, fonts, logos, component styling
2. **Step-by-step Implementation** - Specific files to create/modify
3. **Full Code Examples** - Copy-paste ready implementations
4. **Clear Architecture** - Unified approach without overlapping systems
5. **Developer Onboarding** - Everything a new developer needs to get started

The guide ensures any developer can follow the specifications exactly and transform LibreChat into the MELD mentorship platform with proper branding and functionality.

## Executive Summary

MELD transforms LibreChat into a narrative-focused mentorship platform using a **unified time-aware conversation system**. The architecture centers on **daily conversations with intelligent session management**, **contextual memory retrieval**, and **human-like follow-up timing**.

## Core Architecture Principles

1. **Daily Conversations**: Each day = one conversation with multiple time-based sessions
2. **Time-Aware Intelligence**: Different prompts and behaviors based on time of day
3. **Contextual Memory**: RAG-powered memory system with event tracking
4. **Nightly Processing**: All AI analysis happens during low-usage hours
5. **Human-Like Flow**: Mimics natural mentor behavior patterns

## Unified Data Models

### 1. Enhanced Conversation Schema
```javascript
// api/models/Conversation.js - Extended for MELD
{
  // LibreChat base fields
  conversationId: String,
  user: String,
  title: String,
  messages: [ObjectId],
  endpoint: String,
  model: String,
  createdAt: Date,
  updatedAt: Date,
  
  // MELD additions
  date: Date, // YYYY-MM-DD for daily conversations
  sessions: [{
    sessionId: String,
    startTime: Date,
    endTime: Date,
    sessionType: String, // 'morning', 'afternoon', 'evening'
    promptType: String, // 'daily-planning', 'open-space', 'evening-reflection'
    initialPrompt: String,
    followUpPrompt: String,
    userEngaged: Boolean,
    messageCount: Number
  }],
  
  // Memory & Context
  dailySummary: String,
  identifiedThemes: [String],
  extractedGoals: [String],
  emotionalTrend: String,
  
  // Processing flags
  processingStatus: String, // 'pending', 'processed', 'error'
  lastProcessedAt: Date
}
```

### 2. Unified Event Schema
```javascript
// api/models/ScheduledEvent.js - Single event system
{
  userId: String,
  eventText: String, // "big presentation", "interview"
  eventType: String, // "presentation", "interview", "deadline"
  importance: Number, // 1-10
  
  // Timing
  mentionedDate: Date,
  scheduledDate: Date,
  originalTimeText: String, // "Tuesday", "next week"
  
  // Context & Memory
  conversationId: String,
  messageId: String,
  contextBefore: String,
  contextAfter: String,
  emotionalTone: String,
  
  // Follow-up Management
  status: String, // 'scheduled', 'ready-for-followup', 'completed', 'canceled'
  followUpDate: Date,
  followUpGenerated: Boolean,
  
  // Update tracking
  updates: [{
    updateDate: Date,
    updateType: String, // 'reschedule', 'cancel', 'add-details'
    changes: Object,
    confidence: Number
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Enhanced Message Schema
```javascript
// Extend existing message schema
{
  // LibreChat base fields
  messageId: String,
  conversationId: String,
  user: String,
  text: String,
  sender: String,
  isCreatedByUser: Boolean,
  createdAt: Date,
  
  // MELD additions
  sessionId: String, // Links to conversation session
  sessionType: String, // 'morning', 'afternoon', 'evening'
  promptType: String, // 'daily-planning', 'open-space', 'evening-reflection'
  
  // AI Processing Results (added during nightly processing)
  extractedEvents: [String], // Event IDs found in this message
  identifiedThemes: [String],
  emotionalTone: String,
  keyInsights: [String],
  
  // Processing status
  aiProcessed: Boolean,
  processedAt: Date
}
```

## Unified Intelligent Prompt System

### Single Prompt Generation Service
```javascript
// api/services/IntelligentPromptService.js - Unified system
class IntelligentPromptService {
  
  /**
   * Generate appropriate prompt based on time, context, and user state
   * This replaces multiple overlapping conversation starter systems
   */
  async generateSessionPrompt(userId, sessionType, conversationId) {
    const context = await this.getUnifiedContext(userId);
    
    switch (sessionType) {
      case 'morning':
        return await this.generateMorningPrompt(userId, context);
      case 'afternoon':
        return await this.generateAfternoonPrompt(userId, context);
      case 'evening':
        return await this.generateEveningPrompt(userId, context);
    }
  }

  /**
   * Morning: Daily planning with goal energy
   */
  async generateMorningPrompt(userId, context) {
    const greeting = `Good morning ${context.user.name}! What does your day look like today?`;
    
    // Generate AI follow-up if user has active goals
    const followUp = context.activeGoals.length > 0 
      ? await this.generateGoalEnergyPrompt(context.activeGoals[0], context)
      : null;
    
    return {
      initialPrompt: greeting,
      followUpPrompt: followUp,
      promptType: 'daily-planning'
    };
  }

  /**
   * Evening: Event follow-ups or reflection
   */
  async generateEveningPrompt(userId, context) {
    // Check for event follow-ups first (highest priority)
    const eventFollowUp = await this.checkEventFollowUps(userId);
    if (eventFollowUp) {
      return {
        initialPrompt: eventFollowUp.text,
        promptType: 'evening-reflection',
        eventContext: eventFollowUp.eventId
      };
    }
    
    // General reflection
    return {
      initialPrompt: context.hadConversationToday 
        ? "How are you feeling about your day?"
        : "How did today go for you?",
      promptType: 'evening-reflection'
    };
  }

  /**
   * Unified context retrieval - replaces multiple overlapping services
   */
  async getUnifiedContext(userId) {
    return {
      user: await this.getUserProfile(userId),
      activeGoals: await this.getActiveGoals(userId),
      recentThemes: await this.getRecentThemes(userId),
      emotionalTrend: await this.getEmotionalTrend(userId),
      hadConversationToday: await this.checkTodaysActivity(userId),
      upcomingEvents: await this.getUpcomingEvents(userId)
    };
  }

  /**
   * Generate AI-powered goal energy prompt
   */
  async generateGoalEnergyPrompt(goal, context) {
    const systemPrompt = `Generate a follow-up about approaching a goal with the right energy.

USER'S GOAL: ${goal.text}
GOAL'S WHY: ${goal.motivationalWhy}
RECENT THEMES: ${context.recentThemes.join(', ')}

Create a personal, encouraging follow-up that:
1. References their specific goal
2. Asks about their approach/energy for today  
3. Ties back to their deeper motivations

Keep it brief, warm, and motivational.`;

    return await this.callOpenAI(systemPrompt);
  }

  /**
   * Check for events needing follow-up
   */
  async checkEventFollowUps(userId) {
    const readyEvents = await ScheduledEvent.find({
      userId,
      status: 'ready-for-followup',
      followUpDate: { $lte: new Date() }
    }).sort({ importance: -1 });

    if (readyEvents.length === 0) return null;

    const event = readyEvents[0];
    const followUpText = await this.generateEventFollowUp(event);
    
    return {
      text: followUpText,
      eventId: event._id
    };
  }
}
```

## Unified Session Management

### Single Session Detection Service
```javascript
// api/services/SessionManager.js - Unified session handling
class SessionManager {
  
  /**
   * Main session logic - handles all session detection and creation
   */
  async handleSessionRequest(userId, conversationId) {
    const currentTime = new Date();
    const sessionType = this.getSessionType(currentTime);
    
    // Find or create today's conversation
    const conversation = await this.findOrCreateDailyConversation(userId, conversationId);
    
    // Check if session prompt is needed
    const sessionCheck = await this.checkSessionPromptNeeded(conversation, sessionType, currentTime);
    
    if (sessionCheck.needsPrompt) {
      // Generate prompt using unified system
      const promptData = await this.promptService.generateSessionPrompt(
        userId, 
        sessionType, 
        conversation.conversationId
      );
      
      // Create session record
      const session = await this.createSession(conversation.conversationId, sessionType, promptData);
      
      return {
        needsPrompt: true,
        sessionId: session.sessionId,
        promptData,
        sessionType
      };
    }
    
    return { needsPrompt: false };
  }

  /**
   * Determine session type based on time
   */
  getSessionType(currentTime = new Date()) {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Find today's conversation or create if needed
   */
  async findOrCreateDailyConversation(userId, conversationId) {
    const today = moment().format('YYYY-MM-DD');
    
    // If conversationId provided, check if it's today's
    if (conversationId) {
      const conversation = await Conversation.findOne({ conversationId, user: userId });
      if (conversation && moment(conversation.date).format('YYYY-MM-DD') === today) {
        return conversation;
      }
    }
    
    // Find or create today's conversation
    let conversation = await Conversation.findOne({
      user: userId,
      date: {
        $gte: moment().startOf('day').toDate(),
        $lte: moment().endOf('day').toDate()
      }
    });
    
    if (!conversation) {
      conversation = await this.createDailyConversation(userId, today);
    }
    
    return conversation;
  }
}
```

## Unified Nightly Processing

### Single Processing Job
```javascript
// api/workers/unifiedNightlyProcessor.js - All processing in one place
class UnifiedNightlyProcessor {
  
  /**
   * Main nightly job - processes everything for all users
   */
  async runNightlyProcessing() {
    const yesterday = moment().subtract(1, 'day').toDate();
    const activeUsers = await this.getActiveUsers(yesterday);
    
    for (const userId of activeUsers) {
      await this.processUserDay(userId, yesterday);
    }
  }

  /**
   * Process everything for one user's day
   */
  async processUserDay(userId, date) {
    const conversation = await this.getDailyConversation(userId, date);
    if (!conversation) return;
    
    // 1. Extract events from all messages
    await this.extractEventsFromMessages(conversation);
    
    // 2. Detect event updates
    await this.detectEventUpdates(conversation);
    
    // 3. Generate daily summary
    await this.generateDailySummary(conversation);
    
    // 4. Extract themes and insights
    await this.extractThemesAndInsights(conversation);
    
    // 5. Update user's goals based on conversation
    await this.updateUserGoals(userId, conversation);
    
    // Mark as processed
    await Conversation.updateOne(
      { _id: conversation._id },
      { 
        processingStatus: 'processed',
        lastProcessedAt: new Date()
      }
    );
  }

  /**
   * Extract events from all user messages in conversation
   */
  async extractEventsFromMessages(conversation) {
    const userMessages = conversation.messages.filter(m => m.isCreatedByUser);
    
    for (const message of userMessages) {
      const events = await this.eventDetectionService.extractEvents(
        message.text,
        conversation.user,
        conversation.conversationId,
        message.messageId
      );
      
      // Store extracted event IDs in message
      await Message.updateOne(
        { _id: message._id },
        { extractedEvents: events.map(e => e._id) }
      );
    }
  }

  /**
   * Detect updates to existing events
   */
  async detectEventUpdates(conversation) {
    const userMessages = conversation.messages.filter(m => m.isCreatedByUser);
    
    for (const message of userMessages) {
      await this.eventUpdateService.detectAndProcessUpdates(
        message.text,
        conversation.user,
        conversation.conversationId,
        message.messageId
      );
    }
  }
}

// Schedule unified job
schedule.scheduleJob('0 2 * * *', async () => {
  const processor = new UnifiedNightlyProcessor();
  await processor.runNightlyProcessing();
});
```

## Frontend Integration

### Unified Chat Interface
```typescript
// client/src/components/Chat/UnifiedChatInterface.tsx
const UnifiedChatInterface: React.FC = () => {
  const { conversationId } = useParams();
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSessionState();
  }, []);

  const checkSessionState = async () => {
    try {
      // Single API call handles all session logic
      const response = await fetch('/api/sessions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      });
      
      const data = await response.json();
      setSessionState(data);
      setLoading(false);
      
      // Update URL if needed (e.g., redirect to today's conversation)
      if (data.redirectTo) {
        navigate(data.redirectTo, { replace: true });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Show session prompt if needed
  if (sessionState?.needsPrompt) {
    return (
      <SessionPromptInterface 
        sessionState={sessionState}
        onResponse={handleSessionResponse}
      />
    );
  }

  // Continue existing conversation
  return <ChatView conversationId={sessionState.conversationId} />;
};
```

### Single API Endpoint
```javascript
// api/server/routes/sessions.js - Unified session endpoint
router.post('/check', async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.body;
    
    // Single service handles all session logic
    const sessionManager = new SessionManager();
    const result = await sessionManager.handleSessionRequest(userId, conversationId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Session check failed' });
  }
});
```

## Implementation Phases

### Phase 1: Core Foundation (Week 1-2)
1. **Unified Data Models** - Implement consolidated schemas
2. **Session Manager** - Single service for all session logic
3. **Basic Prompt System** - Morning/afternoon/evening prompts
4. **Daily Conversation Routing** - Auto-redirect to today's conversation

### Phase 2: Intelligence Layer (Week 3-4)
1. **Unified Prompt Service** - AI-powered contextual prompts
2. **Event Detection** - Extract events from messages
3. **Nightly Processing** - Batch processing for all AI analysis
4. **Memory System** - Context retrieval for prompts

### Phase 3: Advanced Features (Week 5-6)
1. **Event Follow-ups** - Intelligent event tracking and follow-ups
2. **Goal Integration** - Morning goal energy prompts
3. **Theme Extraction** - Identify narrative patterns
4. **Story Archive** - Organized conversation history

## Benefits of Unified Architecture

1. **Simplified Development** - Single code path for each feature
2. **Consistent Behavior** - No conflicting systems
3. **Easy Maintenance** - Clear separation of concerns
4. **Performance Optimized** - Efficient processing with minimal overhead
5. **Scalable Design** - Clean architecture supports growth
6. **User Experience** - Seamless, coherent interaction flow

This unified approach delivers all the sophisticated MELD functionality while maintaining architectural clarity and development efficiency.

---

## 🔧 DETAILED SETUP & IMPLEMENTATION GUIDE

### Pre-Implementation Checklist

#### 1. **Verify MELD Assets Availability**
```bash
# Check if MELD assets exist in codebase
ls -la client/public/assets/logo-b.svg       # MELD logo
ls -la client/public/assets/fonts/TAN-*      # MELD fonts
grep -r "theme-maroon" client/tailwind.config.js  # Color palette

# If assets missing, download from:
# Logo: [Add actual source URL]
# Fonts: [Add actual source URL]
```

#### 2. **Database Schema Migrations**
```javascript
// Create migration file: api/migrations/001_add_meld_conversation_schema.js
const mongoose = require('mongoose');

const migration = async () => {
  const db = mongoose.connection.db;
  
  // Add sessions array to existing Conversations
  await db.collection('conversations').updateMany(
    { sessions: { $exists: false } },
    { 
      $set: {
        sessions: [],
        dailySummary: '',
        extractedEvents: [],
        identifiedThemes: [],
        processingStatus: 'pending'
      }
    }
  );
  
  console.log('✅ Conversation schema updated for MELD');
};

// Run migration
node api/migrations/001_add_meld_conversation_schema.js
```

#### 3. **Environment Variables Setup**
```bash
# Add to .env file
MELD_PROCESSING_TIME=02:00          # Nightly processing time
MELD_SESSION_TIMEOUT_HOURS=8        # Session expiry
OPENAI_MEMORY_MODEL=gpt-4           # For context processing
MELD_COACH_MODE_DEFAULT=true        # Default coach mode state
```

### Complete Code Implementation with Imports

#### 1. **Session Manager Service**
```javascript
// File: api/services/SessionManager.js
const moment = require('moment');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const UnifiedPromptService = require('./UnifiedPromptService');
const logger = require('../config/winston');

class SessionManager {
  constructor() {
    this.promptService = new UnifiedPromptService();
  }

  /**
   * Main entry point - handles all session logic
   */
  async handleSessionRequest(userId, requestedConversationId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const today = moment().format('YYYY-MM-DD');
      const currentTime = moment();
      
      // Get or create today's conversation
      let conversation = await this.getTodaysConversation(userId, today);
      if (!conversation) {
        conversation = await this.createDailyConversation(userId, today);
      }

      // Check if user requested specific conversation (archive browsing)
      if (requestedConversationId && requestedConversationId !== conversation.conversationId) {
        const archivedConv = await Conversation.findOne({ 
          conversationId: requestedConversationId,
          user: userId 
        });
        
        if (archivedConv) {
          return {
            needsPrompt: false,
            conversationId: requestedConversationId,
            sessionType: 'archive'
          };
        }
      }

      // Determine session type and check if prompt needed
      const sessionType = this.determineSessionType(currentTime);
      const needsPrompt = await this.checkIfPromptNeeded(conversation, sessionType);

      if (needsPrompt) {
        const promptData = await this.promptService.generatePrompt(userId, sessionType);
        
        // Create new session
        const session = {
          sessionId: moment().valueOf().toString(),
          startTime: new Date(),
          sessionType,
          promptType: promptData.promptType,
          initialPrompt: promptData.initial,
          followUpPrompt: promptData.followUp,
          userEngaged: false
        };

        conversation.sessions.push(session);
        await conversation.save();

        return {
          needsPrompt: true,
          conversationId: conversation.conversationId,
          sessionType,
          promptData,
          sessionId: session.sessionId
        };
      }

      return {
        needsPrompt: false,
        conversationId: conversation.conversationId,
        sessionType: 'continue'
      };

    } catch (error) {
      logger.error('SessionManager.handleSessionRequest failed:', error);
      throw error;
    }
  }

  /**
   * Determine session type based on current time
   */
  determineSessionType(currentTime) {
    const hour = currentTime.hour();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Check if user needs a session prompt
   */
  async checkIfPromptNeeded(conversation, sessionType) {
    const today = moment().startOf('day');
    
    // Check if there's already an active session of this type today
    const existingSession = conversation.sessions.find(session => {
      const sessionDate = moment(session.startTime).startOf('day');
      return sessionDate.isSame(today) && 
             session.sessionType === sessionType &&
             session.userEngaged;
    });

    return !existingSession;
  }

  /**
   * Get today's conversation
   */
  async getTodaysConversation(userId, dateString) {
    return await Conversation.findOne({
      user: userId,
      date: new Date(dateString)
    });
  }

  /**
   * Create new daily conversation
   */
  async createDailyConversation(userId, dateString) {
    const conversationId = `${userId}_${dateString}_${moment().valueOf()}`;
    const title = moment(dateString).format('MMMM Do, YYYY');

    const conversation = new Conversation({
      conversationId,
      user: userId,
      date: new Date(dateString),
      title,
      sessions: [],
      messages: [],
      dailySummary: '',
      extractedEvents: [],
      identifiedThemes: [],
      processingStatus: 'pending'
    });

    await conversation.save();
    logger.info(`Created daily conversation for user ${userId}: ${conversationId}`);
    
    return conversation;
  }
}

module.exports = SessionManager;
```

#### 2. **Unified Prompt Service**
```javascript
// File: api/services/UnifiedPromptService.js
const OpenAI = require('openai');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ScheduledEvent = require('../models/ScheduledEvent');
const moment = require('moment');
const logger = require('../config/winston');

class UnifiedPromptService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate contextual prompt based on session type and user context
   */
  async generatePrompt(userId, sessionType) {
    try {
      const context = await this.getContext(userId);
      
      switch (sessionType) {
        case 'morning':
          return await this.generateMorningPrompt(context);
        case 'afternoon':
          return await this.generateAfternoonPrompt(context);
        case 'evening':
          return await this.generateEveningPrompt(context);
        default:
          return this.getDefaultPrompt(sessionType);
      }
    } catch (error) {
      logger.error('UnifiedPromptService.generatePrompt failed:', error);
      return this.getDefaultPrompt(sessionType);
    }
  }

  /**
   * Generate morning planning prompt + goal energy follow-up
   */
  async generateMorningPrompt(context) {
    const goalEnergyPrompt = await this.generateGoalEnergyPrompt(context);
    
    return {
      promptType: 'daily-planning',
      initial: `Good morning ${context.user.firstName || context.user.name}! What does your day look like today?`,
      followUp: goalEnergyPrompt
    };
  }

  /**
   * Generate AI-powered goal energy prompt based on user's goals and motivation
   */
  async generateGoalEnergyPrompt(context) {
    if (!context.activeGoals.length) {
      return "With what energy do you want to approach today?";
    }

    const systemPrompt = `You are MELD, an empathetic AI mentor. Generate a brief, warm question about the energy/approach the user wants to bring to their goal today. 

User's context:
- Active goals: ${context.activeGoals.map(g => g.description).join(', ')}
- Core motivation: ${context.coreWhy || 'building meaningful work'}
- Recent themes: ${context.recentThemes.join(', ')}

Generate a question like: "With what energy do you want to approach [specific goal] today? I remember how important [their why] is to your vision."

Keep it warm, brief, and personal. Don't be chatty.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate my goal energy question.' }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      logger.error('Goal energy prompt generation failed:', error);
      return `With what energy do you want to approach your goal of ${context.activeGoals[0]?.description} today?`;
    }
  }

  /**
   * Generate afternoon open-space prompt
   */
  async generateAfternoonPrompt(context) {
    return {
      promptType: 'open-space',
      initial: "What's on your mind?"
    };
  }

  /**
   * Generate evening reflection prompt (prioritizes event follow-ups)
   */
  async generateEveningPrompt(context) {
    // Check for event follow-ups first
    const eventFollowUp = await this.checkEventFollowUps(context.user._id);
    
    if (eventFollowUp) {
      return {
        promptType: 'event-followup',
        initial: eventFollowUp,
        eventId: eventFollowUp.eventId
      };
    }

    return {
      promptType: 'evening-reflection',
      initial: "How did today go for you?"
    };
  }

  /**
   * Check for scheduled events that need follow-up
   */
  async checkEventFollowUps(userId) {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    
    // Find events that occurred today or yesterday and need follow-up
    const events = await ScheduledEvent.find({
      userId,
      eventDate: { 
        $gte: yesterday.toDate(), 
        $lte: today.endOf('day').toDate() 
      },
      followUpCompleted: false,
      status: 'scheduled' // Not cancelled
    }).sort({ eventDate: -1 });

    if (!events.length) return null;

    const event = events[0]; // Most recent event
    const eventDay = moment(event.eventDate).calendar();
    
    return `How did ${event.description} go ${eventDay}?`;
  }

  /**
   * Get comprehensive user context for prompt generation
   */
  async getContext(userId) {
    try {
      const user = await User.findById(userId);
      const recentConversations = await Conversation.find({
        user: userId,
        date: { $gte: moment().subtract(7, 'days').toDate() }
      }).sort({ date: -1 }).limit(5);

      const activeEvents = await ScheduledEvent.find({
        userId,
        eventDate: { $gte: moment().subtract(1, 'day').toDate() },
        status: 'scheduled'
      });

      return {
        user,
        activeGoals: user.goals || [],
        coreWhy: user.coreMotivation,
        recentThemes: this.extractRecentThemes(recentConversations),
        upcomingEvents: activeEvents,
        conversationHistory: recentConversations
      };
    } catch (error) {
      logger.error('Failed to get user context:', error);
      return {
        user: { name: 'there' },
        activeGoals: [],
        recentThemes: [],
        upcomingEvents: []
      };
    }
  }

  /**
   * Extract themes from recent conversations
   */
  extractRecentThemes(conversations) {
    const themes = [];
    conversations.forEach(conv => {
      if (conv.identifiedThemes) {
        themes.push(...conv.identifiedThemes);
      }
    });
    return [...new Set(themes)]; // Remove duplicates
  }

  /**
   * Fallback prompts if AI generation fails
   */
  getDefaultPrompt(sessionType) {
    const defaults = {
      morning: {
        promptType: 'daily-planning',
        initial: "Good morning! What does your day look like today?",
        followUp: "With what energy do you want to approach today?"
      },
      afternoon: {
        promptType: 'open-space',
        initial: "What's on your mind?"
      },
      evening: {
        promptType: 'evening-reflection',
        initial: "How did today go for you?"
      }
    };

    return defaults[sessionType] || defaults.afternoon;
  }
}

module.exports = UnifiedPromptService;
```

#### 3. **Session Routes with Error Handling**
```javascript
// File: api/server/routes/sessions.js
const express = require('express');
const router = express.Router();
const SessionManager = require('../../services/SessionManager');
const requireJwtAuth = require('../middleware/requireJwtAuth');
const logger = require('../../config/winston');

/**
 * Unified session check endpoint
 * Handles all session logic in one call
 */
router.post('/check', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.body;

    logger.info(`Session check for user ${userId}, conversationId: ${conversationId}`);

    const sessionManager = new SessionManager();
    const result = await sessionManager.handleSessionRequest(userId, conversationId);

    // Add redirect logic if needed
    if (!conversationId && result.conversationId) {
      result.redirectTo = `/c/${result.conversationId}`;
    }

    res.json(result);

  } catch (error) {
    logger.error('Session check failed:', {
      userId: req.user?.id,
      conversationId: req.body?.conversationId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({ 
      error: 'Session check failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Mark session as engaged (user responded to prompt)
 */
router.post('/engage', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId, sessionId } = req.body;

    await Conversation.updateOne(
      { 
        conversationId, 
        user: req.user.id,
        'sessions.sessionId': sessionId 
      },
      { 
        $set: { 'sessions.$.userEngaged': true }
      }
    );

    res.json({ success: true });

  } catch (error) {
    logger.error('Session engage failed:', error);
    res.status(500).json({ error: 'Failed to mark session as engaged' });
  }
});

module.exports = router;
```

#### 4. **Frontend Session Hook with TypeScript**
```typescript
// File: client/src/hooks/useSessionCheck.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SessionState {
  needsPrompt: boolean;
  conversationId: string;
  sessionType: 'morning' | 'afternoon' | 'evening' | 'archive' | 'continue';
  promptData?: {
    promptType: string;
    initial: string;
    followUp?: string;
  };
  sessionId?: string;
  redirectTo?: string;
}

export const useSessionCheck = (requestedConversationId?: string) => {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  the [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSession();
  }, [requestedConversationId]);

  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sessions/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          conversationId: requestedConversationId 
        })
      });

      if (!response.ok) {
        throw new Error(`Session check failed: ${response.statusText}`);
      }

      const data: SessionState = await response.json();
      setSessionState(data);

      // Handle redirects
      if (data.redirectTo) {
        navigate(data.redirectTo, { replace: true });
      }

    } catch (err) {
      console.error('Session check error:', err);
      setError(err instanceof Error ? err.message : 'Session check failed');
    } finally {
      setLoading(false);
    }
  };

  const markSessionEngaged = async (sessionId: string) => {
    try {
      await fetch('/api/sessions/engage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversationId: sessionState?.conversationId,
          sessionId
        })
      });
    } catch (err) {
      console.error('Failed to mark session as engaged:', err);
    }
  };

  return {
    sessionState,
    loading,
    error,
    refetch: checkSession,
    markSessionEngaged
  };
};
```

### Testing & Validation Steps

#### 1. **Asset Verification Test**
```bash
# Test MELD assets are loaded correctly
curl -I http://localhost:3090/assets/logo-b.svg  # Should return 200
curl -I http://localhost:3090/assets/fonts/TAN-ANGLETON.woff2  # Should return 200
```

#### 2. **Session Flow Testing**
```javascript
// Test script: scripts/test-session-flow.js
const mongoose = require('mongoose');
const SessionManager = require('../api/services/SessionManager');

const testSessionFlow = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const sessionManager = new SessionManager();
  const testUserId = 'test_user_123';
  
  try {
    // Test morning session
    console.log('Testing morning session...');
    const morningResult = await sessionManager.handleSessionRequest(testUserId);
    console.log('✅ Morning session:', morningResult);
    
    // Test if prompt is skipped after engagement
    console.log('Testing session engagement...');
    const repeatResult = await sessionManager.handleSessionRequest(testUserId);
    console.log('✅ Repeat session:', repeatResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run test
node scripts/test-session-flow.js
```

#### 3. **Database State Validation**
```javascript
// Validate conversation structure
db.conversations.findOne().pretty()
// Should show: sessions[], dailySummary, extractedEvents[], etc.

// Check session creation
db.conversations.find({ 
  "sessions.sessionType": "morning" 
}).count()
// Should show count of morning sessions
```

### Journal-Inspired Frontend Components

#### 1. **Landing Page with Journal Aesthetics**
```tsx
// File: client/src/components/Chat/Landing.tsx
import React from 'react';
import { useSessionCheck } from '../../hooks/useSessionCheck';
import { JournalPrompt } from './JournalPrompt';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const Landing: React.FC = () => {
  const { sessionState, loading, error } = useSessionCheck();

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-state">Something went wrong. Please refresh.</div>;

  return (
    <div className="min-h-screen bg-theme-cream">
      {/* Journal-style header with minimal branding */}
      <header className="border-b border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <img 
            src="/assets/logo-b.svg" 
            alt="MELD" 
            className="h-8 w-auto opacity-80"
          />
          <div className="font-meld text-theme-charcoal text-sm">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </header>

      {/* Journal-style content area */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {sessionState?.needsPrompt ? (
          <JournalPrompt sessionState={sessionState} />
        ) : (
          <ContinueConversation conversationId={sessionState?.conversationId} />
        )}
      </main>

      {/* Subtle footer */}
      <footer className="text-center py-8 text-gray-400 text-xs">
        Your thoughts are private and secure
      </footer>
    </div>
  );
};

export default Landing;
```

#### 2. **Journal Prompt Component**
```tsx
// File: client/src/components/Chat/JournalPrompt.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface JournalPromptProps {
  sessionState: {
    conversationId: string;
    sessionId: string;
    promptData: {
      initial: string;
      followUp?: string;
    };
  };
}

export const JournalPrompt: React.FC<JournalPromptProps> = ({ sessionState }) => {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!response.trim()) return;

    setIsSubmitting(true);
    try {
      // Send message to conversation
      await fetch('/api/ask/openAI', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text: response,
          conversationId: sessionState.conversationId,
          sessionId: sessionState.sessionId
        })
      });

      // Mark session as engaged
      await fetch('/api/sessions/engage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversationId: sessionState.conversationId,
          sessionId: sessionState.sessionId
        })
      });

      // Navigate to conversation
      navigate(`/c/${sessionState.conversationId}`);

    } catch (error) {
      console.error('Failed to send response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Session greeting */}
      <div className="text-center">
        <h1 className="font-meld-large text-theme-charcoal mb-2">
          {getGreeting()}
        </h1>
        <p className="text-gray-600 text-sm">
          Take a moment to reflect
        </p>
      </div>

      {/* Journal-style prompt card */}
      <div className="conversation-card">
        <div className="space-y-6">
          {/* Main prompt */}
          <div>
            <div className="entry-timestamp">
              {new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              })}
            </div>
            <p className="font-meld text-lg text-theme-charcoal leading-relaxed">
              {sessionState.promptData.initial}
            </p>
          </div>

          {/* Follow-up prompt if exists */}
          {sessionState.promptData.followUp && (
            <div className="pt-4 border-t border-gray-100">
              <p className="font-meld text-theme-charcoal/80 leading-relaxed">
                {sessionState.promptData.followUp}
              </p>
            </div>
          )}

          {/* Journal-style text input */}
          <div className="pt-4">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Start anywhere..."
              className="journal-input w-full min-h-32 placeholder-gray-400"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Minimal submit button */}
          <div className="flex justify-end pt-4 border-t border-gray-50">
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || isSubmitting}
              className="px-6 py-2 bg-theme-rust text-white text-sm rounded-md hover:bg-theme-rust/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Continuing...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
```

#### 3. **Journal-Style Chat Interface**
```tsx
// File: client/src/components/Chat/JournalChatView.tsx
import React from 'react';
import { Message } from './Message';
import { JournalInput } from './JournalInput';

interface JournalChatViewProps {
  messages: Array<{
    messageId: string;
    text: string;
    isCreatedByUser: boolean;
    createdAt: Date;
  }>;
  onSendMessage: (text: string) => void;
  loading?: boolean;
}

export const JournalChatView: React.FC<JournalChatViewProps> = ({
  messages,
  onSendMessage,
  loading
}) => {
  return (
    <div className="min-h-screen bg-theme-cream">
      {/* Journal header */}
      <header className="border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <img 
            src="/assets/logo-b.svg" 
            alt="MELD" 
            className="h-8 w-auto opacity-80"
          />
          <div className="font-meld text-theme-charcoal text-sm">
            Today
          </div>
        </div>
      </header>

      {/* Chat messages in journal format */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {messages.map((message) => (
            <JournalMessage key={message.messageId} message={message} />
          ))}
        </div>

        {/* Spacer for input */}
        <div className="h-32" />
      </main>

      {/* Fixed journal input at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <JournalInput onSend={onSendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
};
```

#### 4. **Journal Message Component**
```tsx
// File: client/src/components/Chat/JournalMessage.tsx
import React from 'react';
import moment from 'moment';

interface JournalMessageProps {
  message: {
    messageId: string;
    text: string;
    isCreatedByUser: boolean;
    createdAt: Date;
  };
}

export const JournalMessage: React.FC<JournalMessageProps> = ({ message }) => {
  const isUser = message.isCreatedByUser;
  
  return (
    <div className={`conversation-card ${isUser ? 'ml-8' : 'mr-8'}`}>
      {/* Timestamp */}
      <div className="entry-timestamp">
        {moment(message.createdAt).format('h:mm A')}
        {isUser && <span className="ml-2 text-theme-rust">You</span>}
      </div>
      
      {/* Message content */}
      <div 
        className={`font-meld leading-relaxed ${
          isUser 
            ? 'text-theme-charcoal' 
            : 'text-theme-charcoal/90'
        }`}
      >
        {message.text}
      </div>
      
      {/* Subtle indicator for AI messages */}
      {!isUser && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center text-xs text-gray-400">
            <div className="w-2 h-2 bg-theme-sage rounded-full mr-2" />
            MELD
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 5. **Journal Input Component**
```tsx
// File: client/src/components/Chat/JournalInput.tsx
import React, { useState, useRef } from 'react';

interface JournalInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const JournalInput: React.FC<JournalInputProps> = ({
  onSend,
  disabled = false,
  placeholder = "Continue your thoughts..."
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    
    onSend(text);
    setText('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="journal-input w-full min-h-12 max-h-48 py-3 px-4 border border-gray-200 rounded-lg resize-none placeholder-gray-400 focus:border-theme-rust focus:ring-2 focus:ring-theme-rust/10 transition-colors"
        rows={1}
      />
      
      {/* Send button - only visible when text exists */}
      {text.trim() && (
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="absolute bottom-2 right-2 p-2 bg-theme-rust text-white rounded-md hover:bg-theme-rust/90 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      )}
      
      {/* Subtle help text */}
      <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
        ⌘+Enter to send
      </div>
    </div>
  );
};
```

#### 6. **Journal-Style CSS Additions**
```css
/* File: client/src/index.css - Add to existing styles */

/* Journal-inspired base styles */
.journal-container {
  font-family: 'TAN-ANGLETON', serif;
  line-height: 1.7;
  color: #2F292B;
}

/* Enhanced conversation cards */
.conversation-card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 
    0 1px 3px rgba(0,0,0,0.05),
    0 1px 2px rgba(0,0,0,0.1);
  padding: 28px;
  margin-bottom: 20px;
  border: 1px solid rgba(175, 175, 175, 0.08);
  transition: box-shadow 0.2s ease;
}

.conversation-card:hover {
  box-shadow: 
    0 4px 6px rgba(0,0,0,0.05),
    0 2px 4px rgba(0,0,0,0.1);
}

/* Journal input styling */
.journal-input {
  border: none;
  background: transparent;
  font-family: 'TAN-ANGLETON', serif;
  font-size: 1.1rem;
  line-height: 1.7;
  color: #2F292B;
  resize: none;
  outline: none;
  width: 100%;
}

.journal-input:focus {
  background: rgba(248, 244, 235, 0.4);
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s ease;
}

.journal-input::placeholder {
  color: #A0A0A0;
  font-style: italic;
}

/* Refined timestamp styling */
.entry-timestamp {
  font-size: 0.8rem;
  color: #999;
  font-weight: 400;
  margin-bottom: 16px;
  font-family: system-ui, sans-serif;
  letter-spacing: 0.5px;
}

/* Smooth scrolling for chat */
html {
  scroll-behavior: smooth;
}

/* Loading states */
.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Error states with journal styling */
.error-state {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #991B1B;
  padding: 16px;
  border-radius: 8px;
  font-family: 'TAN-ANGLETON', serif;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .conversation-card {
    padding: 20px;
    margin-bottom: 16px;
  }
  
  .journal-input {
    font-size: 1rem;
  }
}

/* Subtle animations */
.conversation-card,
.journal-input {
  transition: all 0.2s ease;
}

/* Focus states for accessibility */
button:focus,
textarea:focus,
input:focus {
  outline: 2px solid #BD3C28;
  outline-offset: 2px;
}
```
