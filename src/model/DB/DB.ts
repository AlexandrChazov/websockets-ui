import { WebSocket } from "ws";
import { IRoom } from "../types";

export const DB: IDatabase = {
	players: {},
	rooms: {},
	winners: [
		{
			name: "google",
			wins: 5,
		},
	],
};

interface IDatabase {
	players: Record<
		string,
		{
			password: string;
			ws: WebSocket;
		}
	>;
	rooms: Record<number, IRoom>;
	winners: {
		name: string;
		wins: number;
	}[];
}
