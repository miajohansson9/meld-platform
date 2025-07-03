import React from 'react';

const ProfileRoute: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-6 bg-meld-canvas">
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-lg border border-meld-graysmoke/20 p-8">
          <h1 className="font-serif text-3xl text-meld-ink mb-4">
            Profile & Settings ⚙️
          </h1>
          <p className="text-meld-ink/70 mb-6">
            Manage your account, preferences, and data.
          </p>
          
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="border-l-4 border-meld-sage pl-4">
              <h2 className="font-medium text-meld-ink mb-2">Personal Information</h2>
              <p className="text-sm text-meld-ink/60">
                🚧 Coming in Phase 7: User profile management and preferences
              </p>
            </div>
            
            {/* Account Settings */}
            <div className="border-l-4 border-meld-ember pl-4">
              <h2 className="font-medium text-meld-ink mb-2">Account Settings</h2>
              <p className="text-sm text-meld-ink/60">
                🚧 Coming in Phase 7: Security, notifications, and privacy settings
              </p>
            </div>
            
            {/* Data Management */}
            <div className="border-l-4 border-meld-sand pl-4">
              <h2 className="font-medium text-meld-ink mb-2">Data & Export</h2>
              <p className="text-sm text-meld-ink/60">
                🚧 Coming in Phase 7: Export your journey, backup and data management
              </p>
            </div>
            
            {/* Support */}
            <div className="border-l-4 border-meld-graysmoke pl-4">
              <h2 className="font-medium text-meld-ink mb-2">Help & Support</h2>
              <p className="text-sm text-meld-ink/60">
                🚧 Coming in Phase 7: Documentation, guides, and support resources
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileRoute; 