import { DB, IPlayer, IRoom } from "../model";

export function roomInfo(roomId: number, userId: string): IResponse {
	const room = DB.rooms[roomId];
	const player = room.roomUsers.find((user) => user.index === userId);
	return { room, player };
}

interface IResponse {
	room: IRoom;
	player: IPlayer;
}
