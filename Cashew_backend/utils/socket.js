const { Server } = require('socket.io');

let io;

/**
 * Initializes Socket.io and attaches it to the HTTP server.
 * @param {http.Server} httpServer - The Node.js HTTP server instance.
 */
const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Returns the active Socket.io instance.
 * Must be called AFTER init().
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call init(server) first.');
  }
  return io;
};

module.exports = { init, getIO };
