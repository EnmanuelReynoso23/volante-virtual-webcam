# 🎮 Volante Virtual con Webcam

Sistema de control de videojuegos mediante gestos manuales detectados por cámara web. Permite conducir en simuladores usando las manos como volante virtual.

## 📋 Descripción

Este proyecto implementa un sistema de control gestual que detecta la posición e inclinación de las manos del usuario para controlar un vehículo en simuladores de conducción. Utiliza visión artificial para:

- **Dirección**: La inclinación entre las manos determina el giro (izquierda/derecha)
- **Aceleración**: Manos abiertas = acelerar
- **Frenado**: Puños cerrados = frenar

## 🛠️ Tecnologías

- **Frontend**: HTML5, JavaScript, MediaPipe Hands
- **Backend**: Node.js + Express
- **Control**: C# .NET (Windows API - SendInput)

## 🚀 Instalación

### Requisitos

- Node.js 18+
- .NET 10 SDK
- Webcam
- Windows 10/11

### Pasos

1. **Clonar el repositorio**

```bash
git clone https://github.com/TU_USUARIO/volante-virtual-webcam.git
cd volante-virtual-webcam
```

2. **Compilar el módulo de control (.NET)**

```bash
cd net/NetAppModern
dotnet build -c Release
cd ../..
```

3. **Iniciar el servidor**

```bash
cd node
npm install
node index.js
```

4. **Abrir en el navegador**

```
http://localhost:3000/manos.html
```

## 🎯 Controles

| Gesto                           | Acción          | Tecla |
| ------------------------------- | --------------- | ----- |
| 🖐️🖐️ Manos abiertas             | Acelerar        | C     |
| ✊✊ Puños cerrados             | Frenar          | X     |
| ↙️ Inclinación izquierda (+15°) | Girar izquierda | A     |
| ↘️ Inclinación derecha (-15°)   | Girar derecha   | D     |

## 📐 Fundamento Físico

El sistema calcula el ángulo de inclinación usando trigonometría:

```
θ = arctan((Y_derecha - Y_izquierda) / (X_derecha - X_izquierda))
```

Si θ > 15° → Giro izquierda (Tecla A)
Si θ < -15° → Giro derecha (Tecla D)

## 📁 Estructura del Proyecto

```
volante-virtual-webcam/
├── node/                    # Servidor web
│   ├── index.js            # Servidor Express
│   └── public/
│       └── manos.html      # Interfaz de detección
├── net/
│   └── NetAppModern/       # Controlador de teclado
│       └── Program.cs      # Simulación de teclas
└── README.md
```

## 📸 Capturas

El sistema muestra en tiempo real:

- Los 21 landmarks de cada mano
- Línea de conexión entre manos (verde = acelerando, rojo = frenando)
- Ángulo de inclinación calculado
- Teclas activas

## 👨‍💻 Autor

**Enmanuel Reynoso Salazar**

Proyecto desarrollado para el curso de Física General - UAPA

## 📄 Licencia

MIT License - Libre para uso educativo y personal.
