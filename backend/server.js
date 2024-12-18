console.log('GitHub zápis začal: ', fileName);
console.log('Obsah, který ukládáme:', JSON.stringify({ name, address, phone, appliance, note, date, time, technician }));

require('dotenv').config();
const express = require('express');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(express.json());

// Inicializace Octokit s GitHub tokenem
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

// Konstanty z environment proměnných
const OWNER = process.env.GITHUB_OWNER; // Cachyn@seznam.cz
const REPO = process.env.GITHUB_REPO; // Servis

// Přidání nové schůzky
app.post('/api/appointments', async (req, res) => {
    const { name, address, phone, appliance, note, date, time, technician } = req.body;

    // Název souboru pro schůzku
    const fileName = `appointments/appointment_${Date.now()}.json`;
    const content = Buffer.from(JSON.stringify({ name, address, phone, appliance, note, date, time, technician }, null, 2)).toString('base64');

    try {
        // Uložit schůzku na GitHub
        const response = await octokit.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: REPO,
            path: fileName,
            message: `Nová schůzka: ${name}`,
            content
        });

        console.log('GitHub Response:', response.data);
        res.status(201).json({ message: 'Schůzka uložena na GitHub.', appointment: { name, address, phone, appliance, note, date, time, technician, id: Date.now() } });
    } catch (error) {
        console.error('GitHub Error:', error.message);
        res.status(500).json({ message: 'Nepodařilo se uložit schůzku na GitHub.', error: error.message });
    }
});

// Načtení všech schůzek
app.get('/api/appointments', async (req, res) => {
    try {
        // Získat seznam souborů z GitHub složky
        const response = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: 'appointments'
        });

        const files = response.data; // Seznam souborů
        const appointments = await Promise.all(
            files.map(async (file) => {
                const fileData = await octokit.repos.getContent({
                    owner: OWNER,
                    repo: REPO,
                    path: file.path
                });

                const content = Buffer.from(fileData.data.content, 'base64').toString();
                return JSON.parse(content);
            })
        );

        res.json(appointments);
    } catch (error) {
        console.error('GitHub Error:', error.message);
        res.status(500).json({ message: 'Nepodařilo se načíst schůzky z GitHubu.', error: error.message });
    }
});

// Endpoint pro kontrolu GitHub připojení
app.get('/api/test-github', async (req, res) => {
    try {
        const response = await octokit.repos.get({
            owner: OWNER,
            repo: REPO
        });

        res.status(200).json({ message: 'GitHub připojení funguje.', repo: response.data });
    } catch (error) {
        console.error('GitHub Connection Error:', error.message);
        res.status(500).json({ message: 'Chyba při připojení na GitHub.', error: error.message });
    }
});

// Start serveru
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));
