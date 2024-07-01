import * as oauth from "oauth4webapi";
import * as assert from "node:assert";
import type { AuthClient } from "./auth.js";
import { type Logger, noopLogger } from "../logger.js";
import { AuthChallengeError, AuthError } from "./errors.js";

export type OIDCOptions = {
	authorizationServer: oauth.AuthorizationServer;
	clientID: string;
	clientSecret: string
	redirectURI?: string;
	scope: string;
	params?: Record<string, string>
	logger?: Logger;
}

export function OIDC(options: OIDCOptions): AuthClient {
	const code_challenge_method = "S256";
	const logger = options.logger ?? noopLogger;

	const as = options.authorizationServer;
	assert.ok(!!as.authorization_endpoint, "The authz server should have an authorization endpoint");
	const client = {
		client_id: options.clientID,
		client_secret: options.clientSecret,
		token_endpoint_auth_method: "client_secret_basic",
	} satisfies oauth.Client;

	/**
	 * @returns {URL} with code_challenge and state
	 * @throws {Error} in case the redirect URI is not specified via constructor or passed via arguments
	 */
	async function authorize(redirectURI?: string): Promise<{
		url: URL;
		state: {
			code_verifier: string;
			state?: string;
		}
	}> {
		if (!redirectURI) {
			redirectURI = options.redirectURI;
		}
		if (!redirectURI) {
			throw new Error("Redirect URI should be specified either in the constructor or passed as an argument")
		}
		const code_verifier = oauth.generateRandomCodeVerifier();
		const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
		let state: string | undefined;

		const authorizationURL = new URL(as.authorization_endpoint!);
		authorizationURL.searchParams.set("client_id", client.client_id);
		authorizationURL.searchParams.set("redirect_uri", redirectURI);
		authorizationURL.searchParams.set("response_type", "code");
		authorizationURL.searchParams.set("scope", options.scope);
		authorizationURL.searchParams.set("code_challenge", code_challenge);
		authorizationURL.searchParams.set("code_challenge_method", code_challenge_method);

		if (options.params) {
			for (const key in options.params) {
				authorizationURL.searchParams.set(key, options.params[key]!)
			}
		}

		if (as.code_challenge_methods_supported?.includes(code_challenge_method) !== true) {
			state = oauth.generateRandomState();
			authorizationURL.searchParams.set("state", state);
		}

		return {
			url: authorizationURL,
			state: {
				code_verifier,
				state,
			}
		}
	}

	/**
	 *
	 * @param url - the one the authz server redirected back to
	 * @param state
	 * @param redirectURI
	 */
	async function callback(url: URL, state: {
		code_verifier: string;
		state?: string
	}, redirectURI?: string): Promise<oauth.OpenIDTokenEndpointResponse> {
		if (!redirectURI) {
			redirectURI = options.redirectURI
		}
		assert.ok(redirectURI, "Redirect URI should be specified");
		const params = oauth.validateAuthResponse(as, client, url, state.state);
		if (oauth.isOAuth2Error(params)) {
			logger.error(params, 'oidc response error')
			throw new AuthError()
		}

		const response = await oauth.authorizationCodeGrantRequest(
			as,
			client,
			params,
			redirectURI,
			state.code_verifier,
		);

		let challenges = oauth.parseWwwAuthenticateChallenges(response);
		if (Array.isArray(challenges)) {
			for (const challenge of challenges) {
				logger.error(challenge, 'WWW-Authenticate Challenge')
			}
			throw new AuthChallengeError();
		}


		const result = await oauth.processAuthorizationCodeOpenIDResponse(as, client, response);
		if (oauth.isOAuth2Error(result)) {
			logger.error(result, 'oidc response error')
			throw new AuthError()
		}

		return result
	}

	return {
		authorize,
		callback
	};
}
