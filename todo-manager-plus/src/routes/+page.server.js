export async function load({ setHeaders }) {
	// For Google/Firebase OAuth
	// Doesn't seem to stop red text in console, but seems to work
	setHeaders({
		'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
	});
}
