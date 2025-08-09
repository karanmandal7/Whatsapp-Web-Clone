import React, { useEffect } from 'react';
import { User, Check, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const ConversationList = ({ conversations, selectedChat, onSelectChat, searchQuery }) => {
  // Debug: Log when props change
  console.log('🔄 ConversationList re-rendered with:', {
    conversationsCount: conversations.length,
    firstConversation: conversations[0]?.lastMessage?.text,
    selectedChatId: selectedChat?._id,
    searchQuery
  });
  
  // Track prop changes
  useEffect(() => {
    console.log('📋 ConversationList useEffect - conversations updated:', conversations.length);
    if (conversations.length > 0) {
      console.log('📋 First conversation last message:', conversations[0].lastMessage);
    }
  }, [conversations]);
  
  // Format time for conversation list
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yy');
    }
  };

  // Status icon for last message
  const StatusIcon = ({ status, isIncoming }) => {
    if (isIncoming) return null;
    
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-[#8696a0]" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-[#8696a0]" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-[#53bdeb]" />;
      default:
        return null;
    }
  };

  // Highlight search terms
  const highlightSearchTerm = (text, searchQuery) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#2a3942] rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#8696a0]" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No conversations yet</h3>
          <p className="text-[#8696a0] text-sm">
            {searchQuery ? 'No conversations match your search.' : 'Start a new conversation to get started.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {conversations.map((conv) => (
        <div
          key={conv._id}
          onClick={() => onSelectChat(conv)}
          className={`conversation-item p-3 border-b border-[#374045] cursor-pointer transition-colors duration-150 ${
            selectedChat?._id === conv._id ? 'bg-[#2a3942]' : 'hover:bg-[#2a3942]'
          }`}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              {/* Online indicator (you can add logic for this) */}
              {/* <div className="online-indicator"></div> */}
            </div>

            {/* Conversation info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-white truncate text-base">
                  {highlightSearchTerm(conv.lastMessage.contactName, searchQuery)}
                </h3>
                <span className="text-xs text-[#8696a0] flex-shrink-0 ml-2">
                  {formatTime(conv.lastMessage.timestamp)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 flex-1 min-w-0">
                  <StatusIcon 
                    status={conv.lastMessage.status} 
                    isIncoming={conv.lastMessage.isIncoming} 
                  />
                  <p className="text-sm text-[#8696a0] truncate">
                    {highlightSearchTerm(conv.lastMessage.text, searchQuery)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  {/* Unread count badge */}
                  {conv.unreadCount > 0 && (
                    <span className="bg-[#00a884] text-white text-xs rounded-full px-2 py-1 min-w-5 text-center font-medium">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                  
                  {/* Pin indicator (for future feature) */}
                  {/* <Pin className="w-4 h-4 text-[#8696a0]" /> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;