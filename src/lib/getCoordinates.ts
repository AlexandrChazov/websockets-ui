import { IShip } from "../model";

export function getCoordinates(
	ship: Omit<IShip, "coordinates">,
): Record<string, boolean> {
	const result = {};
	const {
		direction,
		length,
		position: { x, y },
	} = ship;
	result[`${x}${y}`] = true;
	let increment: number;
	for (let i = 1; i < length; i++) {
		if (direction) {
			increment = y + i;
			result[`${x}${increment}`] = true;
		} else {
			increment = x + i;
			result[`${increment}${y}`] = true;
		}
	}
	return result;
}
