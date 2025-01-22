const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.binaryType = 'arraybuffer';
  console.log('New client connected');

  socket.on('broadcaster', () => {
    console.log('broadcast connected');
    socket.broadcast.emit('broadcaster', socket.id);
  });

  socket.on('watcher', () => {
    console.log('viewer connected');
    socket.broadcast.emit('watcher', socket.id);
  });
  
  socket.on('send-message', (message) => {
    console.log('Message received from sender:', message);
    io.emit('receive-message', message);
  });

  socket.on('start-stream', () => {
    const videoPath = path.join(__dirname, 'public', 'video.mp4');
    const readStream = fs.createReadStream(videoPath, { highWaterMark: 1024 * 1024 }); // 1MB chunks

    console.log('Streaming started');

    const message = "hello viewer";
    socket.emit('send-message', message);
    console.log(message);

    readStream.on('data', (chunk) => {
      console.log('Sending chunk of size:', chunk.length);
      io.emit('video-chunk', chunk);
      // const message = "hello viewer";
      // socket.emit('send-message', message);
    });

    readStream.on('end', () => {
      console.log('Streaming ended');
      io.emit('video-end');
    });

    readStream.on('error', (err) => {
      console.error('Error reading video file:', err);
      io.emit('video-error', err.message);
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
    socket.broadcast.emit('disconnectPeer', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});