import { type Response } from "express"

export function errorRedirect(res: Response, status: number) {
	const BASE_URL = process.env.BASE_URL || "http://localhost:5500"
	const SUBDIRECTORY = process.env.SUBDIRECTORY || "client"

	const CLIENT_URL = `${BASE_URL}/${SUBDIRECTORY}`

	res.status(status).redirect(`${CLIENT_URL}/error.html?status=${status}`)
}
