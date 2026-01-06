import * as emails from './emailContent.mjs';

const FROM_NAME = process.env.MAIL_FROM;
const FROM_EMAIL = process.env.MAIL_EMAIL;
const FROM_DOMAIN = FROM_EMAIL.split('@')[1];
const MAIL_API_KEY = process.env.MAIL_API_KEY;

async function sendEmail(formData) {
  // Don't catch errors in here. Let express middleware handle it.
  const response = await fetch(
    `https://api.mailgun.net/v3/${FROM_DOMAIN}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' + Buffer.from(`api:${MAIL_API_KEY}`).toString('base64'),
      },
      body: formData,
    },
  );

  if (response.ok) {
    const json = await response.json();
    console.log('mail submitted to mailgun api:', json);
  } else {
    const text = await response.text();
    console.log('mail failed to send via mailgun api:', text);
  }
}

function createEmailFormData(recipient, subject, html) {
  const formData = new FormData();
  formData.append('domain_name', FROM_DOMAIN);
  formData.append('from', `"${FROM_NAME}" <${FROM_EMAIL}>`);
  formData.append('to', recipient);
  formData.append('subject', subject);
  formData.append('html', html);
  return formData;
}

async function sendSignUpConfirmEmail(recipient, token) {
  const email = emails.createSignUpConfirmEmail(token);
  const form = createEmailFormData(recipient, email.subject, email.html);
  await sendEmail(form);
}

async function sendAttemptedSignUpEmail(recipient) {
  const email = emails.createAttemptedSignUpEmail();
  const form = createEmailFormData(recipient, email.subject, email.html);
  await sendEmail(form);
}

async function sendPasswordResetEmail(recipient, token) {
  const email = emails.createPasswordResetEmail(token);
  const form = createEmailFormData(recipient, email.subject, email.html);
  await sendEmail(form);
}

async function sendAccountDeleteEmail(recipient, token) {
  const email = emails.createAccountDeleteEmail(token);
  const form = createEmailFormData(recipient, email.subject, email.html);
  await sendEmail(form);
}

export {
  sendSignUpConfirmEmail,
  sendAttemptedSignUpEmail,
  sendPasswordResetEmail,
  sendAccountDeleteEmail,
};
