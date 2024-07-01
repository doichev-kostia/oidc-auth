import { z } from "zod";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { pipe } from "remeda";
import { base64ToString, stringToBase64 } from "uint8array-extras";

import * as auth from "./auth/index.js";

const seconds = {
	minute: 60,
	hour: 60 * 60,
	day: 60 * 60 * 24,
	week: 60 * 60 * 24 * 7,
};

const ENV_SCHEMA = z.object({
	GOOGLE_OAUTH_CLIENT_ID: z.string(),
	GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
	GITHUB_OAUTH_CLIENT_ID: z.string(),
	GITHUB_OAUTH_CLIENT_SECRET: z.string(),
})

const values = ENV_SCHEMA.parse(process.env);

export const config = {
	oauth: {
		google: {
			clientID: values.GOOGLE_OAUTH_CLIENT_ID,
			secret: values.GOOGLE_OAUTH_CLIENT_SECRET
		},
		github: {
			clientID: values.GITHUB_OAUTH_CLIENT_ID,
			secret: values.GITHUB_OAUTH_CLIENT_SECRET,
		}
	},
};

const address = new URL("http://localhost:3000");
const GOOGLE_CALLBACK = new URL("/auth/google/callback", address);
const GITHUB_CALLBACK = new URL("/auth/github/callback", address);

// for authentication
const authn = {
	google: auth.Google({
		clientID: config.oauth.google.clientID,
		clientSecret: config.oauth.google.secret,
		scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
		redirectURI: GOOGLE_CALLBACK.toString()
	}),
}

// for authorization

const authz = {
	google: auth.Google({
		clientID: config.oauth.google.clientID,
		clientSecret: config.oauth.google.secret,
		scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile",
		redirectURI: GOOGLE_CALLBACK.toString()
	}),
	github: auth.GitHub({
		clientID: config.oauth.github.clientID,
		clientSecret: config.oauth.github.secret,
		scope: "read:user user:email",
		redirectURI: GITHUB_CALLBACK.toString()
	})
}

/* Example usage */
const app = new Hono();

app.get("/auth/google/authorize", async c => {
	const { state, url} = await authn.google.authorize();

	const value = pipe(state, JSON.stringify, stringToBase64);
	setCookie(c, "state", value, {
		maxAge: 10 * seconds.minute,
		httpOnly: true,
		sameSite: "none",
		secure: true,
	});

	return c.redirect(url.toString())
});

app.get("/auth/google/callback", async c => {
	const cookie = getCookie(c, "state");
	if (!cookie) {
		return c.json({message: "No state"}, {status: 400});
	}
	const state = pipe(cookie, base64ToString, JSON.parse);
	const result = await authn.google.callback(new URL(c.req.url), state, GOOGLE_CALLBACK.toString());

	// do something with the tokens

	return c.redirect("/")
});
