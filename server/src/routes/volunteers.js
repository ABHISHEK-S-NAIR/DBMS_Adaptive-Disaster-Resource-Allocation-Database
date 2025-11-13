import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import validate from '../middlewares/validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const [rosterResult, assignmentsResult] = await Promise.all([
    query(
      `SELECT v.id,
              v.name,
              v.skill_set,
              v.availability_status,
              v.contact_number,
              v.location,
              COALESCE(stats.active_assignments, 0) AS open_assignments
       FROM volunteers v
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS active_assignments
         FROM volunteer_assignments va
         WHERE va.volunteer_id = v.id AND va.status IN ('Assigned', 'In Progress')
       ) stats ON TRUE
       ORDER BY v.name`
    ),
    query(
      `SELECT va.id,
              va.volunteer_id,
              v.name AS volunteer_name,
              va.disaster_id,
              d.type AS disaster_type,
              va.task,
              va.status,
              va.created_at
       FROM volunteer_assignments va
       JOIN disasters d ON d.id = va.disaster_id
       LEFT JOIN volunteers v ON v.id = va.volunteer_id
       ORDER BY va.created_at DESC
       LIMIT 50`
    ),
  ]);

  res.json({ roster: rosterResult.rows, assignments: assignmentsResult.rows });
});

router.get('/assignments', async (req, res) => {
  const { rows } = await query(
    `SELECT va.id,
            va.volunteer_id,
            v.name AS volunteer_name,
            va.disaster_id,
            d.type AS disaster_type,
            va.task,
            va.status,
            va.created_at
     FROM volunteer_assignments va
     JOIN disasters d ON d.id = va.disaster_id
     LEFT JOIN volunteers v ON v.id = va.volunteer_id
     ORDER BY va.created_at DESC`
  );
  res.json(rows);
});

const volunteerSchema = Joi.object({
  name: Joi.string().max(100).required(),
  skill_set: Joi.string().max(100).allow(null, ''),
  availability_status: Joi.string().valid('Available', 'Busy', 'Unavailable').default('Available'),
  contact_number: Joi.string().max(20).allow(null, ''),
  location: Joi.string().max(100).allow(null, ''),
});

router.post('/', validate(volunteerSchema), async (req, res) => {
  const { name, skill_set, availability_status, contact_number, location } = req.body;
  const { rows } = await query(
    `INSERT INTO volunteers (name, skill_set, availability_status, contact_number, location)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, skill_set, availability_status, contact_number, location]
  );
  res.status(201).json(rows[0]);
});

const assignmentSchema = Joi.object({
  disaster_id: Joi.number().integer().required(),
  task: Joi.string().max(150).required(),
  skill_set: Joi.string().max(100).allow(null, ''),
});

const respondWithAssignment = async (assignmentId, res) => {
  const assignment = await query(
    `SELECT va.*, v.name AS volunteer_name
     FROM volunteer_assignments va
     LEFT JOIN volunteers v ON v.id = va.volunteer_id
     WHERE va.id = $1`,
    [assignmentId]
  );
  res.status(201).json(assignment.rows[0]);
};

router.post('/auto-assign', validate(assignmentSchema), async (req, res) => {
  const { disaster_id, task, skill_set } = req.body;
  const { rows } = await query('SELECT assign_volunteer($1, $2, $3) AS assignment_id', [disaster_id, task, skill_set]);
  await respondWithAssignment(rows[0].assignment_id, res);
});

router.post('/assign', validate(assignmentSchema), async (req, res) => {
  const { disaster_id, task, skill_set } = req.body;
  const { rows } = await query('SELECT assign_volunteer($1, $2, $3) AS assignment_id', [disaster_id, task, skill_set]);
  await respondWithAssignment(rows[0].assignment_id, res);
});

const updateAssignmentSchema = Joi.object({
  status: Joi.string().valid('Assigned', 'In Progress', 'Completed', 'Cancelled').required(),
});

router.patch('/assignments/:id/status', validate(updateAssignmentSchema), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { rows } = await query(
    `UPDATE volunteer_assignments SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  if (!rows.length) {
    const error = new Error('Volunteer assignment not found');
    error.status = 404;
    throw error;
  }
  res.json(rows[0]);
});

router.get('/:volunteerId/assignments', async (req, res) => {
  const { volunteerId } = req.params;
  const { rows } = await query(
    `SELECT va.id,
            va.task,
            va.status,
            TO_CHAR(va.created_at, 'DD Mon YYYY HH24:MI') AS created_at,
            d.type AS disaster_type
     FROM volunteer_assignments va
     JOIN disasters d ON d.id = va.disaster_id
     WHERE va.volunteer_id = $1
     ORDER BY va.created_at DESC`,
    [volunteerId]
  );
  res.json(rows);
});

export default router;
