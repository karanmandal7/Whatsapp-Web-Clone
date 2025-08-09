import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Send, Phone, User, ArrowLeft } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { api, handleApiError, mockData, isDevelopment } from '../services/api';
import MessageBubble from './MessageBubble';
import ConversationList from './ConversationList';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import ConnectionStatus from './ConnectionStatus';
import EmptyState from './EmptyState';

const WhatsAppClone = () => {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [conversationsVersion, setConversationsVersion] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [sidebarKey, setSidebarKey] = useState(0);
  const messagesEndRef = useRef(null);

  // Check mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Clean up duplicate messages on mount
  useEffect(() => {
    if (messages.length > 0) {
      const uniqueMessages = messages.filter((message, index, self) => 
        index === self.findIndex(m => m.messageId === message.messageId)
      );
      
      if (uniqueMessages.length !== messages.length) {
        console.warn(`🧹 Cleaned up ${messages.length - uniqueMessages.length} duplicate messages on mount`);
        setMessages(uniqueMessages);
      }
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('newMessage', (message) => {
      console.log('📨 New message received:', message);
      
      // Update conversations list
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv._id === message.waId);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: message,
            messageCount: updated[existingIndex].messageCount + 1,
            unreadCount: message.isIncoming ? updated[existingIndex].unreadCount + 1 : updated[existingIndex].unreadCount
          };
          // Move to top
          const [updatedConv] = updated.splice(existingIndex, 1);
          return [updatedConv, ...updated];
        } else {
          // New conversation
          return [{
            _id: message.waId,
            lastMessage: message,
            messageCount: 1,
            unreadCount: message.isIncoming ? 1 : 0
          }, ...prev];
        }
      });

      // Update messages if this is the current chat
      if (selectedChat && message.waId === selectedChat._id) {
        setMessages(prev => {
          // Check for duplicates before adding
          const isDuplicate = prev.some(msg => msg.messageId === message.messageId);
          if (isDuplicate) {
            console.warn('⚠️ Duplicate message from socket, skipping:', message.messageId);
            return prev;
          }
          return [...prev, message];
        });
      }
    });

    // Listen for status updates
    socket.on('statusUpdate', (statusUpdate) => {
      console.log('📊 Status update received:', statusUpdate);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.messageId === statusUpdate.messageId 
            ? { ...msg, status: statusUpdate.status }
            : msg
        )
      );
    });

    return () => {
      socket.off('newMessage');
      socket.off('statusUpdate');
    };
  }, [socket, selectedChat]);

  // Scroll to bottom when messages change - but only for incoming messages, not when sending
  useEffect(() => {
    // Only auto-scroll for incoming messages, not when we're sending
    if (messages.length > 0 && messages[messages.length - 1]?.isIncoming) {
      scrollToBottom();
    }
  }, [messages]);

  // Join conversation room when chat is selected
  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit('join_conversation', selectedChat._id);
      return () => socket.emit('leave_conversation', selectedChat._id);
    }
  }, [socket, selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.getConversations();
      setConversations(data);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError(handleApiError(error));
      
      // Fall back to mock data in development
      if (isDevelopment) {
        console.log('📝 Using mock data for development');
        setConversations(mockData.conversations);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (waId) => {
    try {
      setError(null);
      
      const data = await api.getMessages(waId);
      
      // Remove duplicates before setting messages
      const uniqueMessages = data.filter((message, index, self) => 
        index === self.findIndex(m => m.messageId === message.messageId)
      );
      
      if (uniqueMessages.length !== data.length) {
        console.warn(`⚠️ Removed ${data.length - uniqueMessages.length} duplicate messages`);
      }
      
      setMessages(uniqueMessages);
      
      // Mark conversation as read
      setConversations(prev =>
        prev.map(conv =>
          conv._id === waId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
      
      // Scroll to bottom after loading messages
      setTimeout(() => scrollToBottom(), 100);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(handleApiError(error));
      
      // Fall back to mock data in development
      if (isDevelopment && mockData.messages[waId]) {
        console.log('📝 Using mock messages for development');
        const mockMessages = mockData.messages[waId];
        
        // Remove duplicates from mock data too
        const uniqueMockMessages = mockMessages.filter((message, index, self) => 
          index === self.findIndex(m => m.messageId === message.messageId)
        );
        
        setMessages(uniqueMockMessages);
        // Scroll to bottom for mock data too
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  };

  const handleSelectChat = (conversation) => {
    setSelectedChat(conversation);
    loadMessages(conversation._id);
    
    if (isMobileView) {
      setShowChatOnMobile(true);
    }
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setSelectedChat(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage.trim();
    const tempMessage = {
      messageId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: messageText,
      timestamp: Math.floor(Date.now() / 1000),
      isIncoming: false,
      status: 'sending',
      contactName: selectedChat.lastMessage.contactName
    };

    // Set sending state
    setIsSendingMessage(true);

    // Clear input immediately
    setNewMessage('');
    
    console.log('📝 Adding temp message to UI:', tempMessage);
    
    // Add message to UI immediately with proper state update
    setMessages(prev => {
      // Check for duplicates before adding
      const isDuplicate = prev.some(msg => msg.messageId === tempMessage.messageId);
      if (isDuplicate) {
        console.warn('⚠️ Duplicate message detected, skipping:', tempMessage.messageId);
        return prev;
      }
      
      const newMessages = [...prev, tempMessage];
      console.log('📝 Updated messages state:', newMessages.length, 'messages');
      return newMessages;
    });
    
    // Update conversation list with new last message
    setConversations(prev => {
      const updatedConversations = prev.map(conv => 
        conv._id === selectedChat._id 
          ? {
              ...conv,
              lastMessage: {
                messageId: tempMessage.messageId,
                text: messageText,
                timestamp: tempMessage.timestamp,
                status: 'sending',
                isIncoming: false, // Outgoing message
                contactName: selectedChat.lastMessage.contactName,
                waId: selectedChat._id
              },
              messageCount: conv.messageCount + 1
            }
          : conv
      );
      
      console.log('📝 Updated conversations state:', updatedConversations.length, 'conversations');
      console.log('📝 Updated conversation:', updatedConversations.find(c => c._id === selectedChat._id));
      
      // Force re-render of conversation list
      setConversationsVersion(prev => prev + 1);
      setForceUpdate(prev => prev + 1);
      setSidebarKey(prev => prev + 1);
      
      return updatedConversations;
    });
    
    // Additional force update after a short delay
    setTimeout(() => {
      setSidebarKey(prev => prev + 1);
    }, 100);

    // Scroll to bottom after adding message - use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      setTimeout(() => scrollToBottom(), 50);
    });

    setIsTyping(true);

    try {
      const result = await api.sendMessage(selectedChat._id, messageText);
      
      console.log('📝 Replacing temp message with real message:', result.message);
      
      // Replace temp message with real message
      setMessages(prev => {
        // Check if the real message already exists to avoid duplicates
        const existingMessage = prev.find(msg => 
          msg.messageId === result.message.messageId && msg.messageId !== tempMessage.messageId
        );
        
        if (existingMessage) {
          console.warn('⚠️ Real message already exists, removing temp message instead:', tempMessage.messageId);
          return prev.filter(msg => msg.messageId !== tempMessage.messageId);
        }
        
        const updatedMessages = prev.map(msg => 
          msg.messageId === tempMessage.messageId 
            ? { ...result.message, status: result.message.status || 'sent' }
            : msg
        );
        console.log('📝 Updated messages state after replacement:', updatedMessages.length, 'messages');
        return updatedMessages;
      });

      // Update conversation list with real message data
      setConversations(prev => {
        const updatedConversations = prev.map(conv => 
          conv._id === selectedChat._id 
            ? {
                ...conv,
                lastMessage: {
                  messageId: result.message.messageId,
                  text: result.message.text,
                  timestamp: result.message.timestamp,
                  status: result.message.status || 'sent',
                  isIncoming: false, // Outgoing message
                  contactName: selectedChat.lastMessage.contactName,
                  waId: selectedChat._id
                }
              }
            : conv
        );
        
        console.log('📝 Final conversations update:', updatedConversations.length, 'conversations');
        console.log('📝 Final conversation update:', updatedConversations.find(c => c._id === selectedChat._id));
        
        // Force re-render of conversation list
        setConversationsVersion(prev => prev + 1);
        setForceUpdate(prev => prev + 1);
        setSidebarKey(prev => prev + 1);
        
        return updatedConversations;
      });

      // Scroll to bottom after updating message - use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        setTimeout(() => scrollToBottom(), 50);
      });
      
      // Simulate WhatsApp status progression: sent → delivered → read
      setTimeout(() => {
        // Update to 'delivered' status in both conversations and messages
        setConversations(prev => 
          prev.map(conv => 
            conv._id === selectedChat._id 
              ? {
                  ...conv,
                  lastMessage: {
                    ...conv.lastMessage,
                    status: 'delivered'
                  }
                }
              : conv
          )
        );
        
        setMessages(prev => 
          prev.map(msg => 
            msg.messageId === result.message.messageId 
              ? { ...msg, status: 'delivered' }
              : msg
          )
        );
        
        setSidebarKey(prev => prev + 1);
      }, 1000);
      
      setTimeout(() => {
        // Update to 'read' status in both conversations and messages
        setConversations(prev => 
          prev.map(conv => 
            conv._id === selectedChat._id 
              ? {
                  ...conv,
                  lastMessage: {
                    ...conv.lastMessage,
                    status: 'read'
                  }
                }
              : conv
          )
        );
        
        setMessages(prev => 
          prev.map(msg => 
            msg.messageId === result.message.messageId 
              ? { ...msg, status: 'read' }
              : msg
          )
        );
        
        setSidebarKey(prev => prev + 1);
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg.messageId === tempMessage.messageId 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      
      // Revert conversation list changes
      setConversations(prev => 
        prev.map(conv => 
          conv._id === selectedChat._id 
            ? {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  text: conv.lastMessage.text,
                  timestamp: conv.lastMessage.timestamp,
                  status: conv.lastMessage.status
                }
              }
            : conv
        )
      );
      
      // Show error message
      setError(handleApiError(error));
    } finally {
      setIsTyping(false);
      setIsSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.lastMessage.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Debug: Log conversations state changes
  useEffect(() => {
    console.log('🔄 Conversations state changed:', conversations.length, 'conversations');
    console.log('🔍 Filtered conversations:', filteredConversations.length, 'filtered');
    if (conversations.length > 0) {
      console.log('📋 First conversation:', conversations[0]);
    }
  }, [conversations, filteredConversations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0b141a] via-[#111b21] to-[#0b141a] relative">
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} />

      {/* Error Banner */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-3 text-center z-50 font-medium shadow-lg">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-3 text-white hover:text-gray-200 font-bold transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sidebar - Conversations List */}
      <div className={`w-full md:w-[420px] bg-gradient-to-b from-[#202c33] to-[#1a2529] border-r border-[#374045] flex flex-col shadow-xl ${
        isMobileView && showChatOnMobile ? 'hidden' : 'block'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 bg-gradient-to-r from-[#202c33] to-[#1a2529] border-b border-[#374045] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-white text-lg">WhatsApp Business</h1>
                <p className="text-xs text-[#8696a0]">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <MoreVertical className="w-5 h-5 text-[#8696a0] cursor-pointer hover:text-white transition-colors hover:bg-[#2a3942] p-1 rounded-full" />
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#2a3942] border border-[#374045] rounded-xl text-white placeholder-[#8696a0] focus:outline-none focus:bg-[#2a3942] focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all duration-200 shadow-sm"
            />
          </div>
          
          {/* Debug info for sidebar */}
          {isDevelopment && (
            <div className="mt-3 p-2 bg-[#2a3942] text-xs text-[#8696a0] rounded-lg border border-[#374045]">
              Sidebar Debug: {conversations.length} conversations | Filtered: {filteredConversations.length} | Version: {conversationsVersion} | Force: {forceUpdate} | Key: {sidebarKey}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <ConversationList
          key={`sidebar-${sidebarKey}`}
          conversations={filteredConversations}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          searchQuery={searchQuery}
        />
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-gradient-to-br from-[#0b141a] via-[#111b21] to-[#0b141a] ${
        isMobileView && !showChatOnMobile ? 'hidden' : 'flex'
      }`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <ChatHeader 
              chat={selectedChat}
              onBack={handleBackToList}
              showBackButton={isMobileView}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b141a] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0iIzM3NDA0NSIvPgo8L3N2Zz4K')] bg-repeat">
              {/* Debug info - remove this later */}
              {isDevelopment && (
                <div className="p-3 bg-[#2a3942] text-xs text-[#8696a0] mb-3 rounded-lg mx-4 mt-3 border border-[#374045] shadow-sm">
                  Debug: {messages.length} messages | Sending: {isSendingMessage ? 'Yes' : 'No'} | Typing: {isTyping ? 'Yes' : 'No'} | Conversations: {conversations.length} | Version: {conversationsVersion} | Force: {forceUpdate} | Sidebar: {sidebarKey}
                </div>
              )}
              
              <div className="p-4 space-y-1">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={`${message.messageId}_${message.timestamp}_${index}`}
                    message={message}
                    showDate={
                      index === 0 || 
                      new Date(message.timestamp * 1000).toDateString() !== 
                      new Date(messages[index - 1].timestamp * 1000).toDateString()
                    }
                  />
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#202c33] p-3 rounded-2xl shadow-sm max-w-[60px] border border-[#374045]">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sending message indicator */}
                {isSendingMessage && (
                  <div className="flex justify-end mb-2">
                    <div className="bg-gradient-to-r from-[#005c4b] to-[#004d3f] p-2 rounded-xl text-xs text-[#8696a0] shadow-sm border border-[#374045]">
                      Sending message...
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <MessageInput
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onSubmit={handleSendMessage}
              disabled={!isConnected}
              placeholder={!isConnected ? "Connecting..." : "Type a message"}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default WhatsAppClone;