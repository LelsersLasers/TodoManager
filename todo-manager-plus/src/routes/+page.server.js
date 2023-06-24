export async function load({ setHeaders }) {
	setHeaders({
		'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
	});
}
