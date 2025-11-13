-- Seed data for Adaptive Disaster Resource Allocation Database
BEGIN;

INSERT INTO storage_locations (id, name, address, city, state, capacity, contact_number, latitude, longitude) VALUES
  (1,'Relief Center A','MG Road','Bengaluru','Karnataka',500,'99990001',12.9716,77.5946),
  (2,'Warehouse North','NH48','Hubli','Karnataka',300,'99990002',15.3647,75.1239),
  (3,'Depot 3','Town Hall','Mangalore','Karnataka',200,'99990003',12.9141,74.8560),
  (4,'Shelter 1','MG Road','Bengaluru','Karnataka',150,'99990004',12.9720,77.5930),
  (5,'Coastal Storage','Port Area','Kozhikode','Kerala',250,'99990005',11.2588,75.7804);

INSERT INTO resources (id, resource_type, quantity_available, status, storage_location_id) VALUES
  (101,'Food Kit',120,'Available',1),
  (102,'Ambulance',6,'Available',1),
  (103,'Tent',80,'Available',2),
  (104,'Water Supply',2000,'Available',5),
  (105,'Rescue Boat',3,'Available',5);

INSERT INTO disasters (id, type, location, severity_level) VALUES
  (201,'Flood','Kodagu','High'),
  (202,'Earthquake','Latur','Critical'),
  (203,'Cyclone','Kozhikode','High'),
  (204,'Fire','Bengaluru','Medium'),
  (205,'Flood','Alappuzha','Critical');

INSERT INTO disaster_locations (disaster_id, latitude, longitude) VALUES
  (201,12.4208,75.7397),
  (202,18.3977,76.5680),
  (203,11.2588,75.7804),
  (204,12.9716,77.5946),
  (205,9.4981,76.3388);

INSERT INTO demand_requests (id, disaster_id, requested_by, priority_level, location, resource_type, quantity_requested, status) VALUES
  (301,201,'Kodagu Office','High','Kukke','Food Kit',50,'Pending'),
  (302,203,'Kozhikode GH','High','Kovalam','Ambulance',2,'Pending'),
  (303,205,'Alappuzha Rescue','High','Dock','Rescue Boat',2,'Pending'),
  (304,201,'Kodagu Panchayat','Medium','Village','Water Supply',500,'Pending'),
  (305,202,'Maharashtra Relief','High','Latur','Tent',40,'Pending');

INSERT INTO allocations (id, request_id, resource_id, allocated_quantity, status) VALUES
  (401,301,101,50,'Dispatched'),
  (402,302,102,2,'Dispatched'),
  (403,303,105,2,'Dispatched'),
  (404,304,104,500,'Pending'),
  (405,305,103,40,'Dispatched');

INSERT INTO transports (id, vehicle_type, capacity, status, driver_name, contact_number, current_location) VALUES
  (501,'Truck',1000,'Available','Ramesh','984500001','Bengaluru'),
  (502,'Ambulance',4,'Available','Sonal','984500002','Bengaluru'),
  (503,'Helicopter',8,'Available','Captain','984500003','Mangalore'),
  (504,'Boat',20,'Available','Ashraf','984500004','Kozhikode'),
  (505,'Truck',800,'Under Maintenance','Vikram','984500005','Hubli');

INSERT INTO dispatches (id, allocation_id, transport_id, status) VALUES
  (601,401,501,'In Transit'),
  (602,402,502,'In Transit'),
  (603,403,504,'In Transit'),
  (604,404,501,'Pending'),
  (605,405,503,'In Transit');

INSERT INTO volunteers (id, name, skill_set, availability_status, contact_number, location) VALUES
  (701,'Priya','First Aid','Available','980000001','Bengaluru'),
  (702,'Karan','Driving','Available','980000002','Hubli'),
  (703,'Leela','Coordination','Busy','980000003','Mangalore'),
  (704,'Ajay','Boat Operation','Available','980000004','Kozhikode'),
  (705,'Fatima','Medical','Available','980000005','Alappuzha');

INSERT INTO volunteer_assignments (id, volunteer_id, disaster_id, task, status) VALUES
  (801,701,201,'First aid at Kukke','Assigned'),
  (802,702,205,'Transport evacuees','Assigned'),
  (803,704,203,'Boat rescue','Assigned'),
  (804,705,205,'Medical assistant','Assigned'),
  (805,703,202,'Relief coordination','Completed');

INSERT INTO app_roles (id, role_name, description) VALUES
  (1, 'Administrator', 'Full access to manage operations and users'),
  (2, 'Logistics Lead', 'Can allocate resources and manage transports'),
  (3, 'Field Coordinator', 'Can manage demand requests and volunteer assignments');

INSERT INTO app_users (id, username, display_name, password_digest, role_id, contact_email) VALUES
  (1, 'aishwarya', 'Aishwarya Rao', '100000:ea4e827f0aea8d79ec1caee730f7c43d:c189133949cc8deed586f73040953ac2217e2e21cdfac62a822e912140574898c76a2b8f7f14a98dff7143cc7d1ab75671bf88f04301e6372313a43b3aa3b6e2', 1, 'aishwarya@relieflab.org'),
  (2, 'mohit', 'Mohit Verma', '100000:51ff65aa76e74cae838ee0d758b7de8c:d1151d14b529231ede81fe7978194a4be595c35e9a04e4f6439d8d6fa873ce2cdcc7ed6f07afb9d00aafd2c664554213a6b0b3093db76e3e04a76b3234546a68', 2, 'mohit@relieflab.org'),
  (3, 'leena', 'Leena Joseph', '100000:af5c8ce70e102f8b35060fe5d3b97c47:d8d9cf3b3ee7073f61f65ec9bcb0690ac5140e3d9aa5f5d1b82fd19b551bfd0bab606d1a8ecaab5d2541f302fde2a4306cf87c2bbefee1943c3e407357aa5b39', 3, 'leena@relieflab.org');

SELECT setval('storage_locations_id_seq', (SELECT MAX(id) FROM storage_locations));
SELECT setval('resources_id_seq', (SELECT MAX(id) FROM resources));
SELECT setval('disasters_id_seq', (SELECT MAX(id) FROM disasters));
SELECT setval('demand_requests_id_seq', (SELECT MAX(id) FROM demand_requests));
SELECT setval('allocations_id_seq', (SELECT MAX(id) FROM allocations));
SELECT setval('transports_id_seq', (SELECT MAX(id) FROM transports));
SELECT setval('dispatches_id_seq', (SELECT MAX(id) FROM dispatches));
SELECT setval('volunteers_id_seq', (SELECT MAX(id) FROM volunteers));
SELECT setval('volunteer_assignments_id_seq', (SELECT MAX(id) FROM volunteer_assignments));
SELECT setval('app_roles_id_seq', (SELECT MAX(id) FROM app_roles));
SELECT setval('app_users_id_seq', (SELECT MAX(id) FROM app_users));

COMMIT;
