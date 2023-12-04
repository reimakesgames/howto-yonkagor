import pg from "pg"
const { Client } = pg
import dotenv from "dotenv"
dotenv.config()

// CREATE TABLE IF NOT EXISTS users (
// 	id varchar(255) PRIMARY KEY,
// 	username TEXT NOT NULL,
// 	discriminator TEXT NOT NULL,
// 	avatar TEXT,
// 	access_token TEXT NOT NULL,
// 	refresh_token TEXT NOT NULL,
// 	expires_in BIGINT NOT NULL,
// 	created_at TIMESTAMP NOT NULL DEFAULT NOW()
// );

// add dummy session and user_id to sessions table
const QUERY = `
	INSERT INTO sessions (
		session,
		user_id
	) VALUES (
		$1,
		$2
	)
`

const PARAMS = ["session_token", "906204724200624138"]
// const PARAMS = []

const client = new Client({
	connectionString: process.env.DATABASE_URL,
	host: process.env.DATABASE_HOST,
	port: Number(process.env.DATABASE_PORT),
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME,

	ssl: {
		rejectUnauthorized: false,
	},
})

client
	.connect()
	.then(() => {
		console.log("connected")

		return client.query(QUERY, PARAMS)
	})
	.catch((err) => {
		console.error(err)
	})
	.finally(() => {
		client.end()
	})
