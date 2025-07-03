import React from 'react';
import { WinsVaultModule, HeaderBar } from '~/components/figma';

export default function WinsVaultPage() {
  return (
    <div className="h-full flex flex-col h-screen">
      <HeaderBar />
      <div className="h-full max-h-full overflow-y-auto">
        <WinsVaultModule />
      </div>
    </div>
  );
} 