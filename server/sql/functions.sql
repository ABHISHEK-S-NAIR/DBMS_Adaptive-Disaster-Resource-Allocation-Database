-- Functions, stored procedures, and triggers for Adaptive Disaster Resource Allocation Database

BEGIN;

-- Utility: update updated_at columns
CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_resources
BEFORE UPDATE ON resources
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER set_timestamp_disasters
BEFORE UPDATE ON disasters
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER set_timestamp_demand_requests
BEFORE UPDATE ON demand_requests
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER set_timestamp_allocations
BEFORE UPDATE ON allocations
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER set_timestamp_storage_locations
BEFORE UPDATE ON storage_locations
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER set_timestamp_disaster_locations
BEFORE UPDATE ON disaster_locations
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER set_timestamp_transports
BEFORE UPDATE ON transports
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER set_timestamp_dispatches
BEFORE UPDATE ON dispatches
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER set_timestamp_volunteers
BEFORE UPDATE ON volunteers
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE TRIGGER set_timestamp_volunteer_assignments
BEFORE UPDATE ON volunteer_assignments
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

-- Trigger A: enforce resource status based on quantity
CREATE OR REPLACE FUNCTION trg_resource_status_before_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity_available <= 0 THEN
    NEW.status = 'Unavailable';
  ELSIF NEW.status = 'Unavailable' THEN
    NEW.status = 'Available';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_resource_status_update
BEFORE UPDATE ON resources
FOR EACH ROW
EXECUTE FUNCTION trg_resource_status_before_update();

-- Trigger for low stock alerts
CREATE OR REPLACE FUNCTION trg_resource_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity_available <= 5 AND (OLD.quantity_available IS NULL OR OLD.quantity_available > 5) THEN
    INSERT INTO resource_alerts (resource_id, alert_type, alert_message)
    VALUES (NEW.id, 'LOW_STOCK', CONCAT('Resource ', NEW.resource_type, ' is low on stock at quantity ', NEW.quantity_available));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_resource_low_stock_alert
AFTER INSERT OR UPDATE ON resources
FOR EACH ROW
EXECUTE FUNCTION trg_resource_low_stock();

-- Trigger B: after insert on allocations -> log
CREATE OR REPLACE FUNCTION trg_allocation_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO allocation_log (allocation_id, action)
  VALUES (NEW.id, 'NEW_ALLOCATION');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_allocation_insert
AFTER INSERT ON allocations
FOR EACH ROW
EXECUTE FUNCTION trg_allocation_after_insert();

-- Trigger C: escalate disaster severity if >= 3 high requests
CREATE OR REPLACE FUNCTION trg_disaster_escalation_after_insert()
RETURNS TRIGGER AS $$
DECLARE
  high_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO high_count
  FROM demand_requests
  WHERE disaster_id = NEW.disaster_id AND priority_level = 'High';

  IF high_count >= 3 THEN
    UPDATE disasters
    SET severity_level = 'Critical'
    WHERE id = NEW.disaster_id AND severity_level <> 'Critical';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_demand_request_high_priority
AFTER INSERT ON demand_requests
FOR EACH ROW
EXECUTE FUNCTION trg_disaster_escalation_after_insert();

-- Trigger D: maintain volunteer availability
CREATE OR REPLACE FUNCTION trg_volunteer_assignment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE volunteers
    SET availability_status = 'Busy'
    WHERE id = NEW.volunteer_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('Completed', 'Cancelled') THEN
      UPDATE volunteers
      SET availability_status = 'Available'
      WHERE id = NEW.volunteer_id;
    ELSE
      UPDATE volunteers
      SET availability_status = 'Busy'
      WHERE id = NEW.volunteer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_volunteer_assignment_insert
AFTER INSERT ON volunteer_assignments
FOR EACH ROW
EXECUTE FUNCTION trg_volunteer_assignment_status();

CREATE TRIGGER trg_volunteer_assignment_update
AFTER UPDATE ON volunteer_assignments
FOR EACH ROW
EXECUTE FUNCTION trg_volunteer_assignment_status();

-- Stored function: count pending requests
CREATE OR REPLACE FUNCTION count_pending_requests(p_disaster_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM demand_requests
  WHERE disaster_id = p_disaster_id AND status = 'Pending';
  RETURN pending_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Utility: geospatial distance (Haversine, result in KM)
CREATE OR REPLACE FUNCTION geo_distance_km(lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  r NUMERIC := 6371; -- Earth radius
  phi1 NUMERIC := radians(lat1);
  phi2 NUMERIC := radians(lat2);
  d_phi NUMERIC := radians(lat2 - lat1);
  d_lambda NUMERIC := radians(lon2 - lon1);
  a NUMERIC;
  c NUMERIC;
BEGIN
  a := sin(d_phi / 2)^2 + cos(phi1) * cos(phi2) * sin(d_lambda / 2)^2;
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Stored procedure equivalent: allocate_resource
CREATE OR REPLACE FUNCTION allocate_resource(p_request_id INTEGER, p_resource_id INTEGER, p_qty INTEGER)
RETURNS INTEGER AS $$
DECLARE
  available_qty INTEGER;
  new_allocation_id INTEGER;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  SELECT quantity_available INTO available_qty
  FROM resources
  WHERE id = p_resource_id
  FOR UPDATE;

  IF available_qty IS NULL THEN
    RAISE EXCEPTION 'Resource % not found', p_resource_id;
  END IF;

  IF available_qty < p_qty THEN
    RAISE EXCEPTION 'Insufficient stock (available %, requested %)', available_qty, p_qty;
  END IF;

  INSERT INTO allocations (request_id, resource_id, allocated_quantity, status)
  VALUES (p_request_id, p_resource_id, p_qty, 'Dispatched')
  RETURNING id INTO new_allocation_id;

  UPDATE resources
  SET quantity_available = quantity_available - p_qty
  WHERE id = p_resource_id;

  RETURN new_allocation_id;
END;
$$ LANGUAGE plpgsql;

-- Auto volunteer assignment helper
CREATE OR REPLACE FUNCTION assign_volunteer(p_disaster_id INTEGER, p_task VARCHAR, p_skill VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  chosen_volunteer INTEGER;
  new_assignment_id INTEGER;
BEGIN
  SELECT v.id INTO chosen_volunteer
  FROM volunteers v
  WHERE v.availability_status = 'Available'
    AND (p_skill IS NULL OR v.skill_set ILIKE CONCAT('%', p_skill, '%'))
  ORDER BY v.updated_at ASC
  LIMIT 1;

  IF chosen_volunteer IS NULL THEN
    RAISE EXCEPTION 'No volunteer available for skill %', p_skill;
  END IF;

  INSERT INTO volunteer_assignments (volunteer_id, disaster_id, task, status)
  VALUES (chosen_volunteer, p_disaster_id, p_task, 'Assigned')
  RETURNING id INTO new_assignment_id;

  RETURN new_assignment_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
