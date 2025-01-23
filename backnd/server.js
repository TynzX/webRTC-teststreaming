const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "*", // Adjust in production
//     methods: ["GET", "POST"]
//   }
// });

// Configure CORS
const corsOptions = {
    origin: [
      'https://potential-telegram-q559rg4jwqvfxxwx-5173.app.github.dev/',
    //   'http://localhost:5173'
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
  
  app.use(cors(corsOptions));
  console.log('CORS configured');
  
  const server = http.createServer(app);
  console.log('HTTP server created');
  const io = socketIo(server, {
    cors: corsOptions
  });
    console.log('Socket.IO server created');


// Store active streams
const streams = new Map();
console.log('Streams map initialized');

io.on('connection', (socket) => {
  console.log('New client connected');

  // Streamer creates a new stream
  socket.on('create-stream', (streamData) => {
    const { streamKey } = streamData;
    
    // Check if stream key already exists
    if (streams.has(streamKey)) {
      socket.emit('stream-error', 'Stream key already in use');
      return;
    }

    // Create new stream entry
    streams.set(streamKey, {
      streamer: socket.id,
      viewers: new Set()
    });

    socket.emit('stream-created', { streamKey });
    console.log(`Stream created: ${streamKey}`);
  });

  // Viewer joins a stream
  socket.on('join-stream', (streamData) => {
    const { streamKey } = streamData;
    const stream = streams.get(streamKey);

    if (!stream) {
      socket.emit('stream-error', 'Stream not found');
      return;
    }

    // Add viewer to stream
    stream.viewers.add(socket.id);
    socket.emit('stream-joined', { streamKey });
    console.log(`Viewer joined stream: ${streamKey}`);
  });

  // WebRTC signaling: exchange connection information
  socket.on('offer', (data) => {
    const { streamKey, offer } = data;
    const stream = streams.get(streamKey);

    if (!stream) {
      socket.emit('stream-error', 'Stream not found');
      return;
    }

    // Broadcast offer to all participants
    socket.broadcast.to(stream.streamer).emit('offer', {
      streamKey,
      offer,
      viewerId: socket.id
    });
  });

  socket.on('answer', (data) => {
    const { streamKey, answer, viewerId } = data;
    
    socket.broadcast.to(viewerId).emit('answer', {
      streamKey,
      answer
    });
  });

  socket.on('ice-candidate', (data) => {
    const { streamKey, candidate, recipient } = data;
    
    socket.broadcast.to(recipient).emit('ice-candidate', {
      streamKey,
      candidate
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove stream if streamer disconnects
    for (const [streamKey, stream] of streams.entries()) {
      if (stream.streamer === socket.id) {
        streams.delete(streamKey);
        console.log(`Stream ended: ${streamKey}`);
      }
      
      // Remove viewer if they disconnect
      stream.viewers.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});