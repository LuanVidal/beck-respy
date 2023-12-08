const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:8080",
  },
});
const ScreenManager = require("./screen-manager");
const { startMeasurementLoop, data } = require("./sensor");
const keypress = require("keypress");

app.use(express.static("dist"));

io.on("connection", (socket) => {
  console.log("Servidor conectado");

  socket.on("disconnect", () => {
    console.log("Servidor desconectado");
  });

  const screenManager = new ScreenManager(io, data);

  // Ativa a leitura de teclas
  keypress(process.stdin);

  // Escuta eventos de tecla
  process.stdin.on("keypress", (char, key) => {
    if (key && key.ctrl && key.name === "c") {
      process.exit(); // Encerra o processo se Ctrl+C for pressionado
    }

    // Repassa o caractere para o gerenciador de tela
    screenManager.handleKey(char);
  });

  // Inicia a leitura de teclas
  process.stdin.setRawMode(true);
  process.stdin.resume();

  // Inicia a medição
  startMeasurementLoop();
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Servidor Node.js rodando em http://localhost:${port}`);
});
