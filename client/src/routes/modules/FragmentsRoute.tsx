import React from 'react';

const FragmentsRoute: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-6 bg-meld-canvas">
      <div className="max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-lg border border-meld-graysmoke/20 p-8">
          <h1 className="font-serif text-3xl text-meld-ink mb-4">
            Fragments 🧩
          </h1>
          <p className="text-meld-ink/70 mb-6">
            Meaningful pieces of your story, organized and connected.
          </p>
          
          <div className="space-y-6">
            {/* Fragment Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border-l-4 border-fragment-quote bg-fragment-quote/5 p-4 rounded-r">
                <h3 className="font-medium text-meld-ink mb-1">Quotes</h3>
                <p className="text-xs text-meld-ink/60">Meaningful words that resonate</p>
              </div>
              <div className="border-l-4 border-fragment-insight bg-fragment-insight/5 p-4 rounded-r">
                <h3 className="font-medium text-meld-ink mb-1">Insights</h3>
                <p className="text-xs text-meld-ink/60">Personal discoveries and realizations</p>
              </div>
              <div className="border-l-4 border-fragment-question bg-fragment-question/5 p-4 rounded-r">
                <h3 className="font-medium text-meld-ink mb-1">Questions</h3>
                <p className="text-xs text-meld-ink/60">Important inquiries to explore</p>
              </div>
              <div className="border-l-4 border-fragment-todo bg-fragment-todo/5 p-4 rounded-r">
                <h3 className="font-medium text-meld-ink mb-1">Actions</h3>
                <p className="text-xs text-meld-ink/60">Steps to take forward</p>
              </div>
              <div className="border-l-4 border-fragment-general bg-fragment-general/5 p-4 rounded-r">
                <h3 className="font-medium text-meld-ink mb-1">General</h3>
                <p className="text-xs text-meld-ink/60">Other meaningful captures</p>
              </div>
            </div>
            
            {/* Coming Soon */}
            <div className="border-l-4 border-meld-sage pl-4">
              <h2 className="font-medium text-meld-ink mb-2">Fragment Management</h2>
              <p className="text-sm text-meld-ink/60">
                🚧 Coming in Phase 5: Search, filtering, and visual connection mapping
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FragmentsRoute; 