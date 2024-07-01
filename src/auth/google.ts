import * as oauth from "oauth4webapi";
import { OIDC } from "./oidc.js";
import type { AuthClient } from "./auth.js";

type GoogleOptions = {
	clientID: string;
	clientSecret: string
	// https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
	scope: string;
	redirectURI?: string;
	accessType?: "offline" | "online"
};
// https://developers.google.com/identity/protocols/oauth2/web-server
const issuer = new URL("https://accounts.google.com");
// https://accounts.google.com/.well-known/openid-configuration
const authzServer = {
	issuer: issuer.toString(),
	authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
	device_authorization_endpoint: "https://oauth2.googleapis.com/device/code",
	token_endpoint: "https://oauth2.googleapis.com/token",
	userinfo_endpoint: "https://openidconnect.googleapis.com/v1/userinfo",
	revocation_endpoint: "https://oauth2.googleapis.com/revoke",
	jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
	response_types_supported: [
		"code",
		"token",
		"id_token",
		"code token",
		"code id_token",
		"token id_token",
		"code token id_token",
		"none"
	],
	subject_types_supported: [
		"public"
	],
	id_token_signing_alg_values_supported: [
		"RS256"
	],
	scopes_supported: [
		"openid",
		"email",
		"profile"
	],
	token_endpoint_auth_methods_supported: [
		"client_secret_post",
		"client_secret_basic"
	],
	claims_supported: [
		"aud",
		"email",
		"email_verified",
		"exp",
		"family_name",
		"given_name",
		"iat",
		"iss",
		"name",
		"picture",
		"sub"
	],
	code_challenge_methods_supported: [
		"plain",
		"S256"
	],
	grant_types_supported: [
		"authorization_code",
		"refresh_token",
		"urn:ietf:params:oauth:grant-type:device_code",
		"urn:ietf:params:oauth:grant-type:jwt-bearer"
	]
} satisfies oauth.AuthorizationServer

export function Google(options: GoogleOptions): AuthClient {

	const params: Record<string, string> = {};

	if (options.accessType) {
		params.access_type = options.accessType;
	}

	return OIDC({
		authorizationServer: authzServer,
		redirectURI: options.redirectURI,
		clientSecret: options.clientSecret,
		clientID: options.clientID,
		scope: options.scope,
		params
	})
}
