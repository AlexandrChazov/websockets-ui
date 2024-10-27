export interface IRoom {
	roomId: number;
	roomUsers: IUser[];
	currentPlayerIndex: string;
}

interface IShip {
	position: {
		x: number;
		y: number;
	};
	direction: boolean;
	length: number;
	type: "small" | "medium" | "large" | "huge";
}

interface IUser {
	name: string;
	index: string;
	ships: IShip[];
}
