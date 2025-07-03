# MELD Design System Guidelines

These guidelines define the design principles, patterns, and components for the MELD narrative-focused AI mentor platform.

## Core Design Philosophy

MELD is designed as a warm, supportive digital sanctuary that encourages deep reflection and storytelling. The interface should feel like a premium journal combined with a thoughtful digital companion - never overwhelming, always inviting.

### Key Principles
* **Sanctuary First**: Every interface element should contribute to a sense of calm, safety, and focus
* **Listen More Than Talk**: UI should provide space for user expression, not dominate with unnecessary chrome
* **Journal-Inspired**: Draw inspiration from high-quality physical journals and notebooks
* **Warm Minimalism**: Clean but never cold, simple but never sparse

## Color Palette

### Primary Colors
* **Canvas** (`--meld-canvas: #F9F8F5`) - Primary background, warm cream tone
* **Ink** (`--meld-ink: #22231F`) - Primary text, deep charcoal
* **Sand** (`--meld-sand: #D5C8A4`) - Primary accent, warm gold-sand
* **Sage** (`--meld-sage: #BFCDB1`) - Secondary accent, muted green

### Supporting Colors
* **Ember** (`--meld-ember: #E6B8AD`) - Alerts, notifications, warm coral
* **Graysmoke** (`--meld-graysmoke: #EFEDE9`) - Subtle backgrounds, dividers
* **Cream** (`--meld-cream: #F8F4EB`) - Alternative light background
* **Charcoal** (`--meld-charcoal: #2F292B`) - Dark mode primary
* **Steel** (`--meld-steel: #3B3C50`) - Dark mode secondary

### Fragment Type Colors
* **Quote** (`--meld-fragment-quote: #F2DBDB`) - Rose for user quotes
* **Insight** (`--meld-fragment-insight: #E9F2E4`) - Light sage for insights
* **Question** (`--meld-fragment-question: #F1ECD9`) - Sand for questions
* **Todo** (`--meld-fragment-todo: #DFE4E7`) - Stone for action items
* **General** (`--meld-fragment-general: #F9F8F5`) - Canvas for general notes

## Typography

### Font Families
* **Primary Sans**: Inter - Clean, readable, for body text and UI elements
* **Primary Serif**: Playfair Display - Elegant, for headings and emphasis
* **Custom Brand**: TAN-ANGLETON - Premium serif for special brand moments

### Hierarchy
* **Display** (2.5rem): Playfair Display, for major page titles
* **H1** (2rem): Playfair Display Medium, for primary headings
* **H2** (1.5rem): Playfair Display Medium, for section headers
* **H3** (1.125rem): Inter Medium, for subsection headers
* **Body** (1rem): Inter Regular, for main content
* **Small** (0.875rem): Inter Regular, for metadata and captions

## Layout System

### Sanctuary Margins
MELD uses a four-zone layout system that creates breathing room and clear hierarchy:

* **Zone A**: Sanctuary Margins (48px) - Sacred whitespace on outer edges
* **Zone B**: Primary Sidebar (240px) - Navigation and brand presence
* **Zone C**: Working Canvas (flexible) - Main content area
* **Zone D**: Context Dock (280px) - Contextual tools and insights

### Spacing Scale
Based on 8px baseline rhythm:
* **xs**: 4px - Tight spacing within components
* **sm**: 8px - Standard component internal spacing
* **md**: 16px - Standard component external spacing
* **lg**: 24px - Section spacing
* **xl**: 32px - Major section breaks
* **2xl**: 48px - Page-level spacing

## Component Patterns

### Buttons
* **Primary**: `bg-meld-ink text-white` with hover lift effect
* **Secondary**: `bg-meld-sand text-meld-ink` with subtle hover
* **Ghost**: Transparent with `hover:bg-meld-graysmoke/50`
* **Destructive**: `bg-meld-ember` for deletion/warning actions

Always use rounded corners (`rounded-lg` = 12px) and include transition effects.

