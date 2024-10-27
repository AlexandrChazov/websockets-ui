import { config } from "dotenv";
import { WebSocketServer } from "ws";
import {
	command,
	getAttackResult,
	getAvailableRooms,
	getCoordinates,
	getNewRoomId,
	roomInfo,
	stringify,
	turn,
	updateWinners,
} from "./lib";
import { DB, EStatus, EType, IShip } from "./model";

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
		console.log("Command:", type);
		console.log("data:", data);
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
							ws,
						},
					],
					currentPlayerIndex: "",
				};
				wss.clients.forEach((client) => {
					client.send(
						stringify({
							type: EType.UPDATE_ROOM,
							data: getAvailableRooms(),
							id: 0,
						}),
					);
				});
				break;
			}
			case EType.ADD_USER_TO_ROOM: {
				const { indexRoom } = data;
				const { room } = roomInfo(indexRoom, secWebsocketKey);
				if (!room) break;
				if (room.roomUsers[0].index === secWebsocketKey) break;
				currentRoomId = room.roomId;
				DB.rooms[indexRoom].roomUsers.push({
					name: userName,
					index: secWebsocketKey,
					ships: [],
					ws,
				});
				room.roomUsers.forEach(({ ws, index }) => {
					ws.send(
						stringify({
							type: EType.UPDATE_ROOM,
							data: getAvailableRooms(),
							id: 0,
						}),
					);
					ws.send(
						stringify({
							type: EType.CREATE_GAME,
							data: {
								idGame: room.roomId,
								idPlayer: index,
							},
							id: 0,
						}),
					);
				});
				break;
			}
			case EType.ADD_SHIPS: {
				const ships = data.ships as Omit<IShip, "coordinates">[];
				const { room, player } = roomInfo(currentRoomId, secWebsocketKey);
				if (!player) break;
				player.ships = ships.map((ship) => ({
					...ship,
					coordinates: getCoordinates(ship),
				}));
				const ready = room.roomUsers.filter(({ ships }) => {
					return ships.length > 0;
				});
				if (ready.length < 2) break;
				if (!room.currentPlayerIndex) {
					room.currentPlayerIndex =
						room.roomUsers[Math.random() < 0.5 ? 0 : 1].index;
				}
				room.roomUsers.forEach(({ ships, ws, index }) => {
					ws.send(
						stringify({
							type: EType.START_GAME,
							data: {
								ships,
								currentPlayerIndex: index,
							},
							id: 0,
						}),
					);
					turn(ws, room.currentPlayerIndex);
				});
				break;
			}
			case EType.ATTACK: {
				const { x, y, indexPlayer } = data;
				const { room } = roomInfo(currentRoomId, secWebsocketKey);
				if (indexPlayer !== room.currentPlayerIndex) break;
				const rival = room.roomUsers.find((user) => user.index !== indexPlayer);
				if (!rival) break;
				const attackResult = getAttackResult(rival, x, y);
				let currentPlayerIndex = rival.index;
				if (
					attackResult.length > 1 ||
					attackResult[0].status !== EStatus.MISS
				) {
					currentPlayerIndex = indexPlayer;
				}
				room.currentPlayerIndex = currentPlayerIndex;
				room.roomUsers.forEach(({ name, ws }) => {
					attackResult.forEach((result) => {
						DB.players[name].ws.send(
							stringify({
								type: EType.ATTACK,
								data: {
									position: result.coordinate,
									currentPlayer: indexPlayer,
									status: result.status,
								},
								id: 0,
							}),
						);
					});
					turn(ws, currentPlayerIndex);
				});
				if (rival.ships.length === 0) {
					room.roomUsers.forEach((user) => {
						const { ws } = user;
						ws.send(
							stringify({
								type: EType.FINISH,
								data: {
									winPlayer: indexPlayer,
								},
								id: 0,
							}),
						);
					});
					const winner = DB.winners.find((winner) => winner.name === userName);
					if (winner) {
						winner.wins += 1;
					} else {
						DB.winners.push({ name: userName, wins: 1 });
					}
					wss.clients.forEach((client) => {
						client.send(
							stringify({
								type: EType.UPDATE_WINNERS,
								data: DB.winners,
								id: 0,
							}),
						);
					});
					delete DB.rooms[currentRoomId];
				}
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
		// console.log("DB", DB);
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
