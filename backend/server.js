const express = require('express');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const app = express();
app.use(express.json());

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;

// Přidání nové schůzky
app.post('/api/appointments', async (req, res) => {
    const { name, address, phone, appliance, note, date, time, technician } = req.body;

    // Vytvoření souboru JSON s aktuální schůzkou
    const fileName = `appointments/appointment_${Date.now()}.json`;
    const content = Buffer.from(JSON.stringify({ name, address, phone, appliance, note, date, time, technician }, null, 2)).toString('base64');

    try {
        await octokit.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: REPO,
            path: fileName,
            message: `Nová schůzka: ${name}`,
            content
        });
        res.status(201).json({ message: 'Schůzka uložena na GitHub.' });
    } catch (error) {
        console.error('Chyba při ukládání na GitHub:', error);
        res.status(500).json({ message: 'Nepodařilo se uložit schůzku.' });
    }
});

// Načtení všech schůzek
app.get('/api/appointments', async (req, res) => {
    try {
        const response = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: 'appointments'
        });

        const files = response.data;
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
        console.error('Chyba při načítání schůzek:', error);
        res.status(500).json({ message: 'Nepodařilo se načíst schůzky.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));
