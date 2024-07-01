import * as oauth from "oauth4webapi";

export interface AuthClient {
	authorize(redirectURI?: string): Promise<{
		url: URL,
		state: {
			code_verifier: string;
			state?: string;
		}
	}>;
	callback(url: URL, state: {
		code_verifier: string;
		state?: string;
	}, redirectURI?: string): Promise<oauth.TokenEndpointResponse>;
}
