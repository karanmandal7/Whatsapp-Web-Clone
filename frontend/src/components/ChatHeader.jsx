import React from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, User } from 'lucide-react';

const ChatHeader = ({ chat, onBack, showBackButton = false }) => {
  const { lastMessage } = chat;

  const handleCall = () => {
    // Placeholder for call functionality
    console.log('Call initiated with:', lastMessage.contactName);
    alert(`Call functionality would be implemented here for ${lastMessage.contactName}`);
  };

  const handleVideoCall = () => {
    // Placeholder for video call functionality
    console.log('Video call initiated with:', lastMessage.contactName);
    alert(`Video call functionality would be implemented here for ${lastMessage.contactName}`);
  };

  const handleMoreOptions = () => {
    // Placeholder for more options menu
    console.log('More options for:', lastMessage.contactName);
  };

  return (
    <div className="p-3 bg-[#202c33] border-b border-[#374045] flex items-center space-x-3">
      {/* Back button (mobile) */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#2a3942] rounded-full transition-colors md:hidden"
        >
          <ArrowLeft className="w-5 h-5 text-[#8696a0]" />
        </button>
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        {/* Online status indicator */}
        {/* <div className="online-indicator"></div> */}
      </div>

      {/* Contact info */}
      <div className="flex-1 min-w-0">
        <h2 className="font-medium text-white truncate text-base">
          {lastMessage.contactName}
        </h2>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-[#8696a0] truncate">
            +{chat._id}
          </p>
          {/* Last seen / online status */}
          <span className="text-xs text-[#8696a0]">
            • last seen recently
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        <button
          onClick={handleCall}
          className="p-2 hover:bg-[#2a3942] rounded-full transition-colors"
          title="Voice call"
        >
          <Phone className="w-5 h-5 text-[#8696a0] hover:text-white" />
        </button>
        
        <button
          onClick={handleVideoCall}
          className="p-2 hover:bg-[#2a3942] rounded-full transition-colors"
          title="Video call"
        >
          <Video className="w-5 h-5 text-[#8696a0] hover:text-white" />
        </button>
        
        <button
          onClick={handleMoreOptions}
          className="p-2 hover:bg-[#2a3942] rounded-full transition-colors"
          title="More options"
        >
          <MoreVertical className="w-5 h-5 text-[#8696a0] hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;