### Cards
* Background: White or `meld-canvas`
* Border: `border-meld-graysmoke` or subtle shadow
* Padding: 24-32px for content cards
* Hover: Subtle lift effect with increased shadow
* Border radius: 12px standard

### Navigation
* Sidebar items use `bg-meld-sand` for active state
* Hover states use `bg-meld-graysmoke/50`
* Icons are 20px (w-5 h-5) with 1.5 stroke weight
* Text is Inter Medium for active items, Regular for inactive

### Fragment Cards
Each fragment type has specific styling:
* Rounded corners with colored left border or dot indicator
* Type-specific background colors (subtle tints)
* Hover effects that slightly intensify the background
* Consistent padding and typography

## Interactive Patterns

### Micro-interactions
* **Hover**: Subtle color changes and 1px vertical lift
* **Focus**: Visible ring in `--meld-sand` color
* **Active**: Slight scale down (95%) with shadow
* **Loading**: Gentle pulse animation, never jarring

### Transitions
* Default: `transition-all duration-200 ease-in-out`
* Fast interactions: `duration-150`
* Page transitions: `duration-300`
* Never use transitions longer than 500ms

### Feedback
* Success: Subtle green tint with checkmark
* Error: `meld-ember` background with clear messaging
* Loading: Skeleton states in `meld-graysmoke`
* Empty states: Encouraging copy with gentle call-to-action

## Content Guidelines

### Voice & Tone
* **Warm but not chatty**: Professional warmth without being overly casual
* **Curious, not pushy**: Ask open-ended questions, provide space for thinking
* **Supportive, not directive**: Guide rather than command
* **Human, not robotic**: Natural language that feels conversational

### Messaging Patterns
* Use "reflection" instead of "entry" or "post"
* Prefer "explore" over "analyze" 
* Say "your story" instead of "your data"
* Use "insights" for AI-generated observations
* Frame as "conversations" not "chats"

## Module-Specific Guidelines

### Today Module
* Morning segment: Gentle check-in with open questions
* Reflection segment: Spacious textarea with helpful prompts
* Context dock: Relevant insights and memory fragments
* Consistent date navigation with tooltip previews

### Mentor Feed
* Coach insights appear as gentle suggestions, not commands
* Use warm, sage-like language that demonstrates listening
* Conversation starters should feel natural and contextual
* Never overwhelm with too many suggestions at once

### Fragments Module
* Color-code by type but maintain readability
* Allow easy filtering and search
* Show connections between fragments visually
* Edit in-place with smooth transitions

### Wins Vault
* Celebratory but not overwhelming
* Use `meld-sand` accent color for special wins
* Confetti animation for major achievements
* Timeline view with clear progression

### North-Star Module
* Use value-specific colors for different life areas
* Narrative structure with chapter-like sections
* Goal tracking with gentle progress indicators
* Encourage storytelling over simple data entry

## Accessibility

### Contrast
* Maintain WCAG AA standards (4.5:1) for all text
* Use `meld-ink` on `meld-canvas` for primary text (passes AAA)
* Test all color combinations, especially fragment types
* Provide high contrast mode using `meld-charcoal` variants

### Keyboard Navigation
* All interactive elements must be keyboard accessible
* Focus indicators use `ring-meld-sand` for visibility
* Tab order follows logical reading flow
* Provide skip links for major sections

### Screen Readers
* Use semantic HTML structure
* Provide descriptive alt text for all images
* Use ARIA labels for complex interactions
* Announce state changes (like fragment creation)

## Implementation Notes

### CSS Custom Properties
All colors are defined as CSS custom properties and should be referenced via Tailwind utilities or CSS variables. Never hardcode hex values.

### Component Library
Use shadcn/ui components as the foundation, but always apply MELD-specific styling via the design tokens.

### Responsive Behavior
* Sidebar collapses to icons on mobile
* Context dock moves to bottom sheet on smaller screens
* Fragment cards stack vertically below 768px
* Maintain sanctuary margins proportionally

### Performance
* Use CSS transforms for animations, not layout properties
* Implement lazy loading for fragment lists
* Optimize images with proper sizing and formats
* Use skeleton loading states for perceived performance
-->
