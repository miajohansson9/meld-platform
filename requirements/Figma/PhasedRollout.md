# MELD Frontend Transformation Roadmap

This document outlines the phased approach to transform the current LibreChat interface into the MELD narrative-focused AI mentor platform, based on the design system and components in `/requirements/Figma`.

## Current State Analysis

### What We're Replacing
- **Single-purpose chat interface** → **Multi-module journaling platform**
- **Conversation-centric navigation** → **Hierarchical activity-based navigation**
- **Message list sidebar** → **Contextual module sidebar**
- **Generic chat styling** → **Warm, journal-inspired MELD design system**

### What We're Keeping
- Authentication system
- Individual message rendering components (with styling updates)
- Base React/TypeScript infrastructure
- Some utility functions and hooks

---

## Phase 1: Foundation & Design System (Week 1-2)
**Status: ✅ COMPLETE**

### 1.1 Design System Integration
**Status: ✅ Complete**

- [x] **Replace `client/src/index.css`** with MELD design system
  - Integrate `requirements/Figma/styles/globals.css`
  - Remove existing LibreChat color variables
  - Add MELD color palette and typography
  - Import Inter and Playfair Display fonts

- [x] **Update Tailwind config** to support MELD design tokens
  - Add custom color classes for `meld-*` colors
  - Configure font families (Inter, Playfair Display)
  - Set up spacing scale based on 8px baseline rhythm

- [ ] **Copy MELD UI components** from Figma to `client/src/components/ui/`
  - Components available in `requirements/Figma/components/ui/` (with screenshots)
  - Ensure compatibility with existing shadcn/ui setup
  - Test component rendering and interactions
  - *Note: Deferred to avoid breaking existing functionality*

### 1.2 Layout Foundation
**Status: ✅ Complete**

- [x] **Create new layout wrapper**: `client/src/components/Layout/MeldLayout.tsx`
  - Implement four-zone sanctuary margin system (A, B, C, D)
  - 48px outer margins, 240px sidebar, flexible content, 280px context dock
  - Mobile responsive behavior

- [x] **Create basic MELD sidebar**: `client/src/components/Navigation/MeldSidebar.tsx`
  - Foundation for hierarchical navigation
  - MELD branding and styling
  - Basic Today/Chat navigation for Phase 1

- [x] **Update Root.tsx** to use MeldLayout instead of current layout
  - Integrated MeldLayout with four-zone sanctuary margin system
  - Added MeldSidebar with MELD branding and basic navigation
  - Maintained all existing functionality and context providers
  - Added feature flag for easy switching between layouts
  - Preserved mobile navigation and existing routing

- [x] **Create base route structure** (preparation for Phase 2)
  - Added currentPage state management based on routes
  - Prepared navigation handler for future route integration
  - Maintained compatibility with existing chat routes

---

## Phase 2: Navigation Transformation (Week 2-3)
**Status: ✅ COMPLETED**

### 2.1 New Sidebar Navigation
**Status: ✅ COMPLETED**

- [x] **Replace `client/src/components/Nav/`** entirely
- [x] **Implement `client/src/components/Navigation/Sidebar.tsx`**
  - ✅ Copied from `requirements/Figma/components/Sidebar.tsx`
  - ✅ Hierarchical structure: Home > Mentor > Library > Me
  - ✅ Active state management with `bg-meld-sand`
  - ✅ Collapsible sections (Library expandable)

- [x] **Create navigation state management**
  - ✅ Created `client/src/hooks/Nav/useNavigation.ts`
  - ✅ Current page tracking (`today`, `log`, `coach-feed`, etc.)
  - ✅ Route mapping and navigation functions
  - ✅ Date selection for Today/Log modules

### 2.2 Header Transformation  
**Status: ✅ COMPLETED**

- [x] **Replace existing header** with `client/src/components/Navigation/HeaderBar.tsx`
  - ✅ Copied from `requirements/Figma/components/HeaderBar.tsx`
  - ✅ Date navigation with tooltips
  - ✅ User avatar and global actions dropdown
  - ✅ Context-aware titles (different titles per page)

