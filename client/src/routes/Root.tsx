import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { ContextType } from '~/common';
import {
  useAuthContext,
  useAssistantsMap,
  useAgentsMap,
  useFileMap,
  useSearchEnabled,
} from '~/hooks';
import {
  AgentsMapContext,
  AssistantsMapContext,
  FileMapContext,
  SetConvoProvider,
} from '~/Providers';
import TermsAndConditionsModal from '~/components/ui/TermsAndConditionsModal';
import { useUserTermsQuery, useGetStartupConfig } from '~/data-provider';
import { Nav, MobileNav } from '~/components/Nav';
import { Banner } from '~/components/Banners';
import Sidebar from '~/components/Navigation/Sidebar';
import HeaderBar from '~/components/Navigation/HeaderBar';
import { ContextDock } from '~/components/ContextDock/ContextDock';
import { useNavigation } from '~/hooks/Nav/useNavigation';

export default function Root() {
  const [showTerms, setShowTerms] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [navVisible, setNavVisible] = useState(() => {
    const savedNavVisible = localStorage.getItem('navVisible');
    return savedNavVisible !== null ? JSON.parse(savedNavVisible) : true;
  });

  // Phase 2: Use new navigation hook
  const { currentPage, selectedDate, navigateToPage, handleDateChange } = useNavigation();
  
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthContext();
  const assistantsMap = useAssistantsMap({ isAuthenticated });
  const agentsMap = useAgentsMap({ isAuthenticated });
  const fileMap = useFileMap({ isAuthenticated });

  const { data: config } = useGetStartupConfig();
  const { data: termsData } = useUserTermsQuery({
    enabled: isAuthenticated && config?.interface?.termsOfService?.modalAcceptance === true,
  });

  useSearchEnabled(isAuthenticated);

  useEffect(() => {
    if (termsData) {
      setShowTerms(!termsData.termsAccepted);
    }
  }, [termsData]);

  const handleAcceptTerms = () => {
    setShowTerms(false);
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
    logout('/login?redirect=false');
  };

  if (!isAuthenticated) {
    return null;
  }

  // For Phase 1, we'll use a hybrid approach:
  // - Apply MELD layout and styling
  // - Keep existing functionality working
  // - Show both old nav (hidden) and new MELD sidebar for comparison
  const useMeldLayout = true; // Feature flag for easy switching

  if (useMeldLayout) {
    return (
      <SetConvoProvider>
        <FileMapContext.Provider value={fileMap}>
          <AssistantsMapContext.Provider value={assistantsMap}>
            <AgentsMapContext.Provider value={agentsMap}>
              <Banner onHeightChange={setBannerHeight} />
              <div style={{ height: `calc(100dvh - ${bannerHeight}px)` }}>
                <div className="min-h-screen bg-meld-canvas">
                  {/* Four-zone sanctuary layout system */}
                  <div className="flex h-screen">
                    {/* Zone A: Left Sanctuary Margin (48px) */}
                    <div className="w-12 bg-meld-canvas" />
                    
                    {/* Zone B: Sidebar (240px) */}
                    <Sidebar 
                      className="w-60"
                      currentPage={currentPage}
                      onNavigate={navigateToPage}
                    />
                    
                    {/* Zone C: Main Content Area (flexible) */}
                    <main className="flex-1 flex flex-col min-w-0">
                      {/* Header */}
                      <HeaderBar 
                        currentPage={currentPage}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                      />
                      
                      {/* Mobile nav for small screens */}
                      <div className="md:hidden">
                        <MobileNav setNavVisible={setNavVisible} />
                      </div>
                      
                      {/* Content - Routes will render here */}
                      <div className="flex-1 overflow-hidden">
                        <Outlet context={{ navVisible, setNavVisible } satisfies ContextType} />
                      </div>
                    </main>
                    
                    {/* Zone D: Context Dock (280px) - Real ContextDock component */}
                    <ContextDock />
                    
                    {/* Zone A: Right Sanctuary Margin (48px) */}
                    <div className="w-12 bg-meld-canvas" />
                  </div>
                </div>
              </div>
              
              {/* Keep old nav hidden for now - can be restored if needed */}
              <div className="hidden">
                <Nav navVisible={navVisible} setNavVisible={setNavVisible} />
              </div>
              
            </AgentsMapContext.Provider>
            {config?.interface?.termsOfService?.modalAcceptance === true && (
              <TermsAndConditionsModal
                open={showTerms}
                onOpenChange={setShowTerms}
                onAccept={handleAcceptTerms}
                onDecline={handleDeclineTerms}
                title={config.interface.termsOfService.modalTitle}
                modalContent={config.interface.termsOfService.modalContent}
              />
            )}
          </AssistantsMapContext.Provider>
        </FileMapContext.Provider>
      </SetConvoProvider>
    );
  }

  // Fallback to original layout if MELD layout is disabled
  return (
    <SetConvoProvider>
      <FileMapContext.Provider value={fileMap}>
        <AssistantsMapContext.Provider value={assistantsMap}>
          <AgentsMapContext.Provider value={agentsMap}>
            <Banner onHeightChange={setBannerHeight} />
            <div className="flex" style={{ height: `calc(100dvh - ${bannerHeight}px)` }}>
              <div className="relative z-0 flex h-full w-full overflow-hidden">
                <Nav navVisible={navVisible} setNavVisible={setNavVisible} />
                <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
                  <MobileNav setNavVisible={setNavVisible} />
                  <Outlet context={{ navVisible, setNavVisible } satisfies ContextType} />
                </div>
              </div>
            </div>
          </AgentsMapContext.Provider>
          {config?.interface?.termsOfService?.modalAcceptance === true && (
            <TermsAndConditionsModal
              open={showTerms}
              onOpenChange={setShowTerms}
              onAccept={handleAcceptTerms}
              onDecline={handleDeclineTerms}
              title={config.interface.termsOfService.modalTitle}
              modalContent={config.interface.termsOfService.modalContent}
            />
          )}
        </AssistantsMapContext.Provider>
      </FileMapContext.Provider>
    </SetConvoProvider>
  );
}
