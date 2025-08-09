import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const MessageBubble = ({ message, showDate = false }) => {
  const { text, timestamp, isIncoming, status, contactName } = message;

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return format(date, 'HH:mm');
  };

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  // Status icon component
  const StatusIcon = ({ status, isIncoming }) => {
    if (isIncoming) return null;
    
    const iconClasses = "w-4 h-4";
    
    switch (status) {
      case 'sending':
        return <Clock className={`${iconClasses} text-[#8696a0]`} />;
      case 'sent':
        return <Check className={`${iconClasses} text-[#8696a0]`} />;
      case 'delivered':
        return <CheckCheck className={`${iconClasses} text-[#8696a0]`} />;
      case 'read':
        return <CheckCheck className={`${iconClasses} text-[#53bdeb]`} />;
      case 'failed':
        return <AlertCircle className={`${iconClasses} text-red-500`} />;
      default:
        return <Clock className={`${iconClasses} text-[#8696a0]`} />;
    }
  };

  return (
    <div className="message-bubble-enter">
      {/* Date separator */}
      {showDate && (
        <div className="flex justify-center my-6">
          <span className="bg-[#202c33] px-4 py-2 rounded-full text-xs text-[#8696a0] shadow-sm border border-[#374045]">
            {formatDate(timestamp)}
          </span>
        </div>
      )}

      {/* Message bubble */}
      <div className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} mb-2`}>
        <div
          className={`max-w-[65%] px-3 py-2 break-words ${
            isIncoming
              ? 'bg-[#202c33] text-white rounded-[7.5px] rounded-bl-[2px]'
              : 'bg-[#005c4b] text-white rounded-[7.5px] rounded-br-[2px]'
          }`}
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto'
          }}
        >
          {/* Message text */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {text}
          </div>

          {/* Message time and status */}
          <div className="flex items-center justify-end space-x-1 mt-1 min-w-fit">
            <span className={`text-xs ${
              isIncoming ? 'text-[#8696a0]' : 'text-[#8696a0]'
            }`}>
              {formatTime(timestamp)}
            </span>
            <StatusIcon status={status} isIncoming={isIncoming} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;