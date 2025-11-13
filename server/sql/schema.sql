-- Schema definition for Adaptive Disaster Resource Allocation Database (PostgreSQL)
-- Run this script once to create all database objects. Use in combination with functions.sql and seed.sql

BEGIN;

DROP TABLE IF EXISTS resource_alerts CASCADE;
DROP TABLE IF EXISTS allocation_log CASCADE;
DROP TABLE IF EXISTS dispatches CASCADE;
DROP TABLE IF EXISTS transports CASCADE;
DROP TABLE IF EXISTS allocations CASCADE;
DROP TABLE IF EXISTS demand_requests CASCADE;
DROP TABLE IF EXISTS volunteer_assignments CASCADE;
DROP TABLE IF EXISTS volunteers CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS app_roles CASCADE;
DROP TABLE IF EXISTS disasters CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS storage_locations CASCADE;
DROP TABLE IF EXISTS disaster_locations CASCADE;

CREATE TABLE storage_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(150),
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50),
  capacity INTEGER CHECK (capacity >= 0),
  contact_number VARCHAR(20),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(50) NOT NULL,
  quantity_available INTEGER CHECK (quantity_available >= 0),
  status VARCHAR(20) DEFAULT 'Available',
  storage_location_id INTEGER REFERENCES storage_locations(id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disasters (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  location VARCHAR(150) NOT NULL,
  severity_level VARCHAR(20) CHECK (severity_level IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Low',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disaster_locations (
  disaster_id INTEGER PRIMARY KEY REFERENCES disasters(id) ON DELETE CASCADE,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE demand_requests (
  id SERIAL PRIMARY KEY,
  disaster_id INTEGER NOT NULL REFERENCES disasters(id) ON UPDATE CASCADE ON DELETE CASCADE,
  requested_by VARCHAR(100) NOT NULL,
  priority_level VARCHAR(10) CHECK (priority_level IN ('Low', 'Medium', 'High')),
  location VARCHAR(150),
  resource_type VARCHAR(50) NOT NULL,
  quantity_requested INTEGER CHECK (quantity_requested > 0),
  status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE allocations (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES demand_requests(id) ON UPDATE CASCADE ON DELETE CASCADE,
  resource_id INTEGER REFERENCES resources(id) ON UPDATE CASCADE ON DELETE SET NULL,
  allocated_quantity INTEGER CHECK (allocated_quantity >= 0),
  status VARCHAR(20) DEFAULT 'Dispatched',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transports (
  id SERIAL PRIMARY KEY,
  vehicle_type VARCHAR(50) NOT NULL,
  capacity INTEGER CHECK (capacity >= 0),
  status VARCHAR(20) DEFAULT 'Available',
  driver_name VARCHAR(100),
  contact_number VARCHAR(20),
  current_location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispatches (
  id SERIAL PRIMARY KEY,
  allocation_id INTEGER NOT NULL REFERENCES allocations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  transport_id INTEGER REFERENCES transports(id) ON UPDATE CASCADE ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'In Transit',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volunteers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  skill_set VARCHAR(100),
  availability_status VARCHAR(20) DEFAULT 'Available',
  contact_number VARCHAR(20),
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volunteer_assignments (
  id SERIAL PRIMARY KEY,
  volunteer_id INTEGER REFERENCES volunteers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  disaster_id INTEGER NOT NULL REFERENCES disasters(id) ON UPDATE CASCADE ON DELETE CASCADE,
  task VARCHAR(150),
  status VARCHAR(20) DEFAULT 'Assigned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  password_digest TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES app_roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  contact_email VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE allocation_log (
  id SERIAL PRIMARY KEY,
  allocation_id INTEGER,
  action VARCHAR(50) NOT NULL,
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE resource_alerts (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  alert_message TEXT NOT NULL,
  alerted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE VIEW low_stock_view AS
SELECT r.id,
       r.resource_type,
       r.quantity_available,
       r.status,
       r.storage_location_id
FROM resources r
WHERE r.quantity_available <= 5;

COMMIT;
