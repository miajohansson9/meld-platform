import { useCallback } from 'react';
import { useAuthContext } from '~/hooks';

interface MeldLandingProps {
  centerFormOnLanding: boolean;
}

export default function Landing({ centerFormOnLanding }: MeldLandingProps) {
  const { user } = useAuthContext();

  // Get time-aware greeting
  const getGreeting = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const userName = user?.name || '';

    if (hours >= 5 && hours < 12) {
      return `Good morning${userName ? ', ' + userName : ''}!`;
    } else if (hours >= 12 && hours < 17) {
      return `Good afternoon${userName ? ', ' + userName : ''}!`;
    } else {
      return `Good evening${userName ? ', ' + userName : ''}!`;
    }
  }, [user]);

  return (
    <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto px-6 py-8">
      {/* Simple greeting */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-light text-theme-charcoal">
          {getGreeting()}
        </h1>
      </div>
    </div>
  );
}
