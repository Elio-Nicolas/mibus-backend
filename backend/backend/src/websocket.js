const WebSocket = require("ws");

let clients = [];

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Conectado");
    clients.push(ws);

    ws.on("close", () => {
      console.log("Desconectado");
      clients = clients.filter((client) => client !== ws);
    });
  });
}

function broadcast(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

module.exports = { setupWebSocket, broadcast };
