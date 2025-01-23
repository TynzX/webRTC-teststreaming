import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const Streamer = ({ onStartStream }) => {
  const videoRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [streamKey, setStreamKey] = useState('');

  useEffect(() => {
    // Connect to signaling server
    const newSocket = io('https://potential-telegram-q559rg4jwqvfxxwx-3000.app.github.dev/');
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const initWebRTCStreaming = async (file) => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          // { urls: "stun:stun.l.google.com:5349" },
          // { urls: "stun:stun1.l.google.com:3478" },
          // { urls: "stun:stun1.l.google.com:5349" },
          // { urls: "stun:stun2.l.google.com:19302" },
          // { urls: "stun:stun2.l.google.com:5349" },
          // { urls: "stun:stun3.l.google.com:3478" },
          // { urls: "stun:stun3.l.google.com:5349" },
          // { urls: "stun:stun4.l.google.com:19302" },
          // { urls: "stun:stun4.l.google.com:5349" }

        ]
      });

      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);

      await new Promise(resolve => {
        videoElement.onloadedmetadata = resolve;
      });

      const stream = videoElement.captureStream();
      setMediaStream(stream);

      // Add video track to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Generate stream key
      const generatedStreamKey = Math.random().toString(36).substring(2, 15);
      setStreamKey(generatedStreamKey);

      // Socket event handlers
      socket.emit('create-stream', { streamKey: generatedStreamKey });

      socket.on('offer', async (data) => {
        if (data.streamKey === generatedStreamKey) {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            streamKey: generatedStreamKey,
            answer,
            viewerId: data.viewerId
          });
        }
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            streamKey: generatedStreamKey,
            candidate: event.candidate,
            recipient: 'viewer' // In a real scenario, this would be dynamic
          });
        }
      };

      setPeerConnection(pc);

      return generatedStreamKey;
    } catch (error) {
      console.error('WebRTC streaming setup error:', error);
      return null;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const key = await initWebRTCStreaming(file);
    if (key) {
      onStartStream(key);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [peerConnection, mediaStream]);

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Start Streaming</h2>

      <input
        type="file"
        accept="video/*"
        onChange={handleFileUpload}
        className="w-full p-2 border rounded mb-4"
      />

      {mediaStream && (
        <div className="mb-4">
          <video
            ref={videoRef}
            controls
            className="w-full rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {streamKey && (
        <div className="bg-green-100 p-3 rounded">
          <p className="font-semibold">Stream Key: {streamKey}</p>
          <p className="text-sm text-gray-600">Share this key with viewers</p>
        </div>
      )}
    </div>
  );
};

export default Streamer;