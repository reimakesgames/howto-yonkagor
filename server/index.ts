import express from "express"
import dotenv from "dotenv"

import { auth } from "./auth.js"

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use("/auth", auth)

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})
