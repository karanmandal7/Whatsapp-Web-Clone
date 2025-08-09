import React from 'react';
import WhatsAppClone from './components/WhatsAppClone';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      <div className="App">
        <WhatsAppClone />
      </div>
    </SocketProvider>
  );
}

export default App;