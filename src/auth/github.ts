import * as oauth from "oauth4webapi";
import { OAuth } from "./oauth.js";
import type { AuthClient } from "./auth.js";

type GitHubOptions = {
	clientID: string;
	clientSecret: string
	// https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
	scope: string;
	redirectURI?: string;
}

const issuer = new URL("https://github.com");
const authzServer = {
	issuer: issuer.toString(),
	// https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
	authorization_endpoint: "https://github.com/login/oauth/authorize",
	token_endpoint: "https://github.com/login/oauth/access_token",
} satisfies oauth.AuthorizationServer;

export function GitHub(options: GitHubOptions): AuthClient {
	return OAuth({
		authorizationServer: authzServer,
		redirectURI: options.redirectURI,
		clientSecret: options.clientSecret,
		clientID: options.clientID,
		scope: options.scope,
	})
}
