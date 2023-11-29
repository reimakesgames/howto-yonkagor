import express from "express"
import {
	type APIUser,
	type RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10"

export const auth = express.Router()

async function getToken(code: string) {
	const params = new URLSearchParams()
	params.set("grant_type", "authorization_code")
	params.set("code", code)
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

async function getUserData(access_token) {
	const response = await fetch("https://discord.com/api/v10/users/@me", {
		headers: {
			authorization: `Bearer ${access_token}`,
		},
	})

	return (await response.json()) as APIUser
}

auth.get("/callback", (req, res) => {
	const code = req.query.code

	if (typeof code !== "string") {
		res.status(400).send("Bad Request")
		return
	}

	getToken(code).then((token) => {
		console.log(token)
		getUserData(token.access_token).then((user) => {
			console.log(`User ${user.username}#${user.discriminator} logged in`)
		})
		res.redirect(
			`https://reimakesgames.github.io/howto-yonkagor/landing.html?access_token=${token.access_token}`
		)
	})
})
