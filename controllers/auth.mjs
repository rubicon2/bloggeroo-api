import jwt from 'jsonwebtoken';
import 'dotenv/config';

function postAccess(req, res) {
  // Use token.verify and auth.getUser - refresh token will be verified, and user put in req.user.
  const token = jwt.sign(
    {
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      isBanned: req.user.isBanned,
    },
    process.env.SECRET,
    { expiresIn: '15m' },
  );
  return res.status(200).json({
    status: 'success',
    data: {
      access: token,
    },
  });
}

export { postAccess };
