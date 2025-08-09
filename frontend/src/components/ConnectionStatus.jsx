import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

const ConnectionStatus = ({ isConnected }) => {
  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#00a884] text-white p-3 text-center z-50 animate-slide-down font-medium">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">
          Connecting to WhatsApp Web...
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;