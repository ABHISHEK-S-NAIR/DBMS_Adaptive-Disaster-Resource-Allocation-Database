import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const result = await query(
    `SELECT r.id,
            r.resource_type,
            r.quantity_available,
            r.status,
            r.storage_location_id,
            sl.name AS storage_name,
            sl.city,
            sl.state
     FROM resources r
     LEFT JOIN storage_locations sl ON sl.id = r.storage_location_id
     ORDER BY r.id`
  );
  res.json(result.rows);
});

router.get('/low-stock', async (req, res) => {
  const { rows } = await query(
    `SELECT base.id,
            base.resource_type,
            base.quantity_available,
            COALESCE(last_alert.alerted_at, base.updated_at) AS last_alerted_at,
            sl.name AS storage_name
     FROM low_stock_view v
     JOIN resources base ON base.id = v.id
     LEFT JOIN LATERAL (
       SELECT alerted_at
       FROM resource_alerts
       WHERE resource_id = base.id
       ORDER BY alerted_at DESC
       LIMIT 1
     ) last_alert ON TRUE
     LEFT JOIN storage_locations sl ON sl.id = base.storage_location_id
     ORDER BY base.resource_type`
  );
  res.json(rows);
});

const createSchema = Joi.object({
  resource_type: Joi.string().max(50).required(),
  quantity_available: Joi.number().integer().min(0).required(),
  status: Joi.string().valid('Available', 'Unavailable', 'Reserved').default('Available'),
  storage_location_id: Joi.number().integer().allow(null),
});

router.post('/', validate(createSchema), async (req, res) => {
  const { resource_type, quantity_available, status, storage_location_id } = req.body;
  const { rows } = await query(
    `INSERT INTO resources (resource_type, quantity_available, status, storage_location_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [resource_type, quantity_available, status, storage_location_id]
  );
  res.status(201).json(rows[0]);
});

const updateSchema = Joi.object({
  quantity_available: Joi.number().integer().min(0),
  status: Joi.string().valid('Available', 'Unavailable', 'Reserved'),
  storage_location_id: Joi.number().integer().allow(null),
}).min(1);

router.patch('/:id', validate(updateSchema), async (req, res) => {
  const { id } = req.params;
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  const setClause = fields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(', ');

  const { rows } = await query(
    `UPDATE resources SET ${setClause}, updated_at = NOW()
     WHERE id = $${fields.length + 1}
     RETURNING *`,
    [...values, id]
  );

  if (!rows.length) {
    const error = new Error('Resource not found');
    error.status = 404;
    throw error;
  }

  res.json(rows[0]);
});

const replenishSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

router.post('/:id/replenish', validate(replenishSchema), async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const { rows } = await query(
    `UPDATE resources
     SET quantity_available = quantity_available + $1,
         status = 'Available',
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [quantity, id]
  );
  if (!rows.length) {
    const error = new Error('Resource not found');
    error.status = 404;
    throw error;
  }
  res.json(rows[0]);
});

export default router;
