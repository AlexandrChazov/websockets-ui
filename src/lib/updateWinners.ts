import { WebSocket } from "ws";
import { DB, EType } from "../model";
import { stringify } from "./stringify";

export function updateWinners(ws: WebSocket) {
	ws.send(
		stringify({
			type: EType.UPDATE_WINNERS,
			data: DB.winners,
			id: 0,
		}),
	);
}
