import { memo } from 'react';
import HoverCardSettings from '~/components/Nav/SettingsTabs/HoverCardSettings';
import { useLocalize } from '~/hooks';

function Commands() {
  const localize = useLocalize();

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium text-text-primary">
          {localize('com_nav_chat_commands')}
        </h3>
        <HoverCardSettings side="bottom" text="com_nav_chat_commands_info" />
      </div>
      <div className="flex flex-col gap-3 text-sm text-text-primary">
        <div className="text-text-secondary">
          Command toggles have been disabled for a cleaner chat experience.
        </div>
      </div>
    </div>
  );
}

export default memo(Commands);
