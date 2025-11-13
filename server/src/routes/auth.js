import { Router } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { verifyPassword } from '../utils/password.js';

const router = Router();

const loginSchema = Joi.object({
  username: Joi.string().max(50).required(),
  password: Joi.string().max(200).required(),
});

const buildUserPayload = (record) => ({
  id: record.id,
  username: record.username,
  display_name: record.display_name,
  role: record.role_name,
  contact_email: record.contact_email,
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;

  const { rows } = await query(
    `SELECT u.id,
            u.username,
            u.display_name,
            u.password_digest,
            u.contact_email,
            r.role_name
       FROM app_users u
       JOIN app_roles r ON r.id = u.role_id
      WHERE u.username = $1`,
    [username]
  );

  if (!rows.length) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const [user] = rows;

  if (!verifyPassword(password, user.password_digest)) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error('Session secret is not configured');
    error.status = 500;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role_name },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, user: buildUserPayload(user) });
});

router.get('/me', authenticate, async (req, res) => {
  const { rows } = await query(
    `SELECT u.id,
            u.username,
            u.display_name,
            u.contact_email,
            r.role_name
       FROM app_users u
       JOIN app_roles r ON r.id = u.role_id
      WHERE u.id = $1`,
    [req.user.id]
  );

  if (!rows.length) {
    const err = new Error('Account not found');
    err.status = 404;
    throw err;
  }

  res.json(buildUserPayload(rows[0]));
});

export default router;
