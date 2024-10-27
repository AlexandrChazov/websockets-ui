import { RawData } from "ws";

export function command(arg: RawData) {
	const { data, id, type } = JSON.parse(arg.toString());
	return {
		data: data === "" ? data : JSON.parse(data),
		id,
		type,
	};
}
