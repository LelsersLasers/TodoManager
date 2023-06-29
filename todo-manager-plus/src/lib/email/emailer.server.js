import { EMAILER_EMAIL, EMAILER_APP_PASSWORD } from '$env/static/private';

import { createTransport } from 'nodemailer';

const transporter = createTransport({
	host: 'smtp.gmail.com',
	service: 'gmail',
	port: 587,
	secure: false,
	auth: {
		user: EMAILER_EMAIL,
		pass: EMAILER_APP_PASSWORD
	}
});

export async function sendEmail(userObj, toEmail, listName, shareLink) {
	const from = `Todo Manager+ <${EMAILER_EMAIL}>`;

	try {
		{
			// send email to other user
			const subject = `Todo list shared with you: '${listName} (from ${userObj.name})'`;
			const text = `${userObj.name} (${userObj.email}) has shared a todo list with you. Click on the link to view the list: ${shareLink}`;

			// TODO: improve this html
			const html = `<p>${userObj.name} (${userObj.email}) has shared a todo list with you. Click on the link to view the list: <a href="${shareLink}">${shareLink}</a></p>`;

			await transporter.sendMail({
				from,
				to: toEmail,
				subject,
				text,
				html
			});
		}
		{
			// send email to user
			const subject = `Todo list shared with ${toEmail}: '${listName}'`;
			const text = `You have shared a todo list with ${toEmail}. Click on the link to view the list: ${shareLink}`;

			// TODO: improve this html
			const html = `<p>You have shared a todo list with ${toEmail}. Click on the link to view the list: <a href="${shareLink}">${shareLink}</a></p>`;

			await transporter.sendMail({
				from,
				to: userObj.email,
				subject,
				text,
				html
			});
		}
	} catch (err) {
		return false;
	}
	return true;
}
