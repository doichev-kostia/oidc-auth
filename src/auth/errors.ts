const AuthErrorTag = Symbol("auth-error");

export class AuthError extends Error {
	readonly _tag= AuthErrorTag;

	constructor(message?: string) {
		super(message ?? "auth error");
		this.name = this.constructor.name;

		if (typeof Error.captureStackTrace === "function" && Error.stackTraceLimit !== 0) {
			Error.captureStackTrace(this, this.constructor);
		}
	}


	static is(err: unknown): err is AuthError {
		if (typeof err !== "object" || err == null || Array.isArray(err)) {
			return false;
		}

		return Reflect.get(err, "_tag") === AuthErrorTag;
	}
}

const AuthChallengeErrorTag = Symbol("auth-challenge-error");

export class AuthChallengeError extends Error {
	readonly _tag = AuthChallengeErrorTag;

	constructor(message?: string) {
		super(message ?? "auth challenge error");
		this.name = this.constructor.name;

		if (typeof Error.captureStackTrace === "function" && Error.stackTraceLimit !== 0) {
			Error.captureStackTrace(this, this.constructor)
		}
	}

	static is(err: unknown): err is AuthChallengeError {
		if (typeof err !== "object" || err == null || Array.isArray(err)) {
			return false;
		}

		return Reflect.get(err, "_tag") === AuthChallengeErrorTag;
	}
}
