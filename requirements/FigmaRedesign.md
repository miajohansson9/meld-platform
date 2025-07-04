# MELD Platform UI Structure - Current State Analysis

## Overview
This document analyzes the current MELD platform UI structure and routing system to prepare for a complete redesign. The current interface follows a traditional chat application layout with a sidebar navigation and main chat area.

## Main Application Structure

### App Component (`client/src/App.jsx`)
- Entry point wrapped in multiple providers: QueryClient, RecoilRoot, ThemeProvider, ToastProvider, DndProvider
- Uses React Router for navigation
- Includes global error handling and React Query DevTools

### Routing System (`client/src/routes/index.tsx`)

#### Primary Routes:
- `/` - Root route that redirects to `/c/new` for authenticated users
- `/c/:conversationId?` - Main chat interface
- `/login`, `/register` - Authentication routes  
- `/mentor-interview/:access_token` - Interview flow
- `/search` - Search functionality
- `/share/:shareId` - Shared conversation viewing

#### Layout Components:
- **Root Layout** (`client/src/routes/Root.tsx`) - Main authenticated layout
- **StartupLayout** - Handles unauthenticated states
- **LoginLayout** - Authentication forms container

## Current UI Structure (Main Chat Interface)

### 1. Root Container (`client/src/routes/Root.tsx`)
- Provides context for authentication, assistants, agents, and file management
- Renders main flex layout with sidebar and content area
- Handles responsive navigation state (navVisible)
- Layout: `<div className="flex" style={{ height: calc(100dvh - bannerHeight) }}>`

### 2. Navigation Sidebar (`client/src/components/Nav/Nav.tsx`)

#### Components:
- **Width**: 260px desktop, 320px mobile
- **Background**: `bg-theme-cream` with `border-r border-gray-200`
- **Toggle behavior**: Slides in/out with width transition

#### Structure:
```
Nav Container
├── NewChat Component (Header area)
│   ├── Close Sidebar Button
│   ├── New Chat Button  
│   └── Search Bar
├── Conversations List (Scrollable)
│   ├── Infinite scroll conversation history
│   └── Loading states
└── AccountSettings (Footer)
```

#### Key Features:
- Conversation search with debounced queries
- Infinite scroll for conversation history
- Responsive collapse on mobile
- Conversation sorting and filtering

### 3. Main Content Area

#### Layout Container:
```
<div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
  <MobileNav /> (Mobile only)
  <Outlet /> (ChatRoute content)
</div>
```

#### Chat View (`client/src/components/Chat/ChatView.tsx`)
Primary chat interface with conditional rendering:

**Landing Page State:**
- Shows when no conversation is active
- Centers form on page
- Includes conversation starters
- Full-height background: `bg-theme-cream`

**Active Conversation State:**
- Header with date and controls
- Scrollable messages area
- Fixed input form at bottom
- Footer component

### 4. Header Component (`client/src/components/Chat/Header.tsx`)

#### Current Structure:
```
Header (sticky top-0)
├── Left Side
│   ├── MELD Logo (/assets/logo-b.svg)
│   ├── Open Sidebar Button (when sidebar closed)
│   ├── New Chat Button
│   └── Date Display (hidden on mobile)
└── Right Side
    └── Coach Mode Toggle
        ├── "Coach Mode" label
        └── Toggle Switch (green when active)
```

#### Styling:
- Background: `bg-theme-cream border-b border-gray-200`
- Responsive padding: `px-4 py-4`
- Logo height: `h-8`

### 5. Message System

#### Message Container (`client/src/components/Chat/Messages/`)
- **MessageRender**: Individual message display
- **MessagesView**: Container for all messages
- **MessageIcon**: User/AI avatar system
- **Content handling**: Text, files, artifacts, tools

#### Message Layout:
```
Message
├── Avatar (6x6 rounded)
├── Message Content
│   ├── Sender Name (User/Assistant/Agent)
│   ├── Message Text/Content
│   └── Hover Buttons (edit, copy, etc.)
└── Timestamp/Actions
```

### 6. Input System (`client/src/components/Chat/Input/ChatForm.tsx`)

#### Structure:
```
Chat Form
├── Textarea (auto-expanding)
├── File Upload Button
├── Submit Button
└── Additional Controls
    ├── Mention System (@)
    ├── Model/Preset Selection (+)
    └── Prompts Command (/)
```

#### Responsive Behavior:
- Max width: `md:max-w-3xl xl:max-w-4xl`
- Landing page centering with bottom margin
- RTL text support

