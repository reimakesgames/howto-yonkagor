import express from "express"
import {
	type APIUser,
	type RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10"
import { query } from "./postgres.js"
import { randomUUID } from "crypto"
import { errorRedirect } from "./error_redirect.js"

function getTimeSinceEpoch() {
	return Math.floor(new Date().getTime() / 1000)
}

let recentCodeUsers: string[] = []

export const auth = express.Router()

async function getToken(code: string) {
	const params = new URLSearchParams()
	params.set("grant_type", "authorization_code")
	params.set("code", code)
	params.set("redirect_uri", `${process.env.SERVER_URL}/auth/callback`)

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

function saveUserToDB(user: APIUser, token: RESTPostOAuth2AccessTokenResult) {
	return query(
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
}

function saveSessionToDB(session: string, user_id: string) {
	return query(
		`
		INSERT INTO sessions (
			session,
			user_id
		) VALUES (
			$1,
			$2
		)
		`,
		[session, user_id]
	)
}

/**
 * API endpoint that regenerates the user's access token
 *
 * Doesn't utilize the refresh_token handed, but instead creates a new one
 */
auth.get("/callback", async (req, res) => {
	const code = req.query.code
	console.log(`Entry code is ${code}`)
	if (recentCodeUsers.includes(code?.toString() ?? "")) {
		console.warn("Code already used, doing nothing")
		return
	}
	recentCodeUsers.push(code?.toString() ?? "")

	if (typeof code !== "string") {
		res.status(400).send("Bad Request")
		return
	}

	const sessionToken = randomUUID()
	const token = await getToken(code)

	const user = await getUserData(token.access_token)

	console.log(`User: ${user.username}#${user.discriminator} (${user.id})`)
	console.log(`Session token: ${sessionToken}`)

	await saveUserToDB(user, token)
	await saveSessionToDB(sessionToken, user.id.toString())

	res.cookie("session", sessionToken, {
		// domain: process.env.SERVER_URL,
		httpOnly: true,
		secure: true,
		// sameSite: "strict",
		sameSite: "none",
	})
	res.redirect(
		`${process.env.CLIENT_URL}${process.env.CLIENT_SUBDIRECTORY}/landing.html?session=${sessionToken}`
	)
	console.warn("Redirected")
})

auth.get("/check", async (req, res) => {
	if (req.cookies === undefined) {
		errorRedirect(res, 401)
		console.error("No cookies provided")
		return
	}

	const session_token = req.cookies.session

	if (typeof session_token !== "string") {
		errorRedirect(res, 401)
		console.error("No session token provided")
		return
	}

	const token = session_token.split(" ")[1]

	if (token === undefined) {
		errorRedirect(res, 400)
		console.error("No token provided")
		return
	}

	try {
		query(
			`
			SELECT * FROM sessions WHERE session = $1
		`,
			[token]
		).then((result) => {
			if (result.rows.length === 0) {
				errorRedirect(res, 401)
				console.error("No existing session found")
				return
			}

			res.status(200).send("OK")
		})
	} catch (error) {
		errorRedirect(res, 500)
		console.error(`/Check Query Failed!`)
		console.error(error)
	}
})
