function createSignUpConfirmEmail(token) {
  return {
    subject: 'Sign Up Confirmation',
    html: `
    <h1>Sign Up Confirmation</h1>
    <a href="${process.env.WEB_CLIENT_CONFIRM_EMAIL_HREF}?token=${token}">Click here to complete sign up</a>
  `,
  };
}

function createAttemptedSignUpEmail() {
  return {
    subject: 'Sign up attempt made with this email address',
    html: `
    <h1>Sign Up Attempt</h1>
    <p>An attempt to sign up to Bloggeroo was made with this email address, but an account already exists.</p>
    `,
  };
}

function createPasswordResetEmail(token) {
  return {
    subject: 'Password reset request',
    html: `
    <h1>Password Reset</h1>
    <a href="${process.env.WEB_CLIENT_RESET_PASSWORD_HREF}?token=${token}">Click here to reset your password</a>
    `,
  };
}

function createAccountDeleteEmail(token) {
  return {
    subject: 'Close account request',
    html: `
    <h1>Close Account</h1>
    <a href="${process.env.WEB_CLIENT_CLOSE_ACCOUNT_HREF}?token=${token}">Click here to close your account</a>
    `,
  };
}

export {
  createSignUpConfirmEmail,
  createAttemptedSignUpEmail,
  createPasswordResetEmail,
  createAccountDeleteEmail,
};