### 7. Mobile Navigation (`client/src/components/Nav/MobileNav.tsx`)
- Shows only on mobile (hidden md:hidden)
- Hamburger menu to open sidebar
- Date display in center
- Background: `bg-theme-cream`

## Current Theme System

### Color Palette (CSS Variables):
- `theme-cream` - Primary background color
- `theme-charcoal` - Primary text color
- `theme-sage` - Accent color (Coach Mode toggle)
- `border-gray-200` - Border color

### Typography:
- Inter font family
- Font sizes controlled via Recoil state
- RTL text support throughout

## State Management

### Recoil Atoms:
- `navVisible` - Sidebar visibility state (also in localStorage)
- `conversation` - Current conversation data
- `messages` - Message history
- `fontSize` - User preference for text size
- `maximizeChatSpace` - Chat area width preference

### React Query:
- Conversation list with infinite scroll
- Message fetching by conversation ID
- Real-time updates via Server-Sent Events (SSE)

## Responsive Breakpoints

### Layout Behavior:
- **Mobile (< 768px)**: 
  - Sidebar overlays content
  - Header shows mobile nav
  - Reduced padding and spacing
  
- **Tablet (768px - 1024px)**:
  - Sidebar toggles normally
  - Standard spacing
  
- **Desktop (> 1024px)**:
  - Full layout with sidebar
  - Maximum content width constraints

## Key Integration Points

### Context Providers:
- `ChatContext` - Current conversation state
- `FileMapContext` - File upload/management
- `AgentsMapContext` - AI agent configurations
- `AssistantsMapContext` - Assistant configurations

### Authentication:
- Route protection via `useAuthRedirect`
- User context throughout components
- Automatic redirects for unauthenticated users

## Current Pain Points for Redesign

### Layout Limitations:
1. **Fixed sidebar width** - No resizing capability
2. **Limited header functionality** - Only basic controls
3. **Coach Mode toggle** - Prominent but underutilized
4. **Mobile experience** - Sidebar overlay obscures content
5. **Message density** - Limited conversation overview

### Design Inconsistencies:
1. **Color usage** - Limited theme palette
2. **Spacing** - Inconsistent padding/margins
3. **Typography hierarchy** - Basic implementation
4. **Interactive states** - Limited hover/focus indicators

### Functional Gaps:
1. **Multi-conversation view** - No side-by-side comparison
2. **Quick actions** - Limited message interactions
3. **Search integration** - Separate route instead of inline
4. **File management** - Basic upload interface
5. **Accessibility** - Limited ARIA implementation

## Redesign Opportunities

### Layout Improvements:
- Resizable panels with saved preferences
- Multi-pane conversation viewing
- Floating action buttons for common tasks
- Improved mobile-first responsive design

### Visual Enhancement:
- Expanded color palette and theming
- Better typography system
- Consistent spacing grid
- Micro-interactions and animations

### Functional Additions:
- Inline search with live results
- Drag-and-drop file handling
- Quick message templates
- Enhanced message threading
- Better accessibility compliance

---

# Figma Component Integration Strategy

## New UI Paradigm
The Figma design represents a complete shift from chat-focused to modular dashboard approach with the following sections:

### Navigation Structure
```
Dashboard Layout
├── Home (Today view)
├── Today 
├── Log
├── Mentor
│   └── Mentor Feed
├── Chats (modular chat interface)
├── Fragments
├── Library
│   ├── North-Star Map
│   └── Wins Vault
└── Me
```

## Implementation Approach

### Phase 1: Route Structure Setup
**Objective**: Create new routing without breaking existing functionality

**New Routes to Add**:
- `/dashboard` - New main dashboard entry point
- `/today` - Today module view
- `/log` - Log timeline view  
- `/mentor` - Mentor Feed
- `/mentor/feed` - Mentor feed
- `/chats` - New modular chats interface
- `/fragments` - Fragments management
- `/library` - Library hub
- `/library/north-star` - North Star Map
- `/library/wins-vault` - Wins Vault
- `/me` - Personal settings

**Preserve Existing**:
- `/c/new` and `/c/:conversationId` - Keep current chat functionality intact
- Current sidebar navigation - Preserve for later repurposing in chats module

### Phase 2: Layout Infrastructure
**Objective**: Create container structure for Figma components

**New Layout Components**:
- `DashboardLayout.tsx` - Main dashboard container
- `DashboardSidebar.tsx` - New navigation sidebar
- `DashboardHeader.tsx` - Dashboard-specific header
- Module containers for each section

