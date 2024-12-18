const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const DATA_FILE = './appointments.json';

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Load saved appointments
function loadAppointments() {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    }
    return [];
}

// Save appointments to file
function saveAppointments(appointments) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(appointments, null, 2));
}

// API: Get all appointments
app.get('/api/appointments', (req, res) => {
    const appointments = loadAppointments();
    res.json(appointments);
});

// API: Add new appointment
app.post('/api/appointments', (req, res) => {
    const appointment = req.body;
    const appointments = loadAppointments();
    appointment.id = Date.now();
    appointments.push(appointment);
    saveAppointments(appointments);
    res.status(201).json({ message: 'Appointment added', appointment });
});

// API: Delete appointment
app.delete('/api/appointments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let appointments = loadAppointments();
    appointments = appointments.filter(appt => appt.id !== id);
    saveAppointments(appointments);
    res.json({ message: 'Appointment deleted' });
});

// API: Update appointment
app.put('/api/appointments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updatedAppointment = req.body;
    let appointments = loadAppointments();
    appointments = appointments.map(appt => appt.id === id ? { ...appt, ...updatedAppointment } : appt);
    saveAppointments(appointments);
    res.json({ message: 'Appointment updated', updatedAppointment });
});

// Start server
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});