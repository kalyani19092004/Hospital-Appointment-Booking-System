const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'hospital.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    available_days TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'Booked',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id),
    FOREIGN KEY(doctor_id) REFERENCES doctors(id)
  )`);

  db.get('SELECT COUNT(*) AS count FROM doctors', (err, row) => {
    if (!err && row.count === 0) {
      const stmt = db.prepare('INSERT INTO doctors (name, specialization, available_days) VALUES (?, ?, ?)');
      [
        ['Dr. Ananya Rao', 'Cardiology', 'Monday, Wednesday, Friday'],
        ['Dr. Rahul Sharma', 'Dermatology', 'Tuesday, Thursday, Saturday'],
        ['Dr. Meera Reddy', 'Pediatrics', 'Monday to Friday'],
        ['Dr. Arjun Kumar', 'Orthopedics', 'Monday, Thursday, Saturday'],
        ['Dr. Priya Nair', 'Neurology', 'Tuesday, Wednesday, Friday']
      ].forEach(d => stmt.run(d));
      stmt.finalize();
    }
  });
});

module.exports = db;
