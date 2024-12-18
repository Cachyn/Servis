// Import potřebných knihoven
const express = require('express');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

// Vytvoření aplikace Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware pro parsování JSON těla požadavků
app.use(express.json());

// Proměnné pro GitHub - ZDE DOPLŇTE své údaje
const OWNER = process.env.GITHUB_OWNER || 'Cachyn';  // Uživatelské jméno na GitHubu
const REPO = process.env.GITHUB_REPO || 'Servis';    // Název repozitáře na GitHubu
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;      // GitHub token pro přístup

// Inicializace Octokit pro komunikaci s GitHubem
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Endpoint pro testování připojení k API a zobrazení nastavení
app.get('/api/debug', (req, res) => {
  res.json({
    owner: OWNER,
    repo: REPO,
    token: GITHUB_TOKEN ? 'Token je nastaven' : 'Token není nastaven',
  });
});

// Endpoint pro získání seznamu schůzek z GitHubu
app.get('/api/appointments', async (req, res) => {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: 'appointments.json', // Cesta k souboru na GitHubu
    });

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    res.json(JSON.parse(content)); // Vrátí obsah appointments.json
  } catch (error) {
    console.error('Chyba při získávání dat:', error);
    res.status(500).send('Chyba při získávání schůzek.');
  }
});

// Endpoint pro přidání nové schůzky
app.post('/api/appointments', async (req, res) => {
  const { name, address, phone, appliance, note, date, time, technician } = req.body;

  const newAppointment = {
    name,
    address,
    phone,
    appliance,
    note,
    date,
    time,
    technician,
    id: Date.now(), // Unikátní ID na základě aktuálního času
  };

  try {
    // Získání existujících schůzek
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: 'appointments.json',
    });

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const appointments = JSON.parse(content);

    // Přidání nové schůzky do existujících
    appointments.push(newAppointment);

    // Uložení aktualizovaného seznamu schůzek zpět na GitHub
    const fileContent = Buffer.from(JSON.stringify(appointments, null, 2), 'utf-8').toString('base64');

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: 'appointments.json',
      message: `Nová schůzka: ${name}`,
      content: fileContent,
    });

    res.json({ message: 'Appointment added', appointment: newAppointment });
  } catch (error) {
    console.error('Chyba při přidávání schůzky:', error);
    res.status(500).send('Chyba při přidávání schůzky.');
  }
});

// Spuštění serveru
app.listen(port, () => {
  console.log(`Server běží na portu ${port}`);
});
