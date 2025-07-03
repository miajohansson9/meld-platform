# Figma Component Integration Guide

## Quick Start
This folder contains placeholder components that match your Figma design. Simply replace each placeholder with your exported Figma component to integrate the new design.

## Component Mapping

### 1. Navigation & Layout
- `Sidebar.tsx` - Main navigation sidebar (replaces current Nav.tsx)
- `HeaderBar.tsx` - Dashboard header bar  
- `FloatingActionButton.tsx` - Global floating action button

### 2. Dashboard Modules
- `TodayModule.tsx` - Today dashboard main content
- `LogModule.tsx` - Log timeline view
- `ChatsModule.tsx` - New chat interface
- `FragmentsModule.tsx` - Fragments management
- `NorthStarModule.tsx` - North Star goals and planning
- `WinsVaultModule.tsx` - Wins and achievements tracker

### 3. Sidebar Panels
- `CoachFeedModule.tsx` - AI coach insights panel
- `ContextDock.tsx` - Context information for chats
- `InsightDock.tsx` - Pattern recognition and insights

### 4. Segments & Cards
- `MorningSegment.tsx` - Morning planning segment
- `ReflectionSegment.tsx` - Evening reflection segment
- `EntryCard.tsx` - Individual log/journal entries
- `ChronicleCanvas.tsx` - Visual timeline/canvas

### 5. Specialized Components
- `LogHeaderBar.tsx` - Header specific to log pages

## Integration Steps

### Step 1: Replace Components
1. Copy your Figma-exported component files
2. Replace the corresponding placeholder files in this folder
3. Keep the same filename and export structure

### Step 2: Update Imports (if needed)
If your components have different export patterns, update the imports in:
- `client/src/components/figma/index.ts`
- Individual dashboard pages in `client/src/routes/Dashboard/`

### Step 3: Test Integration
- Visit `/today` to see the Today module
- Visit `/log` for the Log view
- Visit `/chats` for the new chat interface
- Visit `/fragments` for fragments
- Visit `/library/north-star` for North Star
- Visit `/library/wins-vault` for Wins Vault

## Current Route Structure

```
/dashboard (redirects to /today)
├── /today - Today dashboard with coach feed
├── /log - Log timeline with insights
├── /chats - New modular chat interface  
├── /fragments - Fragment management
├── /library/north-star - North Star planning
└── /library/wins-vault - Wins tracking
```

**Preserved Routes:**
- `/c/new` - Original chat interface (unchanged)
- `/c/:conversationId` - Individual conversations (unchanged)

## Layout Structure

### Dashboard Layout
```
<DashboardLayout>
  <Sidebar /> (Your Figma sidebar)
  <MainContent>
    <HeaderBar /> (Page-specific header)
    <PageContent /> (Module-specific content)
  </MainContent>
  <FloatingActionButton />
</DashboardLayout>
```

### Page-Specific Layouts

**Today Page:**
```
<HeaderBar />
<Flex>
  <TodayModule + MorningSegment + ReflectionSegment />
  <CoachFeedModule /> (right sidebar)
</Flex>
```

**Log Page:**
```
<LogHeaderBar />
<Flex>
  <LogModule />
  <InsightDock /> (right sidebar)
</Flex>
```

**Chats Page:**
```
<HeaderBar />
<Flex>
  <ChatsModule />
  <ContextDock /> (right sidebar)
</Flex>
```

## Data Integration

### Existing APIs Available
- `useConversationsInfiniteQuery` - Chat history
- `useGetMessagesByConvoId` - Message content
- `useAuthContext` - User authentication
- `useChatContext` - Current conversation state

### State Management
- Recoil atoms available for state
- React Query for data fetching
- Existing providers: ChatContext, FileMapContext, etc.

## Styling

### Theme Variables Available
- `bg-theme-cream` - Primary background
- `text-theme-charcoal` - Primary text
- `theme-sage` - Accent color
- Standard Tailwind classes

### Component Props
Each placeholder includes a TypeScript interface. Update these interfaces to match your component's props when replacing.

## Troubleshooting

### Import Errors
If you get import errors, check:
1. Component export structure matches placeholder
2. Index.ts file includes new exports
3. TypeScript interfaces are updated

### Styling Issues
- Use existing theme variables where possible
- Extend CSS variables in globals.css if needed
- Maintain responsive breakpoints

### State Management
- Connect to existing React Query hooks for data
- Use existing Recoil atoms for state
- Preserve authentication checks

## Development Workflow

1. **Replace one component at a time** - Start with Sidebar.tsx
2. **Test each replacement** - Visit corresponding route
3. **Update props/interfaces** - Match your component's API
4. **Connect data sources** - Wire up existing APIs
5. **Style integration** - Ensure consistent theming

## Switching Between Interfaces

- **New Dashboard**: Visit `/dashboard`
- **Original Chat**: Visit `/c/new` (preserved for compatibility)
- The current sidebar navigation in `/c/new` is preserved for later integration into the chats module 

## ✅ **Solved: Preview vs Full View Without Code Duplication**

### 🔧 **Solution: Component Variants Pattern**

I implemented a clean **single component with variant support** approach:

```jsx
// Today Page - Compact Preview (2 items max)
<CoachFeedModule variant="preview" maxItems={2} />

// Mentor Feed Page - Full Detailed View  
<CoachFeedModule variant="full" />
```

### 🏗️ **Architecture Benefits**:

1. **✅ No Code Duplication**: Single component handles both layouts
2. **✅ Shared Logic**: All state management, handlers, and data logic unified
3. **✅ Clean API**: Simple prop-based configuration
4. **✅ Type Safety**: TypeScript interface ensures correct usage
5. **✅ Maintainable**: Changes in logic automatically apply to both views

### 🎨 **Preview Mode Features**:

- **Compact Header**: Smaller title, inline cadence control
- **Limited Cards**: Shows only `maxItems` (2 for Today page)
- **Condensed Cards**: Smaller icons, truncated content (`line-clamp-2`)
- **Simplified Actions**: Smaller buttons, essential actions only
- **Streamlined Layout**: Tighter spacing, less visual weight

### 🚀 **Full Mode Features**:

- **Complete Header**: Full filters, search, bulk actions
- **All Cards**: Shows complete feed with pagination
- **Detailed Cards**: Full content, metadata, all action options
- **Advanced Features**: Multi-select, keyboard shortcuts, dense view toggle

### 📝 **Usage Examples**:

```jsx
<code_block_to_apply_changes_from>
```

This approach gives you **maximum flexibility** while keeping the codebase **DRY and maintainable**. The same component intelligently adapts its layout and functionality based on the variant, providing the perfect preview experience on Today and full power on the dedicated Mentor Feed page! 