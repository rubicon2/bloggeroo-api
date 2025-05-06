import db from '../db/prismaClient.mjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function postRefresh(req, res, next) {
  try {
    // Add existing token to revoke list.
    // Get details from db.
    // Send a replacement token.
    await db.revokedToken.create({
      data: {
        token: req.token,
        expiresAt: new Date(req.tokenData.exp * 1000),
      },
    });

    const user = await db.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    const refresh = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.SECRET,
      { expiresIn: '28d' },
    );

    // Send over a new access token in the response.
    const access = jwt.sign(
      {
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        isBanned: req.user.isBanned,
      },
      process.env.SECRET,
      { expiresIn: '15m' },
    );

    res.setHeader('Authorization', 'Bearer ' + refresh);
    return res.status(200).json({
      status: 'success',
      data: {
        access,
      },
    });
  } catch (error) {
    return next(error);
  }
}

function postAccess(req, res, next) {
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

export { postRefresh, postAccess };
