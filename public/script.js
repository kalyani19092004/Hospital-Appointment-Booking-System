const $ = (id) => document.getElementById(id);
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function showMessage(id, message, isError = false) {
  $(id).textContent = message;
  $(id).style.color = isError ? '#b33b3b' : '';
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function loadDoctors(specialization = '') {
  try {
    const doctors = await api('/api/doctors' + (specialization ? '?specialization=' + encodeURIComponent(specialization) : ''));
    $('doctor-list').innerHTML = doctors.length ? doctors.map(d => `
      <article class="doctor-card">
        <div class="doctor-avatar">+</div>
        <h3>${escapeHtml(d.name)}</h3>
        <p class="specialty">${escapeHtml(d.specialization)}</p>
        <p>Available: ${escapeHtml(d.available_days)}</p>
        <button type="button" onclick="selectDoctor(${d.id})">Book this doctor</button>
      </article>`).join('') : '<p class="empty">No doctors found for that specialization.</p>';
    $('doctor-select').innerHTML = '<option value="">Select a doctor</option>' + doctors.map(d =>
      `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.specialization)}</option>`).join('');
  } catch (e) { $('doctor-list').textContent = e.message; }
}
window.selectDoctor = (id) => { $('doctor-select').value = String(id); location.hash = '#booking'; };
async function refreshMe() {
  const me = await api('/api/me');
  $('user-status').textContent = me.loggedIn ? `Hi, ${me.patient.name}` : 'Guest';
  if (me.loggedIn) loadAppointments();
}
$('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const result = await api('/api/register', { method: 'POST', body: JSON.stringify({
      name: $('register-name').value, email: $('register-email').value, password: $('register-password').value
    }) });
    showMessage('account-message', result.message); $('register-form').reset(); await refreshMe();
  } catch (err) { showMessage('account-message', err.message, true); }
});
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const result = await api('/api/login', { method: 'POST', body: JSON.stringify({
      email: $('login-email').value, password: $('login-password').value
    }) });
    showMessage('account-message', result.message); $('login-form').reset(); await refreshMe();
  } catch (err) { showMessage('account-message', err.message, true); }
});
$('logout-button').addEventListener('click', async () => {
  try { await api('/api/logout', { method: 'POST' }); showMessage('account-message', 'Logged out.'); $('user-status').textContent = 'Guest'; $('appointment-list').innerHTML = '<p class="empty">Log in to view your appointments.</p>'; }
  catch (err) { showMessage('account-message', err.message, true); }
});
$('search-button').addEventListener('click', () => loadDoctors($('specialization-search').value));
$('show-all-button').addEventListener('click', () => { $('specialization-search').value = ''; loadDoctors(); });
$('specialization-search').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); loadDoctors(e.target.value); } });
$('booking-form').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const result = await api('/api/appointments', { method: 'POST', body: JSON.stringify({
      doctorId: $('doctor-select').value,
      appointmentDate: $('appointment-date').value,
      appointmentTime: $('appointment-time').value,
      reason: $('appointment-reason').value
    }) });
    showMessage('booking-message', `${result.message} Appointment ID: ${result.appointmentId}`);
    $('booking-form').reset(); await loadAppointments();
  } catch (err) { showMessage('booking-message', err.message, true); }
});
async function loadAppointments() {
  try {
    const appointments = await api('/api/appointments');
    $('appointment-list').innerHTML = appointments.length ? appointments.map(a => `
      <article class="appointment-card">
        <div><h3>${escapeHtml(a.doctor_name)} — ${escapeHtml(a.specialization)}</h3>
        <p>${escapeHtml(a.appointment_date)} at ${escapeHtml(a.appointment_time)}</p>
        <p>Reason: ${escapeHtml(a.reason || 'Not specified')}</p>
        <span class="status">${escapeHtml(a.status)}</span></div>
        ${a.status === 'Booked' ? `<button class="secondary" onclick="cancelAppointment(${a.id})">Cancel appointment</button>` : ''}
      </article>`).join('') : '<p class="empty">You have no appointments yet.</p>';
  } catch (err) { $('appointment-list').innerHTML = `<p class="empty">${escapeHtml(err.message)}</p>`; }
}
window.cancelAppointment = async id => {
  try { await api(`/api/appointments/${id}/cancel`, { method: 'PATCH' }); showMessage('booking-message', 'Appointment cancelled.'); await loadAppointments(); }
  catch (err) { showMessage('booking-message', err.message, true); }
};
$('refresh-appointments').addEventListener('click', loadAppointments);
$('admin-login-form').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const result = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: $('admin-email').value, password: $('admin-password').value }) });
    showMessage('admin-message', result.message);
    const rows = await api('/api/admin/appointments');
    $('admin-appointments').innerHTML = rows.length ? rows.map(a => `<article class="appointment-card"><div><h3>${escapeHtml(a.patient_name)} → ${escapeHtml(a.doctor_name)}</h3><p>${escapeHtml(a.email)} | ${escapeHtml(a.specialization)}</p><p>${escapeHtml(a.appointment_date)} ${escapeHtml(a.appointment_time)} | ${escapeHtml(a.status)}</p></div></article>`).join('') : '<p class="empty">No appointments available.</p>';
  } catch (err) { showMessage('admin-message', err.message, true); }
});
$('appointment-date').min = new Date().toISOString().slice(0, 10);
loadDoctors();
refreshMe().catch(() => {});
