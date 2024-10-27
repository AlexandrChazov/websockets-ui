import { DB } from "../model";

export function getAvailableRooms() {
	return Object.values(DB.rooms).filter((room) => room.roomUsers.length === 1);
}
