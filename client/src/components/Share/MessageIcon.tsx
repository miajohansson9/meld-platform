import { useMemo } from 'react';
import type { TMessage, Assistant, Agent } from 'librechat-data-provider';
import type { TMessageProps } from '~/common';
import MessageEndpointIcon from '../Endpoints/MessageEndpointIcon';
import ConvoIconURL from '~/components/Endpoints/ConvoIconURL';
import { getIconEndpoint } from '~/utils';
import { UserIcon } from '../svg';
import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';

export default function MessageIcon(
  props: Pick<TMessageProps, 'message' | 'conversation'> & {
    assistant?: false | Assistant;
    agent?: false | Agent;
  },
) {
  const { message, conversation, assistant, agent } = props;

  // Generate Meld AI avatar with same styling as user avatar but red background
  const meldAiAvatar = useMemo(() => {
    const avatar = createAvatar(initials, {
      seed: 'Meld AI',
      fontFamily: ['Verdana'],
      fontSize: 36,
      backgroundColor: ['BD3C28'], // Use the rust red color
      textColor: ['ffffff'], // White text
    });

    try {
      return avatar.toDataUri();
    } catch (error) {
      console.error('Failed to generate Meld AI avatar:', error);
      return '';
    }
  }, []);

  const messageSettings = useMemo(
    () => ({
      ...(conversation ?? {}),
      ...({
        ...message,
        iconURL: message?.iconURL ?? '',
      } as TMessage),
    }),
    [conversation, message],
  );

  const iconURL = messageSettings.iconURL ?? '';
  let endpoint = messageSettings.endpoint;
  endpoint = getIconEndpoint({ endpointsConfig: undefined, iconURL, endpoint });
  const assistantName = (assistant ? assistant.name : '') ?? '';
  const assistantAvatar = (assistant ? assistant.metadata?.avatar : '') ?? '';
  const agentName = (agent ? agent.name : '') ?? '';
  const agentAvatar = (agent ? agent?.avatar?.filepath : '') ?? '';
  const avatarURL = useMemo(() => {
    let result = '';
    if (assistant) {
      result = assistantAvatar;
    } else if (agent) {
      result = agentAvatar;
    }
    return result;
  }, [assistant, agent, assistantAvatar, agentAvatar]);
  if (message?.isCreatedByUser !== true && iconURL && iconURL.includes('http')) {
    return (
      <ConvoIconURL
        iconURL={iconURL}
        modelLabel={messageSettings.chatGptLabel ?? messageSettings.modelLabel ?? ''}
        context="message"
        assistantAvatar={assistantAvatar}
        assistantName={assistantName}
        agentAvatar={agentAvatar}
        agentName={agentName}
      />
    );
  }

  if (message?.isCreatedByUser === true) {
    return (
      <div
        style={{
          backgroundColor: 'rgb(121, 137, 255)',
          width: '20px',
          height: '20px',
          boxShadow: 'rgba(240, 246, 252, 0.1) 0px 0px 0px 1px',
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-sm p-1 text-white"
      >
        <UserIcon />
      </div>
    );
  }

  // Show Meld AI avatar with same styling as user avatars
  return (
    <div
      title="Meld AI"
      style={{
        width: '28.8px',
        height: '28.8px',
      }}
      className="relative flex items-center justify-center"
    >
      <img
        className="rounded-full"
        src={meldAiAvatar}
        alt="Meld AI"
        style={{ height: '28.8px', width: '28.8px' }}
      />
    </div>
  );
}
