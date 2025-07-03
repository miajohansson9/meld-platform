import { useParams, Navigate } from 'react-router-dom';

const LegacyChatRedirect: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  const destination = conversationId 
    ? `/mentor/chats/${conversationId}`
    : '/mentor/chats/new';
    
  return <Navigate to={destination} replace={true} />;
};

export default LegacyChatRedirect; 