- [x] **Update Root.tsx integration**
  - ✅ Integrated new Sidebar and HeaderBar components
  - ✅ Connected navigation state management
  - ✅ Maintained existing functionality and mobile navigation
  - ✅ Removed old MeldSidebar component

---

## Phase 3: Routing Revolution (Week 3-4)
**Status: ✅ COMPLETED**

### 3.1 URL Structure Overhaul
**Status: ✅ COMPLETED**

**Previous URLs:**
```
/ → Redirect to /c/new
/c/{conversationId} → Chat interface
/login, /register → Auth pages
```

**New MELD URLs:**
```
/ → Redirect to /today
/today → Daily compass view  
/log → Activity log view
/mentor/feed → Mentor insights feed
/mentor/chats/{conversationId} → Chat conversations (preserved functionality)
/mentor/fragments → Fragment management
/library/north-star → North-Star narrative
/library/wins → Wins vault
/me → Profile and settings
```

- [x] **Update `client/src/routes/index.tsx`** structure
  - ✅ Created hierarchical nested routes for mentor/ and library/
  - ✅ Added lazy loading for performance optimization
  - ✅ Maintained backward compatibility with legacy /c/ routes
  
- [x] **Create new route components** for each main view
  - ✅ `client/src/routes/modules/TodayRoute.tsx` - Daily compass placeholder
  - ✅ `client/src/routes/modules/LogRoute.tsx` - Activity log placeholder
  - ✅ `client/src/routes/modules/MentorFeedRoute.tsx` - AI insights placeholder
  - ✅ `client/src/routes/modules/FragmentsRoute.tsx` - Fragment management placeholder
  - ✅ `client/src/routes/modules/NorthStarRoute.tsx` - Values narrative placeholder
  - ✅ `client/src/routes/modules/WinsVaultRoute.tsx` - Achievement tracking placeholder
  - ✅ `client/src/routes/modules/ProfileRoute.tsx` - Settings & profile placeholder
  - ✅ `client/src/routes/modules/MentorChatsRoute.tsx` - Chat wrapper component

- [x] **Update routing logic and navigation**
  - ✅ Updated `useNavigation()` hook for nested route handling
  - ✅ Created `LegacyChatRedirect.tsx` for backward compatibility
  - ✅ Integrated with existing authentication and protection

### 3.2 Route Integration & Layout
**Status: ✅ COMPLETED**

- [x] **Integrate routes with MELD layout system**
  - ✅ Updated `Root.tsx` to use direct four-zone layout
  - ✅ Connected navigation state with actual routing
  - ✅ Preserved existing functionality and context providers
  
- [x] **Route-based navigation system**
  - ✅ Navigation sidebar now drives actual URL changes
  - ✅ HeaderBar titles update based on current route
  - ✅ Loading states and transitions implemented
  - ✅ Context dock placeholder ready for dynamic content

---

## Phase 4: Core Module Development (Week 4-6)

### 4.1 Today Module (Priority 1)
**Status: ⏳ Pending**

- [ ] **Create `client/src/components/Modules/TodayModule.tsx`**
  - Copy structure from `requirements/Figma/components/TodayModule.tsx`
  - Morning segment with gentle check-in
  - Reflection textarea with prompts
  - Daily wins capture

- [ ] **Supporting components:**
  - [ ] `MorningSegment.tsx` - Daily check-in
  - [ ] `ReflectionSegment.tsx` - Main journaling area
  - [ ] `EntryCard.tsx` - Individual reflection cards

**Backend Integration Points:**
- 🔴 **TODO Backend**: Daily entry model and API endpoints
- 🔴 **TODO Backend**: Morning check-in data structure
- 🔴 **TODO Backend**: Reflection storage and retrieval

