import { DB } from "../model";

export function getNewRoomId(): number {
	let result = 1;
	Object.keys(DB.rooms).forEach((roomId) => {
		const id = Number(roomId);
		if (id >= result) {
			result = id + 1;
		}
	});
	return result;
}
