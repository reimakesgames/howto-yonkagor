async function getUserData(access_token) {
	const response = await fetch("https://discord.com/api/v10/users/@me", {
		headers: {
			authorization: `Bearer ${access_token}`,
		},
	})

	return await response.json()
}

/**
 * Sets a cookie

 * @param {string} name The cookie identifier
 * @param {string} value The value you want added
 * @param {number?} days Days until the cookie expires
 */
function setCookie(name, value, days) {
	let expires = ""
	if (days) {
		let date = new Date()
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
		expires = "; expires=" + date.toUTCString()
	}
	let cookie = name + "=" + (value || "") + expires
	document.cookie = cookie
}

function getCookie(name) {
	let nameEQ = name + "="
	let ca = document.cookie.split(";")
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i]
		while (c.charAt(0) == " ") c = c.substring(1, c.length)
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
	}
	return null
}

function eraseCookie(name) {
	document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC"
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

export function login() {
	fetch("https://howtoapi.reicaffie.xyz/auth/check", {
		// fetch("http://localhost:3000/auth/check", {
		method: "GET",
		credentials: "include",
	}).then(async (response) => {
		if (response.status === 200) {
			if (response.url.includes("401")) {
				alert(
					"You don't have credentials, please login first. If this is a mistake, please contact rei."
				)
				window.location.href =
					"https://discord.com/api/oauth2/authorize?client_id=1179392532040392745&redirect_uri=https%3A%2F%2Fhowtoapi.reicaffie.xyz%2Fauth%2Fcallback&response_type=code&scope=guilds%20identify"
				// "https://discord.com/api/oauth2/authorize?client_id=1179392532040392745&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&response_type=code&scope=identify%20guilds"
			} else {
				alert("Your token is valid!")
			}
		}
	})
}

export function saveSessionToken() {
	const urlParams = new URLSearchParams(window.location.search)
	const sessionToken = urlParams.get("session")
	if (sessionToken) {
		setCookie("session", atob(sessionToken), 7)
	}
}

export function logout() {
	localStorage.removeItem("user")
	localStorage.removeItem("access_token")
	localStorage.removeItem("profile_url")

	eraseCookie("session")
}