### Phase 3: Component Placeholders
**Objective**: Create empty shells matching Figma component names

**Components to Create** (in `client/src/components/figma/`):
```
figma/
├── ChatsModule.tsx
├── ChronicleCanvas.tsx  
├── CoachFeedModule.tsx
├── ContextDock.tsx
├── EntryCard.tsx
├── FloatingActionButton.tsx
├── FragmentsModule.tsx
├── HeaderBar.tsx
├── InsightDock.tsx
├── LogHeaderBar.tsx
├── LogModule.tsx
├── MorningSegment.tsx
├── NorthStarModule.tsx
├── ReflectionSegment.tsx
├── Sidebar.tsx
├── TodayModule.tsx
└── WinsVaultModule.tsx
```

### Phase 4: Integration Points
**Objective**: Define clear interfaces for component integration

**Props Interfaces**: Create TypeScript interfaces for each component
**State Management**: Extend existing Recoil atoms for dashboard state
**Data Integration**: Connect to existing APIs where needed

## File Drop Strategy

### Step 1: Replace Placeholders
Simply overwrite the placeholder components in `client/src/components/figma/` with your Figma-exported components.

### Step 2: Update Imports
Each dashboard route will import the appropriate Figma components. Update imports as needed.

### Step 3: Style Integration
Figma components should use existing CSS variables where possible, or extend the theme system.

### Step 4: Data Wiring
Connect components to existing data providers (conversations, messages, user data, etc.).

## Transition Strategy

### Soft Launch
- Dashboard accessible via `/dashboard` route
- Current chat interface remains at `/c/new`
- Users can switch between interfaces

### Feature Parity
- Ensure all existing functionality is available in new interface
- Migrate users gradually
- Deprecate old interface when ready

### Rollback Plan
- Keep current implementation intact until new interface is proven
- Feature flags for easy switching
- Database schema remains unchanged

## Technical Requirements

### Dependencies
- Maintain existing React Query setup
- Keep Recoil state management
- Preserve authentication system
- Maintain WebSocket connections for real-time features

### Performance
- Code splitting for dashboard routes
- Lazy loading of heavy components
- Maintain existing caching strategies

### Accessibility
- Ensure new components meet WCAG standards
- Preserve existing screen reader compatibility
- Maintain keyboard navigation

---

# Implementation Status & Next Steps

## ✅ COMPLETED Infrastructure Setup

### 1. Component Placeholders Created
All Figma component placeholders have been created in `client/src/components/figma/`:
- ✅ 17 placeholder components matching your Figma file structure
- ✅ TypeScript interfaces for each component
- ✅ Centralized exports in `index.ts`

### 2. Dashboard Layout Infrastructure  
- ✅ `DashboardLayout.tsx` - Main container with sidebar + content
- ✅ 6 Dashboard page components (Today, Log, Chats, Fragments, NorthStar, WinsVault)
- ✅ Route configuration in `client/src/routes/Dashboard/`

### 3. Routing Integration
- ✅ Dashboard routes added to main router
- ✅ Preserved existing `/c/new` chat functionality
- ✅ Navigation structure: `/*` paths

### 4. Access Points
- ✅ Dashboard accessible at `/dashboard` (redirects to `/today`)
- ✅ Temporary "Dashboard (Beta)" link added to current chat header
- ✅ Original chat preserved at `/c/new`

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Core Navigation (Start Here)
1. **Replace `Sidebar.tsx`** - Main navigation (highest impact)
2. **Replace `HeaderBar.tsx`** - Page headers 
3. **Test navigation** - Verify routing works with your components

### Phase 2: Today Dashboard
4. **Replace `TodayModule.tsx`** - Main today content
5. **Replace `CoachFeedModule.tsx`** - Right sidebar
6. **Replace `MorningSegment.tsx` & `ReflectionSegment.tsx`**
7. **Test at `/today`**

### Phase 3: Core Modules
8. **Replace `LogModule.tsx` & `LogHeaderBar.tsx`**
9. **Replace `FragmentsModule.tsx`**
10. **Replace `ChatsModule.tsx` & `ContextDock.tsx`**
11. **Test each at respective routes**

### Phase 4: Specialized Components  
12. **Replace `NorthStarModule.tsx` & `ChronicleCanvas.tsx`**
13. **Replace `WinsVaultModule.tsx`**
14. **Replace `InsightDock.tsx`**
15. **Replace `FloatingActionButton.tsx`**

