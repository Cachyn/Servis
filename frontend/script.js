
const API_URL = 'http://localhost:3000/api/appointments';
const form = document.getElementById('appointmentForm');
const tableBody = document.querySelector('#appointmentTable tbody');
let appointments = [];

// Load appointments from backend
async function loadAppointments() {
    const response = await fetch(API_URL);
    appointments = await response.json();
    renderAppointments();
}

// Add a new appointment
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const note = document.getElementById('note').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    const appointment = { name, address, note, date, time };
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment)
    });

    if (response.ok) {
        loadAppointments();
        form.reset();
    }
});

// Render appointments in the table
function renderAppointments() {
    tableBody.innerHTML = '';
    appointments.forEach((appointment) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${appointment.date} ${appointment.time}</td>
            <td>${appointment.name}</td>
            <td>${appointment.address}</td>
            <td>${appointment.note}</td>
            <td>
                <button class="btn delete" onclick="deleteAppointment(${appointment.id})">Smazat</button>
            </td>`;
        tableBody.appendChild(row);
    });
}

// Delete an appointment
async function deleteAppointment(id) {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (response.ok) {
        loadAppointments();
    }
}

// Load appointments on page load
loadAppointments();
