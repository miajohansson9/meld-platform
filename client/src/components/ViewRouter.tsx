import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigation } from '~/hooks/Nav/useNavigation';

// Route Components
import TodayRoute from '~/routes/modules/TodayRoute';
import LogRoute from '~/routes/modules/LogRoute';
import MentorFeedRoute from '~/routes/modules/MentorFeedRoute';
import FragmentsRoute from '~/routes/modules/FragmentsRoute';
import NorthStarRoute from '~/routes/modules/NorthStarRoute';
import WinsVaultRoute from '~/routes/modules/WinsVaultRoute';
import ProfileRoute from '~/routes/modules/ProfileRoute';
import MentorChatsRoute from '~/routes/modules/MentorChatsRoute';

interface ViewRouterProps {
  className?: string;
}

const LoadingView: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-meld-canvas">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-meld-sand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-meld-ink/60 text-sm">Loading...</p>
    </div>
  </div>
);

const NotFoundView: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-meld-canvas">
    <div className="text-center max-w-md">
      <h1 className="font-serif text-3xl text-meld-ink mb-4">Page Not Found</h1>
      <p className="text-meld-ink/70 mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button 
        onClick={() => window.location.href = '/today'}
        className="bg-meld-sand hover:bg-meld-sand/80 text-meld-ink px-6 py-2 rounded-lg transition-colors"
      >
        Return to Today
      </button>
    </div>
  </div>
);

export const ViewRouter: React.FC<ViewRouterProps> = ({ className }) => {
  const { currentPage, isLoading } = useNavigation();
  const location = useLocation();

  // Show loading state during navigation
  if (isLoading) {
    return <LoadingView />;
  }

  // Route-based component rendering
  const renderView = () => {
    switch (currentPage) {
      case 'today':
        return <TodayRoute />;
      case 'log':
        return <LogRoute />;
      case 'coach-feed':
        return <MentorFeedRoute />;
      case 'fragments':
        return <FragmentsRoute />;
      case 'north-star':
        return <NorthStarRoute />;
      case 'library':
        return <WinsVaultRoute />;
      case 'me':
        return <ProfileRoute />;
      default:
        return <NotFoundView />;
    }
  };

  // Context dock content based on current view
  const getContextDockContent = () => {
    switch (currentPage) {
      case 'today':
        return (
          <div className="p-4">
            <h3 className="font-medium text-meld-ink mb-2">Today's Context</h3>
            <p className="text-sm text-meld-ink/60">
              🚧 Phase 4: Recent reflections and patterns
            </p>
          </div>
        );
      case 'coach-feed':
        return (
          <div className="p-4">
            <h3 className="font-medium text-meld-ink mb-2">Memory Insights</h3>
            <p className="text-sm text-meld-ink/60">
              🚧 Phase 5: Contextual memory fragments
            </p>
          </div>
        );
      case 'fragments':
        return (
          <div className="p-4">
            <h3 className="font-medium text-meld-ink mb-2">Fragment Connections</h3>
            <p className="text-sm text-meld-ink/60">
              🚧 Phase 5: Related fragments and connections
            </p>
          </div>
        );
      default:
        return (
          <div className="p-4">
            <h3 className="font-medium text-meld-ink mb-2">Context</h3>
            <p className="text-sm text-meld-ink/60">
              Contextual information will appear here
            </p>
          </div>
        );
    }
  };

  // Determine if context dock should be shown for current route
  const shouldShowContextDock = () => {
    // For now, show context dock for specific routes
    return ['today', 'coach-feed', 'fragments', 'log'].includes(currentPage);
  };

  return (
    <div className={`flex-1 flex ${className || ''}`}>
      {/* Main View */}
      <div className="flex-1 min-w-0">
        <Suspense fallback={<LoadingView />}>
          {renderView()}
        </Suspense>
      </div>

      {/* Context Dock - Conditional */}
      {shouldShowContextDock() && (
        <aside className="w-70 bg-meld-canvas border-l border-meld-graysmoke/20 flex-shrink-0">
          <div className="h-full">
            {getContextDockContent()}
          </div>
        </aside>
      )}
    </div>
  );
};

export default ViewRouter; 