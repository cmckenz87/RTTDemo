const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

// Function to read SQL from file
function readSqlFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Function to run SQL commands in database
function runSqlFromFile(dbPath, sqlPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error("Error opening database", err.message);
        reject(err);
        return;
      }
      console.log("Database connected.");
    });

    readSqlFile(sqlPath)
      .then((sql) => {
        db.exec(sql, (err) => {
          if (err) {
            console.error("Error executing SQL", err.message);
            reject(err);
          } else {
            console.log("SQL script executed successfully.");
            resolve();
          }
          db.close((err) => {
            if (err) {
              console.error("Error closing database", err.message);
            } else {
              console.log("Database connection closed.");
            }
          });
        });
      })
      .catch((err) => {
        console.error("Failed to read SQL file", err);
        db.close();
        reject(err);
      });
  });
}

async function runAllSql() {
  // Specify your database file and SQL file path
  const dbPath = "./db";
  const sqlPath = "./schema.sql";
  const sqlPath2 = "./public/imperium/title.sql";

  // Run the SQL files in sequence
  await runSqlFromFile(dbPath, sqlPath);
  await runSqlFromFile(dbPath, sqlPath2);
}

runAllSql();
