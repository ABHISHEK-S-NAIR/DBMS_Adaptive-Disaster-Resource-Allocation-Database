import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT t.id,
            t.vehicle_type,
            t.capacity,
            t.status,
            t.driver_name,
            t.contact_number,
            t.current_location
     FROM transports t
     ORDER BY t.vehicle_type`
  );
  res.json(rows);
});

const transportSchema = Joi.object({
  vehicle_type: Joi.string().max(50).required(),
  capacity: Joi.number().integer().min(0).required(),
  status: Joi.string().valid('Available', 'In Transit', 'Under Maintenance').default('Available'),
  driver_name: Joi.string().max(100).allow(null, ''),
  contact_number: Joi.string().max(20).allow(null, ''),
  current_location: Joi.string().max(100).allow(null, ''),
});

router.post('/', validate(transportSchema), async (req, res) => {
  const { vehicle_type, capacity, status, driver_name, contact_number, current_location } = req.body;
  const { rows } = await query(
    `INSERT INTO transports (vehicle_type, capacity, status, driver_name, contact_number, current_location)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [vehicle_type, capacity, status, driver_name, contact_number, current_location]
  );
  res.status(201).json(rows[0]);
});

const statusSchema = Joi.object({
  status: Joi.string().valid('Available', 'In Transit', 'Under Maintenance').required(),
});

router.patch('/:id/status', validate(statusSchema), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { rows } = await query(
    `UPDATE transports SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  if (!rows.length) {
    const error = new Error('Transport not found');
    error.status = 404;
    throw error;
  }
  res.json(rows[0]);
});

export default router;
