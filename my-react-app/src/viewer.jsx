import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const Viewer = ({ streamKey }) => {
  const videoRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

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

  useEffect(() => {
    if (!socket || !streamKey) return;

    const setupViewerConnection = async () => {
      try {
        // Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });

        // Setup track handling
        pc.ontrack = (event) => {
          console.log('Track received on viewer side:', event.streams[0]);
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };

        // Join stream
        socket.emit('join-stream', { streamKey });

        // Handle offer from streamer
        socket.on('offer', async (data) => {
          if (data.streamKey === streamKey) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socket.emit('answer', {
              streamKey,
              answer,
              viewerId: socket.id
            });
          }
        });

        // Handle ICE candidates
        socket.on('ice-candidate', async (data) => {
          if (data.streamKey === streamKey) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        });

        // Send ICE candidates to streamer
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', {
              streamKey,
              candidate: event.candidate,
              recipient: 'streamer' // In a real scenario, this would be dynamic
            });
          }
        };

        setPeerConnection(pc);
      } catch (error) {
        console.error('WebRTC viewer setup error:', error);
      }
    };

    setupViewerConnection();

    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [socket, streamKey]);

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Viewer</h2>
      
      <div className="mb-4">
        <p className="font-semibold">Stream Key: {streamKey}</p>
      </div>

      <video 
        ref={videoRef} 
        controls 
        className="w-full rounded-lg"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default Viewer;