const fs = require("fs");
const path = require("path");

const sourcePath = path.join(__dirname, "..", "..", "seeders", "data.json");
const outputPath = path.join(__dirname, "local_dummy_seed_postgres.sql");

const TABLE_ORDER = [
  "STORE",
  "USER",
  "SETTINGS",
  "CATEGORY",
  "SUB_CATEGORY",
  "DELIVERY_CHARGE",
  "DISTANCE_CHARGE",
  "PRODUCTS",
  "BANNER",
];

const cleanupOrder = [...TABLE_ORDER].reverse();

function toSqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";

  // Treat date-like strings as plain strings so PostgreSQL casts where needed.
  const text = String(value).replace(/\\/g, "\\\\").replace(/'/g, "''");

  return `'${text}'`;
}

function buildInsertSql(tableName, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return `-- ${tableName}: no rows\n`;
  }

  const columns = Array.from(
    rows.reduce((acc, row) => {
      Object.keys(row || {}).forEach((key) => acc.add(key));
      return acc;
    }, new Set()),
  );

  const quotedColumns = columns.map((col) => `"${col}"`).join(", ");

  const valuesSql = rows
    .map((row) => {
      const values = columns.map((col) => toSqlValue(row[col])).join(", ");
      return `(${values})`;
    })
    .join(",\n");

  return `INSERT INTO "${tableName}" (${quotedColumns})\nVALUES\n${valuesSql}\nON CONFLICT DO NOTHING;\n`;
}

function main() {
  const raw = fs.readFileSync(sourcePath, "utf8");
  const data = JSON.parse(raw);

  const missing = TABLE_ORDER.filter((table) => !(table in data));
  if (missing.length > 0) {
    throw new Error(`Missing table keys in data.json: ${missing.join(", ")}`);
  }

  const lines = [];
  lines.push("-- Auto-generated PostgreSQL seed script");
  lines.push("-- Source: seeders/data.json");
  lines.push("-- Generated at: " + new Date().toISOString());
  lines.push("BEGIN;");
  lines.push("");

  cleanupOrder.forEach((table) => {
    lines.push(`DELETE FROM "${table}";`);
  });

  lines.push("");

  TABLE_ORDER.forEach((table) => {
    lines.push(`-- ${table}`);
    lines.push(buildInsertSql(table, data[table]));
  });

  lines.push("COMMIT;");
  lines.push("");

  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  console.log(`Generated SQL: ${outputPath}`);
}

main();
