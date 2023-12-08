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

app.use(express.static("dist"));

io.on("connection", (socket) => {
  console.log("Servidor conectado");

  socket.on("disconnect", () => {
    console.log("Servidor desconectado");
  });

  const screenManager = new ScreenManager(io, data);

  // Escuta eventos de tecla
  socket.on("keyboard-listener", (key) => {
    // Repassa o caractere para o gerenciador de tela
    screenManager.handleKey(key);
  });

  // Inicia a medição
  startMeasurementLoop();
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`Servidor Node.js rodando em http://localhost:${port}`);
});
