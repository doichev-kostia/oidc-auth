
export type LogFn = {
	(obj: unknown, msg?: string, ...args: any[]): void;
	(msg: string, ...args: any[]): void;
};

export interface Logger {
	info: LogFn;
	warn: LogFn;
	error: LogFn;
	debug: LogFn;
}

export const noopLogger: Logger = {
	info() {},
	debug() {},
	warn() {},
	error() {},
};
