const express = require('express');  
const { Octokit } = require('@octokit/rest'); // Import Octokit pro připojení k GitHubu  

// Nastavení aplikace Express  
const app = express();  
app.use(express.json());  // Pro parsování JSON těla požadavků  

// Nastavení pro připojení k GitHubu prostřednictvím Octokit  
const octokit = new Octokit({  
    auth: process.env.GITHUB_TOKEN // Načtení tokenu z environment variables  
});  

// Načtení uživatelského jména a názvu repozitáře z environment variables  
const OWNER = process.env.GITHUB_OWNER || 'Cachyn@seznam.cz'; // Vaše GitHub uživatelské jméno  
const REPO = process.env.GITHUB_REPO || 'Servis';  // Název repozitáře  

// Logování environment variables  
console.log("GITHUB_TOKEN:", process.env.GITHUB_TOKEN ? '*****' : 'TOKEN NENÍ NASTAVEN');   
console.log("GITHUB_OWNER:", OWNER);  
console.log("GITHUB_REPO:", REPO);  

// POST endpoint pro přidání nové schůzky  
app.post('/api/appointments', async (req, res) => {  
    const { name, address, phone, appliance, note, date, time, technician } = req.body;  

    try {  
        // Načti existující schůzky  
        const existingData = await octokit.repos.getContent({  
            owner: OWNER,  
            repo: REPO,  
            path: 'appointments.json'  
        });  

        // Dekódování existujících schůzek  
        const existingAppointments = JSON.parse(Buffer.from(existingData.data.content, 'base64').toString());  

        // Přidej novou schůzku  
        existingAppointments.push({ name, address, phone, appliance, note, date, time, technician });  

        // Ulož aktualizovaný seznam schůzek  
        const content = Buffer.from(JSON.stringify(existingAppointments, null, 2)).toString('base64');  
        await octokit.repos.createOrUpdateFileContents({  
            owner: OWNER,  
            repo: REPO,  
            path: 'appointments.json',  
            message: `Aktualizace schůzek`,  
            content: content  
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
        const response = await octokit.repos.getContent({  
            owner: OWNER,  
            repo: REPO,  
            path: 'appointments.json'  // Načítáme konkrétně appointments.json  
        });  

        const content = Buffer.from(response.data.content, 'base64').toString();  
        const appointments = JSON.parse(content);  // Parsování obsahu  

        res.json(appointments);  // Odeslání seznamu schůzek  
    } catch (error) {  
        console.error('Chyba při načítání schůzek:', error);  
        res.status(500).json({ message: 'Nepodařilo se načíst schůzky.' });  
    }  
});  

// Spuštění serveru na portu (buď na Render.com nebo lokálně)  
const PORT = process.env.PORT || 3000;  
app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));