import React, { useState } from 'react';


import Streamer from './streamer';
import Viewer from './viewer';

const WebRTCVideoApp = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamKey, setStreamKey] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!isStreaming ? (
        <Streamer 
          onStartStream={(key) => {
            setStreamKey(key);
            setIsStreaming(true);
          }} 
        />
      ) : (
        <Viewer streamKey={streamKey} />
      )}
    </div>
  );
};

export default WebRTCVideoApp;
