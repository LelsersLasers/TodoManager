import { sendEmail } from '$lib/email/emailer.server';

export async function POST({ request }) {
	const { userEmail, userName, toEmail, listName, shareLink } = await request.json();

	const userObj = {
		email: userEmail,
		name: userName
	};

	let success = await sendEmail(userObj, toEmail, listName, shareLink);

	return new Response(JSON.stringify({ success }));
}
