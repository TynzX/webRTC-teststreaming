import React, { useEffect, useRef, useState } from 'react';

const WebRTCVideoStreamer = () => {
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(() => {
    const initWebRTCStreaming = async () => {
      try {
       
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });

        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'video/*';
        fileInput.click();

        fileInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const videoElement = document.createElement('video');
          videoElement.src = URL.createObjectURL(file);

          await new Promise(resolve => {
            videoElement.onloadedmetadata = resolve;
          });

          const stream = videoElement.captureStream();
          setMediaStream(stream);

         
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });

          // Create offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log(offer);
          

          // Setup track handling
          pc.ontrack = (event) => {
            if (videoRef.current) {
              videoRef.current.srcObject = event.streams[0];
            }
          };

          setPeerConnection(pc);
        };

      } catch (error) {
        console.error('WebRTC streaming setup error:', error);
      }
    };

    initWebRTCStreaming();

    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <video 
        ref={videoRef} 
        controls 
        className="w-full rounded-lg shadow-lg"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default WebRTCVideoStreamer;