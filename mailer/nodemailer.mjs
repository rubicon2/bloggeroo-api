import nodemailer from 'nodemailer';
import 'dotenv/config';

// Tried outlook and gmail and neither worked with nodemailer.
// Mailgun works absolutely fine.
// I am not sure what the client URLS will be for confirming accounts,
// resetting passwords etc., and I am going to consider the clients
// separate projects, so the URLS will be kept in the env file.
const EMAIL_ADDRESS = process.env.MAIL_EMAIL;

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SERVER,
  port: process.env.MAIL_SERVER_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_EMAIL,
    pass: process.env.MAIL_PASSWORD,
  },
});

async function sendSignUpConfirmEmail(recipient, token) {
  const info = await transporter.sendMail({
    from: `"Bloggeroo Accounts" <${EMAIL_ADDRESS}>`,
    to: recipient,
    subject: 'Sign Up Confirmation',
    html: `
    <h1>Sign Up Confirmation</h1>
    <a href="${process.env.WEB_CLIENT_CONFIRM_EMAIL_HREF}?token=${token}">Click here to complete sign up</a>
    `,
  });
  console.log('Message sent via nodemailer:', info.messageId);
}

async function sendAttemptedSignUpEmail(recipient) {
  const info = await transporter.sendMail({
    from: `"Bloggeroo Accounts" <${EMAIL_ADDRESS}>`,
    to: recipient,
    subject: 'Sign up attempt made with this email address',
    html: `
    <h1>Sign Up Attempt</h1>
    <p>An attempt to sign up to Bloggeroo was made with this email address, but an account already exists.</p>
    `,
  });
  console.log('Message sent via nodemailer:', info.messageId);
}

async function sendPasswordResetEmail(recipient, token) {
  const info = await transporter.sendMail({
    from: `"Bloggeroo Accounts" <${EMAIL_ADDRESS}>`,
    to: recipient,
    subject: 'Password reset request',
    html: `
    <h1>Password Reset</h1>
    <a href="${process.env.WEB_CLIENT_RESET_PASSWORD_HREF}?token=${token}">Click here to reset your password</a>
    `,
  });
  console.log('Message sent via nodemailer:', info.messageId);
}

async function sendAccountDeleteEmail(recipient, token) {
  const info = await transporter.sendMail({
    from: `"Bloggeroo Accounts" <${EMAIL_ADDRESS}>`,
    to: recipient,
    subject: 'Close account request',
    html: `
    <h1>Close Account</h1>
    <a href="${process.env.WEB_CLIENT_CLOSE_ACCOUNT_HREF}?token=${token}">Click here to close your account</a>
    `,
  });
  console.log('Message sent via nodemailer:', info.messageId);
}

export {
  sendSignUpConfirmEmail,
  sendAttemptedSignUpEmail,
  sendPasswordResetEmail,
  sendAccountDeleteEmail,
};
