import React from 'react';
import { TodayModule } from '~/components/Today/TodayModule';

const TodayRoute: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-6 bg-meld-canvas">
      <TodayModule />
    </div>
  );
};

export default TodayRoute; 