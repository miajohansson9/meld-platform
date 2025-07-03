import React from 'react';

const LogRoute: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-6 bg-meld-canvas">
      <div className="max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-lg border border-meld-graysmoke/20 p-8">
          <h1 className="font-serif text-3xl text-meld-ink mb-4">
            Activity Log 📊
          </h1>
          <p className="text-meld-ink/70 mb-6">
            Your chronological journey of growth and insights.
          </p>
          
          <div className="space-y-6">
            {/* Timeline View */}
            <div className="border-l-4 border-meld-sage pl-4">
              <h2 className="font-medium text-meld-ink mb-2">Timeline View</h2>
              <p className="text-sm text-meld-ink/60">
                🚧 Coming in Phase 7: Chronological activity view with pattern recognition
              </p>
            </div>
            
            {/* Insights Dock */}
            <div className="border-l-4 border-meld-ember pl-4">
              <h2 className="font-medium text-meld-ink mb-2">Insights & Patterns</h2>
              <p className="text-sm text-meld-ink/60">
                🚧 Coming in Phase 7: AI-powered pattern detection and trend analysis
              </p>
            </div>
            
            {/* Search & Filter */}
            <div className="border-l-4 border-meld-sand pl-4">
              <h2 className="font-medium text-meld-ink mb-2">Search & Filter</h2>
              <p className="text-sm text-meld-ink/60">
                🚧 Coming in Phase 7: Advanced filtering and search capabilities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogRoute; 