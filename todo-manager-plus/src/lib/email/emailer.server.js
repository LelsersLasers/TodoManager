/* eslint-disable svelte/no-inner-declarations */
/* eslint-disable no-inner-declarations */

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
		function sendEmailToSharedWith() {
			// send email to other user
			const subject = `Todo list shared with you: '${listName}' (from ${userObj.name})`;
			const text = `${userObj.name} (${userObj.email}) has shared a todo list with you. Click on the link to view the list: ${shareLink}`;

			const html = `<p>${userObj.name} (${userObj.email}) has shared a todo list with you. Click on the link to view the list: <a href="${shareLink}">${shareLink}</a></p>`;

			return transporter.sendMail({
				from,
				to: toEmail,
				subject,
				text,
				html
			});
		}
		function sendEmailToSharer() {
			// send email to user
			const subject = `Todo list shared with ${toEmail}: '${listName}'`;
			const text = `You have shared a todo list with ${toEmail}. Click on the link to view the list: ${shareLink}`;

			const html = `<p>You have shared a todo list with ${toEmail}. Click on the link to view the list: <a href="${shareLink}">${shareLink}</a></p>`;

			return transporter.sendMail({
				from,
				to: userObj.email,
				subject,
				text,
				html
			});
		}

		// send both emails at the same time
		const sendEmailOnePromise = sendEmailToSharedWith();
		const sendEmailTwoPromise = sendEmailToSharer();

		await sendEmailOnePromise;
		await sendEmailTwoPromise;
	} catch (err) {
		return false;
	}
	return true;
}
