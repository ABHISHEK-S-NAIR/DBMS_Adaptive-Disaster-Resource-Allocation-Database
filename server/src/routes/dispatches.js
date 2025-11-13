import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT ds.id,
            ds.allocation_id,
            ds.transport_id,
            ds.status,
            ds.created_at,
            a.request_id,
            tr.vehicle_type
     FROM dispatches ds
     JOIN allocations a ON a.id = ds.allocation_id
     LEFT JOIN transports tr ON tr.id = ds.transport_id
     ORDER BY ds.created_at DESC`
  );
  res.json(rows);
});

const dispatchSchema = Joi.object({
  allocation_id: Joi.number().integer().required(),
  transport_id: Joi.number().integer().allow(null),
  status: Joi.string().valid('In Transit', 'Pending', 'Delivered').default('In Transit'),
});

router.post('/', validate(dispatchSchema), async (req, res) => {
  const { allocation_id, transport_id, status } = req.body;
  const { rows } = await query(
    `INSERT INTO dispatches (allocation_id, transport_id, status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [allocation_id, transport_id, status]
  );
  res.status(201).json(rows[0]);
});

const statusSchema = Joi.object({
  status: Joi.string().valid('In Transit', 'Pending', 'Delivered').required(),
});

router.patch('/:id/status', validate(statusSchema), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { rows } = await query(
    `UPDATE dispatches SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  if (!rows.length) {
    const error = new Error('Dispatch not found');
    error.status = 404;
    throw error;
  }
  res.json(rows[0]);
});

export default router;
