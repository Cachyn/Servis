const express = require('express');
const { Octokit } = require('@octokit/rest'); // Import Octokit pro připojení k GitHubu

// Nastavení aplikace Express
const app = express();
app.use(express.json());  // Pro parsování JSON těla požadavků

// Nastavení pro připojení k GitHubu prostřednictvím Octokit
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN // Token by měl být nastaven v prostředí na Render.com
});

// **VYPLŇTE**: Vaše GitHub uživatelské jméno (doplňte přímo na Render.com jako environment variable)
const OWNER = process.env.GITHUB_OWNER || 'Cachyn@seznam.cz'; // Vaše GitHub uživatelské jméno

// **VYPLŇTE**: Název vašeho GitHub repozitáře (doplňte přímo na Render.com jako environment variable)
const REPO = process.env.GITHUB_REPO || 'Servis';  // Název repozitáře

// POST endpoint pro přidání nové schůzky
app.post('/api/appointments', async (req, res) => {
    const { name, address, phone, appliance, note, date, time, technician } = req.body;

    // Určení názvu souboru s aktuálním časovým razítkem
    const fileName = `appointments/appointment_${Date.now()}.json`;  // Cesta k souboru
    const content = Buffer.from(JSON.stringify({ name, address, phone, appliance, note, date, time, technician }, null, 2)).toString('base64');

    try {
        // Vytvoření nebo aktualizace souboru v repozitáři na GitHubu
        await octokit.repos.createOrUpdateFileContents({
            owner: OWNER,  // Vaše GitHub uživatelské jméno
            repo: REPO,    // Název repozitáře
            path: fileName,  // Cesta k souboru v repozitáři
            message: `Nová schůzka: ${name}`,  // Zpráva pro commit
            content: content  // Obsah souboru (schůzka ve formátu JSON)
        });
        res.status(201).json({ message: 'Schůzka uložena na GitHub.' });
    } catch (error) {
        console.error('Chyba při ukládání na GitHub:', error);
        res.status(500).json({ message: 'Nepodařilo se uložit schůzku.' });
    }
});

// GET endpoint pro načítání všech schůzek
app.get('/api/appointments', async (req, res) => {
    try {
        // Načítání obsahu složky appointments z repozitáře GitHub
        const response = await octokit.repos.getContent({
            owner: OWNER,  // Vaše GitHub uživatelské jméno
            repo: REPO,    // Název repozitáře
            path: 'appointments'  // Cesta ke složce ve repozitáři (pokud existuje)
        });

        // Načítání jednotlivých souborů a jejich obsahu
        const files = response.data;
        const appointments = await Promise.all(
            files.map(async (file) => {
                const fileData = await octokit.repos.getContent({
                    owner: OWNER,  // Vaše GitHub uživatelské jméno
                    repo: REPO,    // Název repozitáře
                    path: file.path  // Cesta k souboru
                });

                // Dekódování base64 obsahu a parsování JSON
                const content = Buffer.from(fileData.data.content, 'base64').toString();
                return JSON.parse(content);
            })
        );

        res.json(appointments);  // Odeslání seznamu schůzek zpět jako JSON
    } catch (error) {
        console.error('Chyba při načítání schůzek:', error);
        res.status(500).json({ message: 'Nepodařilo se načíst schůzky.' });
    }
});

// Spuštění serveru na portu (buď na Render.com nebo lokálně)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));
