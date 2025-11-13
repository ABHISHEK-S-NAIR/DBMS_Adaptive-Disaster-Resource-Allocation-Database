import pkg from 'pg';
const { Pool } = pkg;

// 👇 Add application_name here — this will show in pg_stat_activity
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  application_name: "adaptive-disaster-backend",
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// ===============================================
// 🔥 TEST CONNECTION + PRINT DB DETAILS + APP NAME
// ===============================================
pool.connect()
  .then(async (client) => {
    try {
      // Query PostgreSQL to fetch current session info
      const res = await client.query(`
        SELECT 
          current_database() AS database,
          current_user AS user,
          inet_server_addr() AS server_ip,
          inet_server_port() AS server_port,
          current_setting('application_name') AS app_name,
          version() AS postgres_version,
          now() AS connected_time
        ;
      `);

      const info = res.rows[0];

      console.log("=========================================");
      console.log("   ✅ PostgreSQL Connection Successful");
      console.log("=========================================");
      console.log(`📌 Database:       ${info.database}`);
      console.log(`👤 User:           ${info.user}`);
      console.log(`📛 App Name:       ${info.app_name}`);
      console.log(`🌐 Host:           ${info.server_ip}`);
      console.log(`🔌 Port:           ${info.server_port}`);
      console.log(`🕒 Connected Time: ${info.connected_time}`);
      console.log("=========================================");
    } catch (err) {
      console.error("❌ Test query failed:", err);
    } finally {
      client.release();
    }
  })
  .catch((err) => {
    console.error("❌ PostgreSQL Connection Failed:", err);
  });

// ===============================================
//  QUERY WRAPPER
// ===============================================
export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.LOG_SQL === 'true') {
    console.log('executed query', { text, duration, rows: res.rowCount });
  }

  return res;
};

// ===============================================
//  TRANSACTION WRAPPER
// ===============================================
export const transaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;