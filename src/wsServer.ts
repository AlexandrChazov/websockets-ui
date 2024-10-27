import { config } from "dotenv";
import { WebSocketServer } from "ws";
import {
	command,
	getNewRoomId,
	getAvailableRooms,
	stringify,
	updateWinners,
	turn,
} from "./lib";
import { DB, EType } from "./model";

config();
const PORT = Number(process.env.PORT);
const HOST = process.env.HOST;

const wss = new WebSocketServer({ host: HOST, port: PORT });
console.log(`Server started on host "${HOST}", port "${PORT}"`);

wss.on("connection", function connection(ws, request) {
	const secWebsocketKey = request.headers["sec-websocket-key"];
	let userName = "";
	let currentRoomId = 0;

	ws.on("message", function message(buffer) {
		const { data, type } = command(buffer);
		switch (type) {
			case EType.REG: {
				const { name, password } = data as { name: string; password: string };
				userName = name;
				const passwordDB = DB.players[name]?.password;
				if (passwordDB && passwordDB !== password) {
					ws.send(
						stringify({
							type: EType.REG,
							data: {
								name,
								index: secWebsocketKey,
								error: true,
								errorText: "Invalid Name or Password",
							},
							id: 0,
						}),
					);
					break;
				}
				DB.players[name] = { password, ws };
				ws.send(
					stringify({
						type: EType.REG,
						data: {
							name,
							index: secWebsocketKey,
							error: false,
							errorText: "",
						},
						id: 0,
					}),
				);
				ws.send(
					stringify({
						type: EType.UPDATE_ROOM,
						data: getAvailableRooms(),
						id: 0,
					}),
				);
				updateWinners(ws);
				break;
			}
			case EType.CREATE_ROOM: {
				const roomId = getNewRoomId();
				currentRoomId = roomId;
				DB.rooms[roomId] = {
					roomId,
					roomUsers: [
						{
							name: userName,
							index: secWebsocketKey,
							ships: [],
						},
					],
					currentPlayerIndex: "",
				};
				ws.send(
					stringify({
						type: EType.UPDATE_ROOM,
						data: getAvailableRooms(),
						id: 0,
					}),
				);
				break;
			}
			case EType.ADD_USER_TO_ROOM: {
				const { indexRoom } = data;
				const room = Object.values(DB.rooms).find(
					({ roomId }) => roomId === indexRoom,
				);
				if (!room) break;
				currentRoomId = room.roomId;
				DB.rooms[currentRoomId].roomUsers.push({
					name: userName,
					index: secWebsocketKey,
					ships: [],
				});
				room.roomUsers.forEach((user) => {
					const wsClient = DB.players[user.name].ws;
					wsClient.send(
						stringify({
							type: EType.CREATE_GAME,
							data: {
								idGame: room.roomId,
								idPlayer: secWebsocketKey,
							},
							id: 0,
						}),
					);
				});
				break;
			}
			case EType.ADD_SHIP: {
				const ships = data.ships;
				const currentRoom = DB.rooms[currentRoomId];
				const user = currentRoom.roomUsers.find(
					(user) => user.index === secWebsocketKey,
				);
				if (!user) break;
				user.ships = ships;
				currentRoom.currentPlayerIndex =
					currentRoom.roomUsers[Math.random() < 0.5 ? 0 : 1].index;
				const ready = DB.rooms[currentRoomId].roomUsers.filter(({ ships }) => {
					return ships.length > 0;
				});
				if (ready.length < 2) break;
				currentRoom?.roomUsers.forEach((user) => {
					const wsClient = DB.players[user.name].ws;
					wsClient.send(
						stringify({
							type: EType.START_GAME,
							data: {
								ships: ships,
								currentPlayerIndex: secWebsocketKey,
							},
							id: 0,
						}),
					);
					turn(ws, currentRoom.currentPlayerIndex);
				});
				break;
			}
			default: {
				ws.send(
					stringify({
						type: "",
						data: {
							error: true,
							errorText: "Wrong command",
						},
						id: 0,
					}),
				);
			}
		}
		console.log("DB", DB);
	});

	ws.on("close", function close() {
		console.log("close");
	});
	ws.on("error", console.error);
});

wss.on("close", function close() {
	console.log("close");
});

process.on("uncaughtException", console.error);
