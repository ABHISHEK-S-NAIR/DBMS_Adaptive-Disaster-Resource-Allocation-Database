import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT d.id,
            d.type,
            d.location,
            d.severity_level,
            pending.count AS pending_requests,
            high.priority_high
     FROM disasters d
     LEFT JOIN LATERAL (
       SELECT count_pending_requests(d.id) AS count
     ) pending ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS priority_high
       FROM demand_requests dr
       WHERE dr.disaster_id = d.id AND dr.priority_level = 'High'
     ) high ON TRUE
     ORDER BY d.id`
  );
  res.json(rows);
});

const disasterSchema = Joi.object({
  type: Joi.string().max(50).required(),
  location: Joi.string().max(150).required(),
  severity_level: Joi.string().valid('Low', 'Medium', 'High', 'Critical').default('Low'),
});

router.post('/', authenticate, authorize('Administrator', 'Field Coordinator'), validate(disasterSchema), async (req, res) => {
  const { type, location, severity_level } = req.body;
  const { rows } = await query(
    `INSERT INTO disasters (type, location, severity_level)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [type, location, severity_level]
  );
  res.status(201).json(rows[0]);
});

router.patch(
  '/:id/severity',
  authenticate,
  authorize('Administrator', 'Field Coordinator'),
  validate(Joi.object({ severity_level: disasterSchema.extract('severity_level').required() })),
  async (req, res) => {
  const { id } = req.params;
  const { severity_level } = req.body;
  const { rows } = await query(
    `UPDATE disasters SET severity_level = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [severity_level, id]
  );
  if (!rows.length) {
    const error = new Error('Disaster not found');
    error.status = 404;
    throw error;
  }
    res.json(rows[0]);
  }
);

export default router;
