import { type Response } from "express"

export function errorRedirect(res: Response, status: number) {
	res.status(status).redirect(
		`${process.env.CLIENT_URL}${process.env.CLIENT_SUBDIRECTORY}/error.html?status=${status}`
	)
}
