require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Diagnostické logy při spuštění serveru
console.log('--- START SERVERU ---');
console.log('GITHUB_OWNER:', process.env.GITHUB_OWNER);
console.log('GITHUB_REPO:', process.env.GITHUB_REPO);
console.log('GITHUB_TOKEN (první 5 znaků):', process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.slice(0, 5) : 'NEEXISTUJE');

// Endpoint pro vytvoření schůzky
app.post('/api/appointments', async (req, res) => {
    const { name, address, phone, appliance, note, date, time, technician } = req.body;

    // Vytvoření názvu souboru a obsahu
    const fileName = `appointments/appointment_${Date.now()}.json`;
    const content = Buffer.from(JSON.stringify({ name, address, phone, appliance, note, date, time, technician }, null, 2)).toString('base64');

    console.log('--- ZAČÍNÁ UKLÁDÁNÍ SCHŮZKY ---');
    console.log('OWNER:', OWNER);
    console.log('REPO:', REPO);
    console.log('PATH:', fileName);
    console.log('Obsah souboru (base64):', content);

    try {
        const response = await octokit.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: REPO,
            path: fileName,
            message: `Nová schůzka: ${name}`,
            content
        });

        console.log('Úspěšně uloženo na GitHub! Odpověď:', response.data);
        res.status(201).json({ message: 'Schůzka uložena na GitHub.' });
    } catch (error) {
        console.error('Chyba při ukládání na GitHub:', error);
        res.status(500).json({ message: 'Nepodařilo se uložit schůzku.' });
    }
});

// Endpoint pro načtení všech schůzek
app.get('/api/appointments', async (req, res) => {
    console.log('--- ZAČÍNÁ NAČÍTÁNÍ SCHŮZEK ---');
    try {
        const response = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: 'appointments'
        });

        const files = response.data;
        console.log('Nalezené soubory ve složce `appointments`:', files);

        const appointments = await Promise.all(
            files.map(async (file) => {
                console.log('Načítám obsah souboru:', file.path);
                const fileData = await octokit.repos.getContent({
                    owner: OWNER,
                    repo: REPO,
                    path: file.path
                });

                const content = Buffer.from(fileData.data.content, 'base64').toString();
                console.log('Obsah souboru (decoded):', content);
                return JSON.parse(content);
            })
        );

        res.json(appointments);
    } catch (error) {
        console.error('Chyba při načítání schůzek:', error);
        res.status(500).json({ message: 'Nepodařilo se načíst schůzky.' });
    }
});

// Spuštění serveru
app.listen(PORT, () => {
    console.log(`Server běží na portu ${PORT}`);
});
