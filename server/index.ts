import express from "express"
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()

import { auth } from "./auth.js"
import { boot, query } from "./postgres.js"

const app = express()
const port = process.env.PORT || 3000

boot()

app.use(
	cors({
		origin: "https://reimakesgames.github.io/", // allow only this origin
		credentials: true,
	})
)

app.use("/auth", auth)

app.get("/check", (req, res) => {
	const session_token = req.headers.authorization

	if (typeof session_token !== "string") {
		res.status(401).redirect(
			"https://reimakesgames.github.io/howto-yonkagor/error.html?status=401"
		)
		return
	}

	query(
		`
		SELECT * FROM sessions WHERE session = $1
	`,
		// split session into identifier and token
		[session_token.split(" ")[1]]
	)
		.then((result) => {
			if (result.rows.length === 0) {
				res.status(401).redirect(
					"https://reimakesgames.github.io/howto-yonkagor/error.html?status=401"
				)
				return
			}

			res.send("Pong")
		})
		.catch((err) => {
			console.error(err)
			res.status(500).redirect(
				"https://reimakesgames.github.io/howto-yonkagor/error.html?status=500"
			)
		})
})

app.listen(port, () => {
	console.log(`Active at PORT ${port}`)
})
