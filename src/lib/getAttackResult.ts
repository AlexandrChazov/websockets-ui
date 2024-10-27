import { EStatus, IPlayer } from "../model";

export function getAttackResult(
	rival: IPlayer,
	x: number,
	y: number,
): IResult[] {
	const result: IResult[] = [{ status: EStatus.MISS, coordinate: { x, y } }];
	rival.ships.forEach((ship, index) => {
		if (ship.coordinates[`${x}${y}`]) {
			result.length = 0;
			ship.coordinates[`${x}${y}`] = false;
			result.push({ status: EStatus.SHOT, coordinate: { x, y } });
			if (!Object.values(ship.coordinates).includes(true)) {
				result.length = 0;
				Object.keys(ship.coordinates).forEach((key) => {
					result.push({
						status: EStatus.KILLED,
						coordinate: { x: +key[0], y: +key[1] },
					});
				});
				rival.ships.splice(index, 1);
			}
		}
	});
	return result;
}

interface IResult {
	status: EStatus;
	coordinate: { x: number; y: number };
}
