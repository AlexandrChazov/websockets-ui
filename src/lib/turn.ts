import { WebSocket } from "ws";
import { stringify } from "./stringify";
import { EType } from "../model";

export function turn(ws: WebSocket, currentPlayer: string): void {
	ws.send(
		stringify({
			type: EType.TURN,
			data: {
				currentPlayer: currentPlayer,
			},
			id: 0,
		}),
	);
}
