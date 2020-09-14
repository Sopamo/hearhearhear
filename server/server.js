const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = socketIo(server);

const clients = [];

io.on('connection', (socket) => {
  socket.on('join', () => {
    clients.push(socket.id);
    socket.broadcast.emit('user-joined', socket.id);
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
      const index = clients.findIndex((client) => client === socket.id);
      clients.splice(index, 1);
      socket.broadcast.emit('user-left', socket.id);
      console.log('User disconnected:', socket.id);
    });

    socket.on('offer', (payload) => {
      console.log('offer', JSON.stringify(payload));
      socket.broadcast.emit('offer', payload);
    });

    socket.on('answer', (payload) => {
      console.log('answer', JSON.stringify(payload));
      socket.broadcast.emit('answer', payload);
    });
  });
});

server.listen(3333);
