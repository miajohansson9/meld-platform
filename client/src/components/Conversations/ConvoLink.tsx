import React from 'react';
import { cn } from '~/utils';

interface ConvoLinkProps {
  isActiveConvo: boolean;
  title: string | null;
  onRename: () => void;
  isSmallScreen: boolean;
  localize: (key: any, options?: any) => string;
  children?: React.ReactNode;
}

const ConvoLink: React.FC<ConvoLinkProps> = ({
  isActiveConvo,
  title,
  onRename,
  isSmallScreen,
  localize,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex grow items-center gap-3 overflow-hidden rounded-lg',
        isActiveConvo ? '' : '',
      )}
      title={title ?? undefined}
      aria-current={isActiveConvo ? 'page' : undefined}
      data-active={isActiveConvo}
      style={{ width: '100%' }}
    >
      {children}
      <div
        className="relative flex-1 grow overflow-hidden whitespace-nowrap"
        style={{ textOverflow: 'clip' }}
        onDoubleClick={(e) => {
          if (isSmallScreen) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          onRename();
        }}
        role="button"
        aria-label={isSmallScreen ? undefined : localize('com_ui_double_click_to_rename')}
      >
        {title || localize('com_ui_untitled')}
      </div>

    </div>
  );
};

export default ConvoLink;
