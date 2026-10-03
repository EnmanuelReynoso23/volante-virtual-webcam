var express = require("express");
var app = express();
var spawn = require("child_process").spawn;

// Iniciar el programa de C# (.NET) como un subproceso
var net = spawn(
  "../net/NetAppModern/bin/Release/net10.0-windows/win-x64/NetApp.exe"
);

// Escuchar mensajes provenientes del proceso .NET (salida estándar)
net.stdout.on("data", function (data) {
  console.log("Mensaje recibido de .NET: " + data.toString());
});

// Escuchar errores del proceso .NET
net.stderr.on("data", function (data) {
  console.error("Error de .NET: " + data.toString());
});

// Ruta principal para recibir comandos desde el navegador
// Ejemplo: /?movimiento=-1&brincar=0&acelerar=1
app.get("/", function (req, res) {
  // Mostrar en consola los comandos recibidos
  console.log(
    "Comando recibido -> MOV:" + req.query.movimiento + 
    " | BRINCAR:" + req.query.brincar + 
    " | ACELERAR:" + req.query.acelerar
  );

  // Enviar los datos al proceso C# a través de la entrada estándar (stdin)
  // Formato simple: movimiento,brincar,acelerar (ej. "-1,0,1")
  net.stdin.write(
    req.query.movimiento +
      "," +
      req.query.brincar +
      "," +
      req.query.acelerar +
      "\r\n"
  );
  
  res.send("Comando procesado");
});

// Servir archivos estáticos (frontend) desde la carpeta 'public'
app.use(express.static("public"));

// Iniciar el servidor web en el puerto 3000
app.listen(3000, function () {
  console.log("Servidor iniciado en http://localhost:3000");
  console.log("Abre manos.html en el navegador para controlar Mario Kart 64");
});
