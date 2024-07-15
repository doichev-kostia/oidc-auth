export function ok(value: unknown, message: string | Error): asserts value {
	if (Boolean(value)) {
		return;
	}

	if (typeof message === "string") {
		throw new Error(message)
	} else {
		throw message
	}
}

