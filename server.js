const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');  // Import Octokit

const app = express();

// GitHub autentifikace
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Nastav tuto proměnnou na Render.com
const GITHUB_OWNER = 'Cachyn@seznam.cz';  // Tvé GitHub uživatelské jméno
const GITHUB_REPO = 'Servis';   // Název tvého repozitáře
const FILE_PATH = 'appointments.json'; // Cesta k souboru v GitHub repozitáři

const octokit = new Octokit({
    auth: GITHUB_TOKEN
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Načítání schůzek z GitHubu
async function loadAppointments() {
    try {
        const { data } = await octokit.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: FILE_PATH
        });

        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading appointments:', error);
        return [];
    }
}

// Uložení schůzek do GitHubu
async function saveAppointments(appointments) {
    try {
        const currentData = await loadAppointments();

        const updatedAppointments = [...currentData, ...appointments];
        const updatedContent = JSON.stringify(updatedAppointments, null, 2);

        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: FILE_PATH,
            message: 'Add new appointment',
            content: Buffer.from(updatedContent).toString('base64'),
            sha: data.sha // Tento SHA je potřeba pro úpravu souboru, pokud již existuje
        });

        console.log('Appointments saved to GitHub:', data.content);
    } catch (error) {
        console.error('Error saving appointments:', error);
    }
}

// API: Get all appointments
app.get('/api/appointments', async (req, res) => {
    const appointments = await loadAppointments();
    res.json(appointments);
});

// API: Add new appointment
app.post('/api/appointments', async (req, res) => {
    const appointment = req.body;
    const appointments = await loadAppointments();
    appointment.id = Date.now();
    appointments.push(appointment);

    await saveAppointments(appointments);

    res.status(201).json({ message: 'Appointment added', appointment });
});

// API: Delete appointment
app.delete('/api/appointments/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let appointments = await loadAppointments();
    appointments = appointments.filter(appt => appt.id !== id);

    await saveAppointments(appointments);

    res.json({ message: 'Appointment deleted' });
});

// API: Update appointment
app.put('/api/appointments/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const updatedAppointment = req.body;
    let appointments = await loadAppointments();
    appointments = appointments.map(appt => appt.id === id ? { ...appt, ...updatedAppointment } : appt);

    await saveAppointments(appointments);

    res.json({ message: 'Appointment updated', updatedAppointment });
});

// Start server
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
