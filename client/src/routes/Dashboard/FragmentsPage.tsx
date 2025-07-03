import React from 'react';
import { FragmentsModule, HeaderBar } from '~/components/figma';

export default function FragmentsPage() {
  return (
    <div className="h-full flex flex-col h-screen">
      <HeaderBar />
      <div className="h-full max-h-full overflow-y-auto">
        <FragmentsModule />
      </div>
    </div>
  );
} 