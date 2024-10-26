import { ICommand } from "../model/types";

export function command(arg: string) {
	const { data, id, type } = JSON.parse(arg.toString()) as ICommand;
	return {
		data: JSON.parse(data),
		id,
		type,
	};
}
