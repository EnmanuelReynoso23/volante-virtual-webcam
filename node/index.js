var express = require("express");
var http = require("http");
var WebSocket = require("ws");
var spawn = require("child_process").spawn;

var app = express();
var server = http.createServer(app);

// === WebSocket Server (ULTRA BAJA LATENCIA) ===
var wss = new WebSocket.Server({ server: server });

// Iniciar el programa de C# (.NET) como un subproceso
var net = spawn(
  "../net/NetAppModern/bin/Release/net8.0-windows/win-x64/NetApp.exe"
);

// Escuchar mensajes del proceso .NET
net.stdout.on("data", function (data) {
  console.log(".NET: " + data.toString().trim());
});

net.stderr.on("data", function (data) {
  console.error(".NET Error: " + data.toString().trim());
});

// === WebSocket: Recibir comandos en tiempo real ===
wss.on("connection", function (ws) {
  console.log("🎮 Cliente WebSocket conectado");

  ws.on("message", function (message) {
    var cmd = message.toString();
    // Enviar directamente a C# sin procesar (máxima velocidad)
    // El formato será "movimiento,brincar,acelerar,disparar" para Kart
    net.stdin.write(cmd + "\r\n");
  });

  ws.on("close", function () {
    console.log("❌ Cliente WebSocket desconectado");
  });
});

// Ruta HTTP de respaldo (compatibilidad con versión vieja)
app.get("/", function (req, res) {
  net.stdin.write(
    (req.query.movimiento || "0") + "," +
    (req.query.brincar || "0") + "," +
    (req.query.acelerar || "0") + "," +
    (req.query.disparar || "0") +
    "\r\n"
  );
  res.send("OK");
});

// Servir archivos estáticos
app.use(express.static("public"));

// Iniciar servidor en puerto 3000
server.listen(3000, function () {
  console.log("===========================================");
  console.log("  🏎️  Servidor de Control Activo - MODO TURBO");
  console.log("  📡  WebSocket: ws://localhost:3000");
  console.log("  🌐  Volante:  http://localhost:3000/manos.html");
  console.log("  🕹️  Joystick: http://localhost:3000/joystick.html");
  console.log("===========================================");
});
