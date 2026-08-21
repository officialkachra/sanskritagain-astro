import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;
const [fullName, phone, passcode] = process.argv.slice(2);

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!fullName || !phone || !passcode) {
  throw new Error("Usage: node scripts/create-admin.mjs \"Admin Name\" \"+910000000000\" \"strong-passcode\"");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
});

try {
  const passcodeHash = await bcrypt.hash(passcode, 12);
  const result = await pool.query(
    `insert into workers(full_name, phone, role, passcode_hash)
     values ($1, $2, 'admin', $3)
     on conflict(phone) do update set role = 'admin', passcode_hash = excluded.passcode_hash, active = true
     returning id, full_name, phone, role`,
    [fullName, phone, passcodeHash]
  );
  console.log(result.rows[0]);
} finally {
  await pool.end();
}
