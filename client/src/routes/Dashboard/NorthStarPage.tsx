import React from 'react';
import { NorthStarModule, ChronicleCanvas, HeaderBar } from '~/components/figma';

export default function NorthStarPage() {
  return (
    <div className="h-full flex flex-col h-screen">
      <HeaderBar />
      <div className="h-full max-h-full overflow-y-auto">
        <NorthStarModule />
      </div>
    </div>
  );
} 