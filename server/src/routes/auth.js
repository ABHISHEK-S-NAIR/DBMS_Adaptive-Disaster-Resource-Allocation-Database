import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';

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
            u.password,
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

  if (user.password !== password) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }
  res.json(buildUserPayload(user));
});

export default router;
