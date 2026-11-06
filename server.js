const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-demo-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));
app.use(express.static(path.join(__dirname, 'public')));

function requirePatient(req, res, next) {
  if (!req.session.patientId) return res.status(401).json({ error: 'Please log in first.' });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) return res.status(401).json({ error: 'Admin login required.' });
  next();
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', application: 'Hospital Appointment Booking System' }));

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Enter name, email and a password with at least 6 characters.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO patients (name, email, password) VALUES (?, ?, ?)', [name.trim(), email.trim().toLowerCase(), hash], function (err) {
      if (err) return res.status(409).json({ error: 'This email is already registered.' });
      req.session.patientId = this.lastID;
      req.session.patientName = name.trim();
      res.status(201).json({ message: 'Registration successful. You are logged in.', patient: { id: this.lastID, name: name.trim() } });
    });
  } catch {
    res.status(500).json({ error: 'Could not register patient.' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM patients WHERE email = ?', [(email || '').trim().toLowerCase()], async (err, patient) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!patient || !(await bcrypt.compare(password || '', patient.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    req.session.patientId = patient.id;
    req.session.patientName = patient.name;
    res.json({ message: 'Login successful.', patient: { id: patient.id, name: patient.name } });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out.' }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.patientId) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, patient: { id: req.session.patientId, name: req.session.patientName } });
});

app.get('/api/doctors', (req, res) => {
  const specialization = (req.query.specialization || '').trim();
  const sql = specialization
    ? 'SELECT id, name, specialization, available_days FROM doctors WHERE specialization LIKE ? ORDER BY name'
    : 'SELECT id, name, specialization, available_days FROM doctors ORDER BY name';
  db.all(sql, specialization ? [`%${specialization}%`] : [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not load doctors.' });
    res.json(rows);
  });
});

app.post('/api/appointments', requirePatient, (req, res) => {
  const { doctorId, appointmentDate, appointmentTime, reason } = req.body;
  if (!doctorId || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ error: 'Choose a doctor, date and time.' });
  }
  const chosen = new Date(`${appointmentDate}T${appointmentTime}`);
  if (Number.isNaN(chosen.getTime()) || chosen < new Date()) {
    return res.status(400).json({ error: 'Choose a valid future date and time.' });
  }
  db.run(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [req.session.patientId, Number(doctorId), appointmentDate, appointmentTime, reason || ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'Could not book appointment. Check the doctor selection.' });
      res.status(201).json({ message: 'Appointment booked successfully.', appointmentId: this.lastID });
    }
  );
});

app.get('/api/appointments', requirePatient, (req, res) => {
  db.all(
    `SELECT a.id, a.appointment_date, a.appointment_time, a.reason, a.status,
            d.name AS doctor_name, d.specialization
     FROM appointments a JOIN doctors d ON d.id = a.doctor_id
     WHERE a.patient_id = ? ORDER BY a.appointment_date, a.appointment_time`,
    [req.session.patientId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Could not load appointments.' });
      res.json(rows);
    }
  );
});

app.patch('/api/appointments/:id/cancel', requirePatient, (req, res) => {
  db.run(
    `UPDATE appointments SET status = 'Cancelled'
     WHERE id = ? AND patient_id = ? AND status = 'Booked'`,
    [Number(req.params.id), req.session.patientId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Could not cancel appointment.' });
      if (!this.changes) return res.status(404).json({ error: 'Active appointment not found.' });
      res.json({ message: 'Appointment cancelled.' });
    }
  );
});

// Demonstration admin login: admin@hospital.com / Admin@123
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@hospital.com' && password === 'Admin@123') {
    req.session.isAdmin = true;
    return res.json({ message: 'Admin login successful.' });
  }
  res.status(401).json({ error: 'Invalid admin credentials.' });
});

app.get('/api/admin/appointments', requireAdmin, (req, res) => {
  db.all(
    `SELECT a.id, p.name AS patient_name, p.email, d.name AS doctor_name,
            d.specialization, a.appointment_date, a.appointment_time, a.reason, a.status
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     ORDER BY a.appointment_date DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Could not load admin appointments.' });
      res.json(rows);
    }
  );
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hospital Appointment Booking System running at http://localhost:${PORT}`);
});
