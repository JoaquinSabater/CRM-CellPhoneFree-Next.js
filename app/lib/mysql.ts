import mysql from 'mysql2/promise';

export async function getConnection() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  return connection;
}
