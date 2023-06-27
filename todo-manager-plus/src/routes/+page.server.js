export async function load({ setHeaders, url }) {
	// For Google/Firebase OAuth
	// Doesn't seem to stop red text in console, but seems to work
	setHeaders({
		'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
	});

	const urlSearchParams = url.searchParams;
	const shareListId = urlSearchParams.get('sharedListId');
	const shareListName = urlSearchParams.get('sharedListName');

	return {
		shareListId,
		shareListName
	};
}