### 4.2 Context Dock System
- [ ] **Create `client/src/components/ContextDock/ContextDock.tsx`**
  - Copy from `requirements/Figma/components/ContextDock.tsx`
  - Dynamic content based on current view
  - Memory fragments and insights
  - Smooth slide-in/out animations

- [ ] **Create context providers for each module**
  - Today context: Recent reflections, patterns
  - Chat context: Conversation history, insights
  - Fragment context: Related fragments, connections

---

## Phase 5: Mentor Module Development (Week 6-8)

### 5.1 Mentor Feed
**Status: ⏳ Pending**

- [ ] **Create `client/src/components/Modules/CoachFeedModule.tsx`**
  - Copy from `requirements/Figma/components/CoachFeedModule.tsx`
  - AI-generated conversation starters
  - Gentle insights and suggestions
  - Memory-aware contextual prompts

**Backend Integration Points:**
- 🔴 **TODO Backend**: Conversation starter generation system
- 🔴 **TODO Backend**: RAG-powered memory retrieval
- 🔴 **TODO Backend**: Insight generation algorithms

### 5.2 Fragments Module
- [ ] **Create `client/src/components/Modules/FragmentsModule.tsx`**
  - Copy from `requirements/Figma/components/FragmentsModule.tsx`
  - Fragment type color coding (quote, insight, question, todo, general)
  - Search and filtering capabilities
  - Visual connection mapping

**Backend Integration Points:**
- 🔴 **TODO Backend**: Fragment storage with type classifications
- 🔴 **TODO Backend**: Fragment search and semantic connections
- 🔴 **TODO Backend**: Auto-tagging and categorization

### 5.3 Chat Integration
- [ ] **Adapt existing `MessagesView.tsx`** for new context
  - Update styling to match MELD design system
  - Integrate with new navigation structure
  - Add context dock integration
  - Maintain existing chat functionality

---

## Phase 6: Library Module Development (Week 8-10)

### 6.1 Wins Vault
**Status: ⏳ Pending**

- [ ] **Create `client/src/components/Modules/WinsVaultModule.tsx`**
  - Copy from `requirements/Figma/components/WinsVaultModule.tsx`
  - Timeline view with celebration animations
  - Win categorization and tagging
  - Confetti effects for major achievements

**Backend Integration Points:**
- 🔴 **TODO Backend**: Wins storage and categorization system
- 🔴 **TODO Backend**: Achievement recognition algorithms
- 🔴 **TODO Backend**: Progress tracking and milestones

### 6.2 North-Star Module
- [ ] **Create `client/src/components/Modules/NorthStarModule.tsx`**
  - Copy from `requirements/Figma/components/NorthStarModule.tsx`
  - Value-based narrative structure
  - Goal tracking with story progression
  - Chapter-like organization

**Backend Integration Points:**
- 🔴 **TODO Backend**: North-Star narrative storage
- 🔴 **TODO Backend**: Goal tracking and progress systems
- 🔴 **TODO Backend**: Value alignment algorithms

---

## Phase 7: Activity Log & Advanced Features (Week 10-12)

### 7.1 Activity Log
**Status: ⏳ Pending**

- [ ] **Create `client/src/components/Modules/LogModule.tsx`**
  - Copy from `requirements/Figma/components/LogModule.tsx`
  - Chronological activity view
  - Insight dock integration
  - Pattern recognition highlights

- [ ] **Create `InsightDock.tsx`** for log-specific insights
  - Pattern detection and highlighting
  - Trend analysis visualization
  - Contextual suggestions

### 7.2 Profile & Settings
- [ ] **Create profile module** at `/me`
  - User preferences and settings
  - Account management
  - Export and data management

---

## Phase 8: Polish & Optimization (Week 12-13)

### 8.1 Performance & UX
- [ ] **Implement skeleton loading states** using `meld-graysmoke`
- [ ] **Add smooth page transitions** with MELD animation system
- [ ] **Mobile responsive optimization**
  - Sidebar collapse to icons
  - Context dock to bottom sheet
  - Touch-friendly interactions

