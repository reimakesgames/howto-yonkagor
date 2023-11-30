async function getUserData(access_token) {
	const response = await fetch("https://discord.com/api/v10/users/@me", {
		headers: {
			authorization: `Bearer ${access_token}`,
		},
	})

	return await response.json()
}

export let user = JSON.parse(localStorage.getItem("user"))

export function getProfile() {
	let profileUrl = localStorage.getItem("profile_url")

	if (!profileUrl) {
		const user = JSON.parse(localStorage.getItem("user"))
		if (user.avatar === null) {
			let id = user.discriminator % 5
			profileUrl = `https://cdn.discordapp.com/embed/avatars/${id}.png`
		} else {
			profileUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
		}
		localStorage.setItem("profile_url", profileUrl)
	}
	return profileUrl
}

export function login(forceNewToken) {
	// if forceNewToken is true, don't use the token from local storage
	const urlParams = new URLSearchParams(window.location.search)
	const access_token = forceNewToken
		? urlParams.get("access_token")
		: localStorage.getItem("access_token")

	console.log("access_token", access_token)

	if (access_token) {
		getUserData(access_token).then((data) => {
			localStorage.setItem("user", JSON.stringify(data))
			localStorage.setItem("access_token", access_token)
		})
	}
}

export function logout() {
	localStorage.removeItem("user")
	localStorage.removeItem("access_token")
	localStorage.removeItem("profile_url")
}
