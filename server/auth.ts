import express from "express"
import {
	type APIUser,
	type RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10"
import { query } from "./postgres.js"
import { randomUUID } from "crypto"

function getTimeSinceEpoch() {
	return Math.floor(new Date().getTime() / 1000)
}

export const auth = express.Router()

async function getToken(code: string) {
	const params = new URLSearchParams()
	params.set("grant_type", "authorization_code")
	params.set("code", code)
	// params.set("redirect_uri", "https://howtoapi.reicaffie.xyz/auth/callback")
	params.set("redirect_uri", "http://localhost:3000/auth/callback")

	const authorization = `Basic ${btoa(
		`${process.env.DISCORD_CLIENT_ID}:${process.env.DISCORD_CLIENT_SECRET}`
	)}`

	const response = await fetch("https://discord.com/api/v10/oauth2/token", {
		method: "POST",
		body: params,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			authorization: authorization,
		},
	})

	return (await response.json()) as RESTPostOAuth2AccessTokenResult
}

async function getUserData(access_token: string) {
	const response = await fetch("https://discord.com/api/v10/users/@me", {
		headers: {
			authorization: `Bearer ${access_token}`,
		},
	})

	return (await response.json()) as APIUser
}

/**
 * API endpoint that regenerates the user's access token
 *
 * Doesn't utilize the refresh_token handed, but instead creates a new one
 */
auth.get("/callback", (req, res) => {
	const code = req.query.code

	if (typeof code !== "string") {
		res.status(400).send("Bad Request")
		return
	}

	getToken(code).then((token) => {
		const session_token = randomUUID()

		getUserData(token.access_token).then((user) => {
			console.log(`User ${user.username}#${user.discriminator} logged in`)

			query(
				`
				INSERT INTO users (
					id,
					username,
					discriminator,
					avatar,
					access_token,
					refresh_token,
					expires_in
				) VALUES (
					$1,
					$2,
					$3,
					$4,
					$5,
					$6,
					$7
				) ON CONFLICT (id) DO UPDATE SET
					username = $2,
					discriminator = $3,
					avatar = $4,
					access_token = $5,
					refresh_token = $6,
					expires_in = $7
				`,
				[
					user.id.toString(),
					user.username,
					user.discriminator,
					user.avatar,
					token.access_token,
					token.refresh_token,
					// TODO: figure out how to do the timeout things properly
					// good temporary fix is to add the time since epoch to the expires_in
					token.expires_in + getTimeSinceEpoch(),
				]
			)

			query(
				`
				INSERT INTO sessions (
					session,
					user_id
				) VALUES (
					$1,
					$2
				)
				`,
				[session_token, user.id.toString()]
			)
		})
		// res.redirect(
		// 	`https://reimakesgames.github.io/howto-yonkagor/landing.html?access_token=${token.access_token}`
		// )
		res.cookie("session", session_token, {
			// domain: "https://howtoapi.reicaffie.xyz",
			domain: "http://localhost:3000",
			httpOnly: true,
			secure: true,
			sameSite: "strict",
		})
		res.redirect(
			`http://localhost:5500/client/landing.html?session=${session_token}`
		)
	})
})
