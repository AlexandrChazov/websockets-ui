import { WebSocket } from "ws";

export interface IRoom {
	roomId: number;
	roomUsers: IPlayer[];
	currentPlayerIndex: string;
}

export interface IShip {
	position: {
		x: number;
		y: number;
	};
	coordinates: Record<string, boolean>;
	direction: boolean;
	length: number;
	type: "small" | "medium" | "large" | "huge";
}

export interface IPlayer {
	name: string;
	index: string;
	ships: IShip[];
	ws: WebSocket;
}
