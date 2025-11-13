import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';

const router = Router();

router.get('/roles', async (req, res) => {
  const { rows } = await query(
    `SELECT r.id,
            r.role_name,
            r.description,
            r.created_at,
            COUNT(u.id) AS user_count
     FROM app_roles r
     LEFT JOIN app_users u ON u.role_id = r.id
     GROUP BY r.id
     ORDER BY r.role_name`
  );
  res.json(rows);
});

router.get('/users', async (req, res) => {
  const { rows } = await query(
    `SELECT u.id,
            u.username,
            u.display_name,
            u.contact_email,
            u.created_at,
            r.role_name
     FROM app_users u
     JOIN app_roles r ON r.id = u.role_id
     ORDER BY u.created_at DESC`
  );
  res.json(rows);
});

const roleSchema = Joi.object({
  role_name: Joi.string().max(50).required(),
  description: Joi.string().allow('', null),
});

router.post('/roles', validate(roleSchema), async (req, res) => {
  const { role_name, description } = req.body;
  const { rows } = await query(
    `INSERT INTO app_roles (role_name, description)
     VALUES ($1, $2)
     RETURNING *`,
    [role_name, description]
  );
  res.status(201).json(rows[0]);
});

const userSchema = Joi.object({
  username: Joi.string().max(50).required(),
  display_name: Joi.string().max(100).required(),
  role_id: Joi.number().integer().required(),
  contact_email: Joi.string().email({ tlds: false }).allow('', null),
});

router.post('/users', validate(userSchema), async (req, res) => {
  const { username, display_name, role_id, contact_email } = req.body;
  const { rows } = await query(
    `INSERT INTO app_users (username, display_name, role_id, contact_email)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [username, display_name, role_id, contact_email]
  );
  res.status(201).json(rows[0]);
});

const reassignSchema = Joi.object({
  role_id: Joi.number().integer().required(),
});

router.patch('/users/:id/role', validate(reassignSchema), async (req, res) => {
  const { id } = req.params;
  const { role_id } = req.body;
  const { rows } = await query(
    `UPDATE app_users SET role_id = $1
     WHERE id = $2
     RETURNING *`,
    [role_id, id]
  );
  if (!rows.length) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  res.json(rows[0]);
});

export default router;