### Phase 5: Fine Details
16. **Replace `EntryCard.tsx`** - Individual cards/entries
17. **Style integration & polish**
18. **Data wiring & state management**

## 📁 File Structure Created

```
client/src/
├── components/figma/           # ← DROP YOUR COMPONENTS HERE
│   ├── README.md              # Detailed integration guide
│   ├── index.ts               # Component exports
│   ├── Sidebar.tsx            # ← Start with this one
│   ├── HeaderBar.tsx
│   ├── TodayModule.tsx
│   └── [14 other placeholders]
├── routes/Dashboard/           # Dashboard page layouts
│   ├── DashboardLayout.tsx    # Main layout wrapper
│   ├── TodayPage.tsx          # Combines Today + Coach Feed
│   ├── LogPage.tsx            # Log + Insights
│   ├── ChatsPage.tsx          # Chats + Context
│   └── [3 other pages]
```

## 🚀 Quick Start Instructions

1. **Navigate to `/dashboard`** to see placeholder structure
2. **Replace `client/src/components/figma/Sidebar.tsx`** with your Figma component
3. **Test navigation** works between dashboard sections  
4. **Continue replacing components** following recommended order
5. **Refer to `client/src/components/figma/README.md`** for detailed instructions

## 🔄 Current State
- **Dashboard UI**: Accessible but shows placeholders
- **Original Chat**: Fully functional at `/c/new` 
- **Component Integration**: Ready for drop-in replacement
- **Data Layer**: Existing APIs preserved and available

The infrastructure is now ready for your Figma components. You can start by replacing the `Sidebar.tsx` component and testing the navigation, then work through the modules in the recommended order.

## 🖌️ Stylesheet Integration for Figma `global.css`

Your Figma export provided an extensive `global.css` (already copied to `client/src/components/figma/global.css`).  Here’s a **low-risk merge strategy** that keeps Tailwind utilities intact while layering the new design tokens & components.

1. **Single Import Point**  
   • In `client/src/index.css` append `@import "~/components/figma/global.css";` **after** the `@tailwind utilities` directive.  
   • Tailwind will then compile both style sheets into the same output, ensuring the Figma variables and custom classes are available everywhere.

2. **Namespace vs Override**  
   • The Figma sheet defines its own CSS variables (e.g., `--meld-canvas`, `--color-*`). None of these collide with the existing `--theme-*` variables so both sets can co-exist.  
   • Leave the original variables in place – the legacy chat interface still relies on them.

3. **Leverage Tailwind’s `@layer`**  
   • The Figma sheet already uses `@layer base` and custom utilities, which Tailwind respects. No configuration changes needed.

4. **Purge-CSS Safety**  
   • Since Tailwind’s content scan won’t see class names used **only** inside Figma components until those components are mounted, keep the classes by adding the Figma folder to the Vite/Tailwind `content` array (if you notice styles being stripped in production).  
   ```js
   // tailwind.config.cjs
   module.exports = {
     content: [
       './index.html',
       './src/**/*.{js,ts,jsx,tsx}',
       './src/components/figma/**/*.{js,ts,jsx,tsx}', // 👈 add
     ],
   }
   ```

5. **Variable Bridging (Optional)**  
   • Map existing `--theme-*` colors to the new `--meld-*` palette for consistency, e.g.:  
   ```css
   :root {
     --theme-cream: var(--meld-canvas);
     --theme-charcoal: var(--meld-ink);
     --theme-sage: var(--meld-sage);
   }
   ```
   • Do this only if you plan to fully migrate legacy components.

6. **Progressive Migration**  
   • New dashboard components will exclusively use `global.css` tokens/classes.  
   • Legacy chat components continue using existing Tailwind utilities + `index.css`.  
   • Gradually refactor old components to the new token system when convenient.

7. **Testing**  
   • Run `npm run dev` and verify both the dashboard (`/today`) and chat (`/c/new`) views look correct.  
   • Check dark mode (`.dark` selector exists in `global.css`) if your app toggles themes.

8. **Build Performance**  
   • The extra CSS adds ~25-30 KB gzipped. If bundle size is a concern, enable Tailwind’s built-in CSS-nano or Vite’s `css.minify`.

9. **Future Design Token Management**  
   • Consider a `tokens.css` generated via Style-Dictionary to keep a single source of truth, then import into both Tailwind and raw CSS.

> **Minimal Change Summary:**  One-line `@import` + optional Tailwind content path update – no existing class names break, rollout can be incremental.
