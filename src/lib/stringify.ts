import { ICommand } from "../model";

export function stringify(arg: ICommand) {
	const { data, id, type } = arg;
	return JSON.stringify({ type, data: JSON.stringify(data), id });
}
