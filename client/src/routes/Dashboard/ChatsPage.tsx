import React from 'react';
import { ChatsModule, HeaderBar } from '~/components/figma';

export default function ChatsPage() {
  return (
    <div className="h-full flex flex-col h-screen">
      <HeaderBar />
      <div className="h-full max-h-full overflow-y-auto">
        {/* Main Chats Content */}
        <ChatsModule />
      </div>
    </div>
  );
} 