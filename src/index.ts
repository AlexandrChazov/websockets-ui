import { config } from "dotenv";
import WebSocket, { WebSocketServer } from "ws";
import { command } from "./lib";

config();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

const wss = new WebSocketServer({ host: HOST, port: PORT });
console.log(`Server started on host "${HOST}", port "${PORT}"`);

wss.on("connection", function connection(ws) {
	console.log("connection");
	ws.on("error", console.error);

	ws.on("message", function message(buffer, isBinary) {
		const { data, id, type } = command(buffer);
		console.log("id", id);
		console.log("type", type);
		console.log("data", data);
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(data, { binary: isBinary });
			}
		});
	});

	ws.on("close", function close() {
		console.log("close");
	});
});

wss.on("close", function close() {
	console.log("close");
});
