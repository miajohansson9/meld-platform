import React, { useState } from 'react';
import { ChatsModule, HeaderBar } from '~/components/figma';

export default function ChatsPage() {
  const [currentChatInfo, setCurrentChatInfo] = useState<{
    title: string;
    contextChips: string[];
    isPinned: boolean;
  } | null>(null);
  const [chatsModuleRef, setChatsModuleRef] = useState<{
    toggleAIProfile: () => void;
    handleThreadAction: (action: string) => void;
  } | null>(null);

  const handleChatInfoChange = (chatInfo: {
    title: string;
    contextChips: string[];
    isPinned: boolean;
  } | null) => {
    setCurrentChatInfo(chatInfo);
  };

  const handleShowAIProfile = () => {
    chatsModuleRef?.toggleAIProfile();
  };

  const handleThreadAction = (action: string) => {
    chatsModuleRef?.handleThreadAction(action);
  };

  return (
    <div className="h-full flex flex-col h-screen">
      <HeaderBar 
        chatInfo={currentChatInfo ? {
          ...currentChatInfo,
          onShowAIProfile: handleShowAIProfile,
          onThreadAction: handleThreadAction
        } : undefined}
      />
      <div className="h-full max-h-full overflow-y-auto">
        {/* Main Chats Content */}
        <ChatsModule 
          onChatInfoChange={handleChatInfoChange}
          onRef={setChatsModuleRef}
        />
      </div>
    </div>
  );
} 