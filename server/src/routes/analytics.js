import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/summary', async (req, res) => {
  const [{ rows: totals }, { rows: readiness }] = await Promise.all([
    query(
      `SELECT (SELECT COUNT(*) FROM disasters) AS disasters,
              (SELECT COUNT(*) FROM demand_requests) AS requests,
              (SELECT COUNT(*) FROM allocations) AS allocations,
              (SELECT COUNT(*) FROM volunteers) AS volunteers`
    ),
    query(
      `SELECT dr.disaster_id,
              d.type AS disaster_type,
              SUM(dr.quantity_requested) AS total_requested,
              SUM(COALESCE(a.allocated_quantity, 0)) AS total_allocated
       FROM demand_requests dr
       LEFT JOIN allocations a ON a.request_id = dr.id
       JOIN disasters d ON d.id = dr.disaster_id
       GROUP BY dr.disaster_id, d.type
       ORDER BY dr.disaster_id`
    ),
  ]);

  res.json({ totals: totals[0], readiness });
});

router.get('/pending-by-disaster', async (req, res) => {
  const { rows } = await query(
    `SELECT d.id AS disaster_id,
            d.type,
            COUNT(dr.*) FILTER (WHERE dr.status = 'Pending') AS pending_requests,
            COUNT(dr.*) FILTER (WHERE dr.priority_level = 'High') AS high_priority,
            COUNT(a.*) FILTER (WHERE a.status <> 'Delivered') AS open_allocations
     FROM disasters d
     LEFT JOIN demand_requests dr ON dr.disaster_id = d.id
     LEFT JOIN allocations a ON a.request_id = dr.id
     GROUP BY d.id, d.type
     ORDER BY pending_requests DESC`
  );
  res.json(rows);
});

router.get('/resource-utilization', async (req, res) => {
  const { rows } = await query(
    `SELECT r.resource_type,
            sl.city,
            SUM(r.quantity_available) AS quantity_available,
            SUM(COALESCE(a.allocated_quantity, 0)) AS quantity_allocated,
            ROUND(SUM(COALESCE(a.allocated_quantity, 0))::numeric / NULLIF(SUM(r.quantity_available) + SUM(COALESCE(a.allocated_quantity, 0)), 0) * 100, 2) AS utilization_rate
     FROM resources r
     LEFT JOIN allocations a ON a.resource_id = r.id
     LEFT JOIN storage_locations sl ON sl.id = r.storage_location_id
     GROUP BY r.resource_type, sl.city
     ORDER BY utilization_rate DESC NULLS LAST`
  );
  res.json(rows);
});

export default router;
