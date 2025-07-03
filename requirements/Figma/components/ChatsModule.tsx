import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus,
  MoreHorizontal,
  Star,
  Send,
  Paperclip,
  Mic,
  Hash,
  Calendar,
  Target,
  FileText,
  Pin,
  Download,
  VolumeX,
  ThumbsUp,
  Archive,
  Search,
  Atom,
  Bookmark,
  ChevronDown,
  ChevronRight,
  User,
  Bot
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from './ui/utils';
import { toast } from 'sonner';

interface ChatThread {
  id: string;
  title: string;
  lastMessage: string;
  lastSender: 'user' | 'ai';
  lastActivity: string;
  unread: boolean;
  isPinned: boolean;
  contextChips: string[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  reactions?: string[];
  sourceNote?: string;
}

interface ContextItem {
  id: string;
  type: 'fragment' | 'event' | 'value';
  title: string;
  content: string;
  action?: string;
}

const mockThreads: ChatThread[] = [
  {
    id: '1',
    title: 'Presentation Debrief',
    lastMessage: 'You nailed the story arc...',
    lastSender: 'ai',
    lastActivity: '2m',
    unread: true,
    isPinned: false,
    contextChips: ['#interview', 'Fragment: Speak with conviction', 'Value: Growth']
  },
  {
    id: '2',
    title: 'North-Star Review',
    lastMessage: 'Let\'s revisit your values...',
    lastSender: 'ai',
    lastActivity: '3d',
    unread: false,
    isPinned: false,
    contextChips: ['Value: Growth', 'Fragment: Leadership style']
  },
  {
    id: '3',
    title: 'Weekend Planning',
    lastMessage: 'What are your priorities?',
    lastSender: 'user',
    lastActivity: '1w',
    unread: false,
    isPinned: true,
    contextChips: ['#planning']
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'ai',
    content: 'Hi! I noticed you have a presentation coming up tomorrow. How are you feeling about it?',
    timestamp: '2:14 PM',
    sourceNote: 'Pulled from your Calendar event'
  },
  {
    id: '2',
    sender: 'user',
    content: 'A bit nervous, but I think I\'m prepared. I\'ve been working on speaking with more conviction.',
    timestamp: '2:15 PM'
  },
  {
    id: '3',
    sender: 'ai',
    content: 'That\'s excellent self-awareness.\n\n**What specifically about your delivery feels strongest right now?** And what would you like to practice one more time?',
    timestamp: '2:15 PM',
    sourceNote: 'Based on your Fragment: "Speak with conviction"'
  },
  {
    id: '4',
    sender: 'user',
    content: 'I feel good about my opening and the main story arc. Maybe I should run through the Q&A scenarios once more.',
    timestamp: '2:18 PM',
    reactions: ['👍']
  }
];

const mockContextByCategory = {
  fragments: [
    {
      id: '1',
      type: 'fragment' as const,
      title: 'Speak with conviction',
      content: 'Remember to use pauses effectively and make eye contact. Your ideas are valuable.',
      action: 'Add to chat'
    }
  ],
  events: [
    {
      id: '2',
      type: 'event' as const,
      title: 'Presentation',
      content: 'Tomorrow • 10:00 AM',
      action: 'View details'
    }
  ],
  values: [
    {
      id: '3',
      type: 'value' as const,
      title: 'Growth',
      content: 'Embracing challenges as opportunities to learn and improve',
      action: 'Open Map'
    }
  ]
};

export function ChatsModule() {
  const [selectedThread, setSelectedThread] = useState<string>('1');
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showAIProfile, setShowAIProfile] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    fragments: true,
    events: true,
    values: true
  });
  const [contextRailFocused, setContextRailFocused] = useState(false);
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextRailRef = useRef<HTMLDivElement>(null);

  const currentThread = mockThreads.find(t => t.id === selectedThread);
  const MAX_CHARS = 500;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mockMessages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘⌥C toggles Context Rail focus
      if (e.metaKey && e.altKey && e.key === 'c') {
        e.preventDefault();
        setContextRailFocused(!contextRailFocused);
        if (!contextRailFocused) {
          contextRailRef.current?.focus();
        } else {
          textareaRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextRailFocused]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    // Simulate sending message
    setIsTyping(true);
    setMessageText('');
    setCharCount(0);
    setTypingStartTime(Date.now());
    
    // Show typing indicator after 300ms
    const typingTimeout = setTimeout(() => {
      // Show "Still thinking" toast if > 6s
      setTimeout(() => {
        if (isTyping) {
          toast.info("Still thinking—thanks for your patience.", { duration: 3000 });
        }
      }, 5700); // 6s - 300ms
    }, 300);
    
    // Simulate AI response after delay
    setTimeout(() => {
      setIsTyping(false);
      setTypingStartTime(null);
      clearTimeout(typingTimeout);
      toast.success('Message sent', { duration: 1500 });
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Arrow-Up in composer within 2s edits last message
    if (e.key === 'ArrowUp' && messageText === '' && typingStartTime && (Date.now() - typingStartTime) < 2000) {
      e.preventDefault();
      // In real app, would populate with last user message for editing
      toast.info('Edit last message feature', { duration: 1500 });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessageText(text);
    setCharCount(text.length);
    
    if (!typingStartTime) {
      setTypingStartTime(Date.now());
    }
  };

  const handleContextAction = (item: ContextItem) => {
    if (item.action === 'Add to chat') {
      setMessageText(prev => prev + `"${item.content}" `);
      textareaRef.current?.focus();
    }
    toast.success(`${item.action} completed`, { duration: 1500 });
  };

  const handleReaction = (messageId: string, sender: 'user' | 'ai', reaction: string) => {
    if (reaction === '🔖') {
      toast.success('Saved to Fragments', { duration: 1500 });
    } else {
      toast.success(`${reaction} reaction added`, { duration: 1500 });
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category as keyof typeof prev]
    }));
  };

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-meld-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-8 h-8 text-meld-sage" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-xl text-meld-ink mb-3">
          Need a sounding board?
        </h3>
        <p className="text-meld-ink/70 leading-relaxed mb-4">
          Start a chat and I'll respond instantly.
        </p>
        <Button className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>
  );

  if (mockThreads.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-8 py-6 border-b border-sidebar-border">
          <h1 className="font-serif text-2xl text-meld-ink">Chats</h1>
          <p className="text-meld-ink/60 mt-1">Your mentorship conversations</p>
        </div>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      {/* Zone A: Thread List (280px) */}
      <div className="w-70 border-r border-sidebar-border flex flex-col bg-white">
        {/* Thread List Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-meld-ink">Chats</h2>
            {/* New Chat Pill Button */}
            <Button
              size="sm"
              className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink px-3 py-2 h-8 rounded-full"
              title="Instant Help Chat"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-meld-ink/40" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 bg-meld-graysmoke/50 border border-transparent rounded-lg text-sm focus:outline-none focus:border-meld-sand transition-colors"
            />
          </div>
        </div>

        {/* Thread List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {mockThreads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors mb-2 group relative",
                  selectedThread === thread.id 
                    ? "bg-meld-sand/20 border border-meld-sand/30" 
                    : "hover:bg-meld-graysmoke/30"
                )}
                onClick={() => setSelectedThread(thread.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {thread.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                    <h3 className="font-medium text-meld-ink text-sm truncate">
                      {thread.title}
                    </h3>
                    {thread.isPinned && (
                      <Star className="w-3 h-3 text-meld-sand fill-current flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-meld-ink/60 flex-shrink-0 ml-2">
                    {thread.lastActivity}
                  </span>
                </div>
                
                {/* You • AI preview with sender indicator */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-meld-sand/30 rounded-full flex items-center justify-center">
                        <User className="w-2.5 h-2.5 text-meld-ink/60" />
                      </div>
                      <span className="text-xs font-medium text-meld-ink/70">•</span>
                      <div className="w-4 h-4 bg-meld-sage/30 rounded-full flex items-center justify-center">
                        <Bot className="w-2.5 h-2.5 text-meld-ink/60" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-meld-ink/50 italic truncate">
                    {thread.lastSender === 'user' ? 'You: ' : 'AI: '}{thread.lastMessage}
                  </p>
                </div>
                
                {/* Context chips preview */}
                <div className="flex gap-1 flex-wrap">
                  {thread.contextChips.slice(0, 2).map((chip, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs px-2 py-0 h-5 bg-meld-graysmoke/50 text-meld-ink/60 border-meld-ink/20"
                    >
                      {chip.length > 15 ? chip.substring(0, 15) + '...' : chip}
                    </Badge>
                  ))}
                  {thread.contextChips.length > 2 && (
                    <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                      +{thread.contextChips.length - 2}
                    </Badge>
                  )}
                </div>

                {/* Hover Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <VolumeX className="w-4 h-4 mr-2" />
                        Mute thread
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Zone B: Conversation Canvas (680px) */}
      <div className="flex-1 max-w-2xl flex flex-col bg-white">
        {/* Conversation Header */}
        {currentThread && (
          <div className="px-6 py-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* AI Avatar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIProfile(!showAIProfile)}
                  className="p-2 h-auto hover:bg-meld-sage/10"
                  title="AI Profile & Privacy"
                >
                  <Atom className="w-5 h-5 text-meld-sage" strokeWidth={1.5} />
                </Button>
                
                <h1 className="font-serif text-xl text-meld-ink">
                  {currentThread.title}
                </h1>
                
                {currentThread.isPinned && (
                  <Star className="w-5 h-5 text-meld-sand fill-current" />
                )}
              </div>
              
              {/* Always visible kebab with tooltip */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    title="Thread options (⌘.)"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pin className="w-4 h-4 mr-2" />
                    {currentThread.isPinned ? 'Unpin' : 'Pin'} chat
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Mute for 7 days
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Context Chips */}
            <div className="flex gap-2 flex-wrap">
              {currentThread.contextChips.map((chip, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs bg-meld-graysmoke/50 hover:bg-meld-sand/20 text-meld-ink/70 hover:text-meld-ink"
                >
                  {chip.startsWith('#') ? (
                    <Hash className="w-3 h-3 mr-1" />
                  ) : chip.startsWith('Fragment') ? (
                    <FileText className="w-3 h-3 mr-1" />
                  ) : (
                    <Target className="w-3 h-3 mr-1" />
                  )}
                  {chip}
                </Button>
              ))}
            </div>

            {/* AI Profile Panel */}
            {showAIProfile && (
              <div className="mt-4 p-4 bg-meld-sage/10 rounded-lg border border-meld-sage/20">
                <h4 className="font-medium text-meld-ink mb-2">AI Coach Profile</h4>
                <p className="text-sm text-meld-ink/70 mb-3">
                  Your personal AI mentor, trained on evidence-based coaching principles and your personal development data.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    Privacy Policy
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Data Usage
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4 max-w-[560px] mx-auto">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex group",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "px-4 py-3 rounded-lg relative max-w-full",
                    message.sender === 'user'
                      ? "bg-transparent border border-meld-sand text-meld-ink focus-within:ring-2 focus-within:ring-meld-sand"
                      : message.sender === 'ai'
                      ? "bg-[#F6F6F3] text-meld-ink"
                      : "bg-meld-graysmoke/50 text-meld-ink/70 text-center text-sm"
                  )}
                  tabIndex={0}
                >
                  <div className="mb-2">
                    {message.content.includes('**') ? (
                      <div>
                        {message.content.split('\n').map((line, lineIdx) => (
                          <div key={lineIdx} className={lineIdx > 0 ? "mt-2" : ""}>
                            {line.split('**').map((part, idx) => 
                              idx % 2 === 0 ? (
                                <span key={idx}>{part}</span>
                              ) : (
                                <strong key={idx} className="font-serif">{part}</strong>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  
                  {/* Timestamp - smaller and grey-60 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-meld-ink/60" style={{ fontSize: '11px' }}>
                      {message.timestamp}
                    </span>
                    {message.sender === 'user' && message.reactions && (
                      <div className="flex gap-1">
                        {message.reactions.map((reaction, idx) => (
                          <span key={idx} className="hover:scale-110 transition-transform cursor-pointer">
                            {reaction}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Source Note as Badge */}
                  {message.sourceNote && (
                    <Badge 
                      variant="outline" 
                      className="mt-2 text-xs bg-meld-sand/20 text-meld-ink/70 border-meld-sand"
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      {message.sourceNote}
                    </Badge>
                  )}

                  {/* Reaction buttons on hover for BOTH senders */}
                  <div className={cn(
                    "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
                    message.sender === 'user' ? "-left-12" : "-right-12"
                  )}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm"
                      onClick={() => handleReaction(message.id, message.sender, '👍')}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm"
                      onClick={() => handleReaction(message.id, message.sender, '🔖')}
                    >
                      <Bookmark className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator with enhanced visibility */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#F6F6F3] px-4 py-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-meld-ink/40 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-meld-ink/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-meld-ink/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Composer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Type a thought..."
                value={messageText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                className="min-h-[44px] max-h-32 resize-none pr-16 border-meld-ink/20 focus:border-meld-sand"
                rows={1}
                maxLength={MAX_CHARS}
              />
              
              {/* Attachment & Voice Buttons */}
              <div className="absolute right-2 top-2 flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Paperclip className="w-4 h-4 text-meld-ink/60" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Mic className="w-4 h-4 text-meld-ink/60" />
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className="bg-meld-sand hover:bg-meld-sand/90 text-meld-ink px-6"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-meld-ink/50">
              Press Enter to send, Shift+Enter for new line • Try /summarise or /task
            </p>
            {charCount > 120 && (
              <span className={cn(
                "text-xs",
                charCount > MAX_CHARS * 0.8 ? "text-meld-ember" : "text-meld-ink/60"
              )}>
                {charCount}/{MAX_CHARS}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Zone C: Context Rail (240px) */}
      <div 
        ref={contextRailRef}
        className={cn(
          "w-60 border-l border-sidebar-border bg-meld-graysmoke/20 flex flex-col",
          contextRailFocused && "ring-2 ring-meld-sand ring-inset"
        )}
        tabIndex={0}
      >
        <div className="p-4 border-b border-sidebar-border">
          <h3 className="font-medium text-meld-ink mb-1">Context</h3>
          <p className="text-xs text-meld-ink/60">Context for this thread</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Fragments Category */}
            <Collapsible 
              open={expandedCategories.fragments} 
              onOpenChange={() => toggleCategory('fragments')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="font-medium text-sm text-meld-ink">Fragments</span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-meld-ink/60 transition-transform",
                  !expandedCategories.fragments && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {mockContextByCategory.fragments.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-3 border border-meld-ink/10">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-meld-rose" />
                      <span className="font-medium text-sm text-meld-ink">{item.title}</span>
                    </div>
                    
                    <p className="text-sm text-meld-ink/70 mb-3 leading-relaxed">
                      {item.content}
                    </p>
                    
                    {item.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContextAction(item)}
                        className="text-meld-sage hover:text-meld-sage hover:bg-meld-sage/10 text-xs h-7"
                      >
                        {item.action}
                      </Button>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Events Category */}
            <Collapsible 
              open={expandedCategories.events} 
              onOpenChange={() => toggleCategory('events')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="font-medium text-sm text-meld-ink">Events</span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-meld-ink/60 transition-transform",
                  !expandedCategories.events && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {mockContextByCategory.events.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-3 border border-meld-ink/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-meld-ember" />
                      <span className="font-medium text-sm text-meld-ink">{item.title}</span>
                    </div>
                    
                    <p className="text-sm text-meld-ink/70 mb-3 leading-relaxed">
                      {item.content}
                    </p>
                    
                    {item.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContextAction(item)}
                        className="text-meld-sage hover:text-meld-sage hover:bg-meld-sage/10 text-xs h-7"
                      >
                        {item.action}
                      </Button>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Values Category */}
            <Collapsible 
              open={expandedCategories.values} 
              onOpenChange={() => toggleCategory('values')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                <span className="font-medium text-sm text-meld-ink">Values</span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-meld-ink/60 transition-transform",
                  !expandedCategories.values && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {mockContextByCategory.values.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-3 border border-meld-ink/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-meld-sage" />
                      <span className="font-medium text-sm text-meld-ink">{item.title}</span>
                    </div>
                    
                    <p className="text-sm text-meld-ink/70 mb-3 leading-relaxed">
                      {item.content}
                    </p>
                    
                    {item.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContextAction(item)}
                        className="text-meld-sage hover:text-meld-sage hover:bg-meld-sage/10 text-xs h-7"
                      >
                        {item.action}
                      </Button>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}