### 8.2 Accessibility & Testing
- [ ] **WCAG AA compliance testing** for all new components
- [ ] **Keyboard navigation verification**
- [ ] **Screen reader compatibility testing**
- [ ] **Cross-browser testing and fixes**

---

## Backend Integration Checklist

### Critical Backend Updates Needed:
1. **🔴 Data Models**: Extend beyond messages/conversations
   - Daily entries, fragments, wins, goals, north-star narratives
   - User preferences and context data

2. **🔴 API Endpoints**: New endpoints for each module
   - `/api/daily-entries`, `/api/fragments`, `/api/wins`, etc.
   - Context and memory retrieval APIs

3. **🔴 AI Integration**: Enhanced AI capabilities
   - Conversation starter generation
   - Memory-aware context retrieval (RAG)
   - Pattern recognition and insights

4. **🔴 Memory System**: Sophisticated memory architecture
   - Multi-layered summaries (daily, weekly, monthly)
   - Semantic search and embeddings
   - Context-aware retrieval

### Temporary Frontend Workarounds:
- Use mock data for new modules during development
- Implement localStorage for temporary state management
- Create placeholder API calls that can be easily replaced

---

## Success Metrics

### Phase Completion Criteria:
- [ ] **Phase 1**: MELD design system fully integrated, no LibreChat styling remains
- [ ] **Phase 2**: New navigation works, old nav components removed
- [ ] **Phase 3**: All new URLs functional, routing working smoothly
- [ ] **Phase 4**: Today module fully functional with real data integration
- [ ] **Phase 5**: Mentor modules working, chat integration successful
- [ ] **Phase 6**: Library modules complete, all major features working
- [ ] **Phase 7**: Full feature parity with enhanced MELD capabilities
- [ ] **Phase 8**: Production-ready, accessible, and performant

### Definition of Done for Each Phase:
1. All components render correctly
2. Styling matches MELD design system exactly
3. Functionality works as intended
4. No console errors or warnings
5. Mobile responsive behavior verified
6. Accessibility standards met
7. Code reviewed and documented

---

## Risk Mitigation

### High-Risk Areas:
1. **State Management Complexity**: Moving from conversation-centric to module-centric state
2. **Data Migration**: Ensuring existing user data is preserved and accessible
3. **Performance**: Multiple modules loading simultaneously
4. **Mobile Experience**: Complex layout system on smaller screens

### Mitigation Strategies:
1. Implement feature flags for gradual rollout
2. Maintain parallel development branches
3. Create comprehensive testing suite
4. Regular user testing throughout development
5. Performance monitoring and optimization

---

**Last Updated**: $(date)  
**Current Phase**: Phase 1 - ✅ COMPLETE  
**Next Milestone**: Phase 2 - Navigation Transformation

## Phase 1 Summary

✅ **Successfully Completed:**
- **MELD Design System Integration**: Replaced LibreChat styling with comprehensive MELD color palette, typography (Inter + Playfair Display), and component styles
- **Tailwind Configuration**: Added all `meld-*` color classes, font families, and animation support  
- **Four-Zone Layout System**: Implemented sanctuary margin layout (Zone A: 48px margins, Zone B: 240px sidebar, Zone C: flexible content, Zone D: 280px context dock)
- **MELD Sidebar**: Created branded navigation with "M" logo and basic Today/Chat structure
- **Seamless Integration**: Applied MELD layout while preserving all existing functionality, routing, and context providers
- **Feature Flag System**: Added `useMeldLayout` flag for easy switching between old and new layouts

**Visual Transformation Result:**
- Application now displays with warm MELD canvas background (#F9F8F5)
- Sidebar shows MELD branding with proper sanctuary margins
- Typography uses Inter (sans) and Playfair Display (serif) as specified
- All UI components ready to use MELD color system
- Four-zone layout foundation established for future modules

**Ready for Phase 2:** Navigation transformation and hierarchical menu implementation
