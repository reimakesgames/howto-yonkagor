import pg from "pg"
const { Pool } = pg

export let pool: pg.Pool

export async function boot() {
	const activePool = new Pool({
		connectionString: process.env.DATABASE_URL,
		host: process.env.DATABASE_HOST,
		port: Number(process.env.DATABASE_PORT),
		user: process.env.DATABASE_USER,
		password: process.env.DATABASE_PASSWORD,
		database: process.env.DATABASE_NAME,

		ssl: {
			rejectUnauthorized: false,
		},

		max: 20, // max number of clients in the pool
		idleTimeoutMillis: 3e4,
		connectionTimeoutMillis: 2e4,
	})

	pool = activePool

	return activePool
}

export async function query(text: string, params?: any[]) {
	return pool.query(text, params)
}
