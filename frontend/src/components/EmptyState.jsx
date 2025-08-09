import React from 'react';
import { MessageCircle, User, Smartphone } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0b141a] p-8">
      <div className="text-center max-w-md">
        {/* WhatsApp Web logo/icon */}
        <div className="w-32 h-32 bg-[#202c33] rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-light text-white mb-4">
          WhatsApp Web
        </h2>

        {/* Description */}
        <p className="text-[#8696a0] mb-8 leading-relaxed">
          Send and receive messages without keeping your phone online.
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </p>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-8 h-8 bg-[#2a3942] rounded-full flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-[#00a884]" />
            </div>
            <span className="text-sm text-[#8696a0]">
              Select a conversation to start messaging
            </span>
          </div>
          
          <div className="flex items-center space-x-3 text-left">
            <div className="w-8 h-8 bg-[#2a3942] rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[#00a884]" />
            </div>
            <span className="text-sm text-[#8696a0]">
              Your personal messages are end-to-end encrypted
            </span>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-xs text-[#8696a0] border-t border-[#374045] pt-4">
          <p>
            Made with{' '}
            <span className="text-red-500 mx-1">❤️</span>
            for demonstration purposes
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;