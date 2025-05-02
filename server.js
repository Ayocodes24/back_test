const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const chat = model.startChat({ history: [] }); // <- Maintain session

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('chat message', async (data) => {
    try {
      const result = await chat.sendMessage(data);
      const response = await result.response.text();
      io.emit('chat message', { sender: "AI", text: response });
    } catch (err) {
      console.error("Gemini error:", err.message);
      io.emit('chat message', { sender: "AI", text: "Sorry, I couldn't respond right now." });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/', (req, res) => res.send('Chat server running with Gemini chat!'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
