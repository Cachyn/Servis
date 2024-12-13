const API_URL = 'https://servis-6h2v.onrender.com/api/appointments';
const form = document.getElementById('appointmentForm');
const tableBody = document.querySelector('#appointmentTable tbody');
let appointments = [];

// Načtení všech schůzek z backendu
async function loadAppointments() {
    const response = await fetch(API_URL);
    appointments = await response.json();
    renderAppointments();
}

// Přidání nové schůzky
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const appointment = {
        name: document.getElementById('name').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
        appliance: document.getElementById('appliance').value,
        note: document.getElementById('note').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        technician: document.getElementById('technician').value
    };

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

// Zobrazení schůzek
function renderAppointments() {
    tableBody.innerHTML = '';
    appointments.forEach((appointment) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${appointment.date} ${appointment.time}</td>
            <td>${appointment.name}</td>
            <td>${appointment.address}</td>
            <td>${appointment.phone}</td>
            <td>${appointment.appliance}</td>
            <td>${appointment.note}</td>
            <td>${appointment.technician}</td>
            <td>
                <button class="btn delete" onclick="deleteAppointment(${appointment.id})">Smazat</button>
            </td>`;
        tableBody.appendChild(row);
    });
}

// Smazání schůzky
async function deleteAppointment(id) {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (response.ok) {
        loadAppointments();
    }
}

// Načíst schůzky při načtení stránky
loadAppointments();
