import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT a.id,
            a.request_id,
            dr.resource_type,
            dr.quantity_requested,
            a.resource_id,
            res.resource_type AS allocated_resource_type,
            a.allocated_quantity,
            a.status,
            a.created_at,
            disp.status AS dispatch_status,
            tr.vehicle_type
     FROM allocations a
     JOIN demand_requests dr ON dr.id = a.request_id
     LEFT JOIN resources res ON res.id = a.resource_id
     LEFT JOIN dispatches disp ON disp.allocation_id = a.id
     LEFT JOIN transports tr ON tr.id = disp.transport_id
     ORDER BY a.created_at DESC`
  );
  res.json(rows);
});

router.get('/logs', async (req, res) => {
  const { rows } = await query(
    `SELECT l.id,
            l.allocation_id,
            l.action,
            l.action_date
     FROM allocation_log l
     ORDER BY l.id DESC
     LIMIT 50`
  );
  res.json(rows);
});

const allocateSchema = Joi.object({
  request_id: Joi.number().integer().required(),
  resource_id: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).required(),
});

router.post('/', validate(allocateSchema), async (req, res) => {
  const { request_id, resource_id, quantity } = req.body;

  const { rows } = await query('SELECT allocate_resource($1, $2, $3) AS allocation_id', [request_id, resource_id, quantity]);
  const allocationId = rows[0].allocation_id;

  const allocation = await query('SELECT * FROM allocations WHERE id = $1', [allocationId]);

  res.status(201).json(allocation.rows[0]);
});

const statusSchema = Joi.object({
  status: Joi.string().valid('Dispatched', 'Pending', 'Delivered', 'Cancelled').required(),
});

router.patch('/:id/status', validate(statusSchema), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { rows } = await query(
    `UPDATE allocations SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  if (!rows.length) {
    const error = new Error('Allocation not found');
    error.status = 404;
    throw error;
  }
  res.json(rows[0]);
});

export default router;
