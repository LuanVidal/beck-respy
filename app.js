const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:8080",
  },
});
const readline = require("readline");
const ScreenManager = require("./screen-manager");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("Servidor conectado");

  socket.on("disconnect", () => {
    console.log("Servidor desconectado");
  });

  const screenManager = new ScreenManager(io);

  function getUserInput() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on("keypress", (char, evt) => {
      console.log("Key pressed");
      console.log("Char:", JSON.stringify(char), "Evt:", JSON.stringify(evt));
      if (char === "q") process.exit();
      screenManager.handleKey(char);
    });
  }

  getUserInput(); // Inicie o loop de entrada
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Servidor Node.js rodando em http://localhost:${port}`);
});
