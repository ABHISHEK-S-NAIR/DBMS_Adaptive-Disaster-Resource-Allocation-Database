import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT id,
            name,
            address,
            city,
            state,
            capacity,
            contact_number
     FROM storage_locations
     ORDER BY city, name`
  );
  res.json(rows);
});

const storageSchema = Joi.object({
  name: Joi.string().max(100).required(),
  address: Joi.string().max(150).allow(null, ''),
  city: Joi.string().max(50).required(),
  state: Joi.string().max(50).allow(null, ''),
  capacity: Joi.number().integer().min(0).required(),
  contact_number: Joi.string().max(20).allow(null, ''),
});

router.post('/', validate(storageSchema), async (req, res) => {
  const { name, address, city, state, capacity, contact_number } = req.body;
  const { rows } = await query(
    `INSERT INTO storage_locations (name, address, city, state, capacity, contact_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, address, city, state, capacity, contact_number]
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await query('DELETE FROM storage_locations WHERE id = $1', [id]);
  if (!rowCount) {
    const error = new Error('Storage location not found');
    error.status = 404;
    throw error;
  }
  res.status(204).send();
});

export default router;
