import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

const MessageInput = ({ 
  value, 
  onChange, 
  onSubmit, 
  disabled = false, 
  placeholder = "Type a message" 
}) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [value]);

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const handleAttachment = () => {
    // Placeholder for attachment functionality
    console.log('Attachment button clicked');
    alert('Attachment functionality would be implemented here');
  };

  const handleEmoji = () => {
    // Placeholder for emoji picker
    console.log('Emoji button clicked');
    alert('Emoji picker would be implemented here');
  };

  return (
    <div className="p-3 bg-[#202c33] border-t border-[#374045]">
      <form onSubmit={onSubmit} className="flex items-end space-x-3">
        {/* Attachment button */}
        <button
          type="button"
          onClick={handleAttachment}
          disabled={disabled}
          className="p-2 text-[#8696a0] hover:text-white hover:bg-[#2a3942] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Message input container */}
        <div className="flex-1 relative bg-[#2a3942] rounded-lg border border-[#374045] focus-within:border-[#00a884]">
          <div className="flex items-end">
            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="flex-1 px-4 py-3 bg-transparent border-none outline-none resize-none max-h-30 min-h-10 text-white placeholder-[#8696a0]"
              style={{
                lineHeight: '1.5',
                overflowY: value.split('\n').length > 3 ? 'auto' : 'hidden'
              }}
            />

            {/* Emoji button */}
            <button
              type="button"
              onClick={handleEmoji}
              disabled={disabled}
              className="p-2 text-[#8696a0] hover:text-white hover:bg-[#374045] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mr-2"
              title="Insert emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="w-10 h-10 bg-[#00a884] text-white rounded-full flex items-center justify-center hover:bg-[#008f72] disabled:bg-[#374045] disabled:cursor-not-allowed transition-colors flex-shrink-0"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Character count (optional) */}
      {value.length > 500 && (
        <div className="text-xs text-[#8696a0] text-right mt-1">
          {value.length}/1000
        </div>
      )}
    </div>
  );
};

export default MessageInput;