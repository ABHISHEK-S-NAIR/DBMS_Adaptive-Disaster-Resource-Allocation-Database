import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT dr.id,
            dr.disaster_id,
            d.type AS disaster_type,
            dr.requested_by,
            dr.priority_level,
            dr.location,
            dr.resource_type,
            dr.quantity_requested,
            dr.status,
            dr.created_at,
            COALESCE(a.allocated_quantity, 0) AS allocated_quantity
     FROM demand_requests dr
     JOIN disasters d ON d.id = dr.disaster_id
     LEFT JOIN LATERAL (
       SELECT SUM(allocated_quantity) AS allocated_quantity
       FROM allocations a
       WHERE a.request_id = dr.id
     ) a ON TRUE
     ORDER BY dr.created_at DESC`
  );
  res.json(rows);
});

const createSchema = Joi.object({
  disaster_id: Joi.number().integer().required(),
  requested_by: Joi.string().max(100).required(),
  priority_level: Joi.string().valid('Low', 'Medium', 'High').required(),
  location: Joi.string().max(150).allow(null, ''),
  resource_type: Joi.string().max(50).required(),
  quantity_requested: Joi.number().integer().min(1).required(),
});

router.post('/', validate(createSchema), async (req, res) => {
  const { disaster_id, requested_by, priority_level, location, resource_type, quantity_requested } = req.body;
  const { rows } = await query(
    `INSERT INTO demand_requests (disaster_id, requested_by, priority_level, location, resource_type, quantity_requested)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [disaster_id, requested_by, priority_level, location, resource_type, quantity_requested]
  );
  res.status(201).json(rows[0]);
});

const statusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'In Progress', 'Fulfilled', 'Cancelled').required(),
});

router.patch('/:id/status', validate(statusSchema), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { rows } = await query(
    `UPDATE demand_requests
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  if (!rows.length) {
    const error = new Error('Demand request not found');
    error.status = 404;
    throw error;
  }
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await query('DELETE FROM demand_requests WHERE id = $1', [id]);
  if (!rowCount) {
    const error = new Error('Demand request not found');
    error.status = 404;
    throw error;
  }
  res.status(204).send();
});

router.get('/:id/recommendations', async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT r.id,
            r.resource_type,
            r.quantity_available,
            sl.city,
            sl.state,
            distance_matrix.distance_km,
            CASE WHEN r.quantity_available >= dr.quantity_requested THEN 'Ready'
                 WHEN r.quantity_available > 0 THEN 'Partial'
                 ELSE 'Unavailable'
            END AS fulfillment_status
     FROM demand_requests dr
     JOIN resources r ON r.resource_type = dr.resource_type
     JOIN storage_locations sl ON sl.id = r.storage_location_id
     LEFT JOIN LATERAL (
       SELECT COALESCE(
         geo_distance_km(sl.latitude, sl.longitude, dr_geo.latitude, dr_geo.longitude),
         0
       ) AS distance_km
       FROM disaster_locations dr_geo
       WHERE dr_geo.disaster_id = dr.disaster_id
     ) distance_matrix ON TRUE
     WHERE dr.id = $1
     ORDER BY fulfillment_status, distance_matrix.distance_km NULLS LAST, r.quantity_available DESC`,
    [id]
  );
  res.json(rows);
});

export default router;
