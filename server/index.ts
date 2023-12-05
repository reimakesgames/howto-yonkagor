import express from "express"
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()

import { auth } from "./auth.js"
import { boot } from "./postgres.js"
import { errorRedirect } from "./error_redirect.js"

const app = express()
const port = process.env.PORT || 3000

boot()

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	})
)

app.use("/auth", auth)

// redirect if any other route is accessed
app.get("*", (req, res) => {
	errorRedirect(res, 404)
})

app.listen(port, () => {
	console.log(`Active at PORT ${port}`)
})
