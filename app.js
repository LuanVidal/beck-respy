const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:8080"
  }
});
const readline = require('readline');
const ScreenManager = require('./screen-manager');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Servidor conectado');

  socket.on('disconnect', () => {
    console.log('Servidor desconectado');
  });

  const screenManager = new ScreenManager(io);

  function getUserInput() {
    rl.question('mensagem para enviar: ', (msg) => {
      if (msg === 'q') {
        rl.close();
        return; // Sair do loop quando o usuário digitar "q"
      }

      screenManager.handleKey(msg);

      // Chamar a função novamente para permitir a entrada contínua
      getUserInput();
    });
  }

  getUserInput(); // Inicie o loop de entrada
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Servidor Node.js rodando em http://localhost:${port}`);
});
