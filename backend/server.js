const express = require('express');  
const { Octokit } = require('@octokit/rest');   

const app = express();  
app.use(express.json());   

const octokit = new Octokit({  
    auth: process.env.GITHUB_TOKEN  
});  

const OWNER = process.env.GITHUB_OWNER || 'Cachyn@seznam.cz';   
const REPO = process.env.GITHUB_REPO || 'Servis';   

// Add logging for the environment variables here  
console.log("GITHUB_TOKEN:", process.env.GITHUB_TOKEN ? '*****' : 'TOKEN NENÍ NASTAVEN');   
console.log("GITHUB_OWNER:", OWNER);  
console.log("GITHUB_REPO:", REPO);  

app.post('/api/appointments', async (req, res) => {  
    console.log("Received request to add appointment:", req.body);  // Log request data  

    const { name, address, phone, appliance, note, date, time, technician } = req.body;  

    try {  
        const existingData = await octokit.repos.getContent({  
            owner: OWNER,  
            repo: REPO,  
            path: 'appointments.json'  
        });  

        // Log existing data retrieval  
        console.log('Existing data retrieved from GitHub:', existingData);  
        
        const existingAppointments = JSON.parse(Buffer.from(existingData.data.content, 'base64').toString());  

        existingAppointments.push({ name, address, phone, appliance, note, date, time, technician });  

        console.log('Pokoušejí se uložit schůzky:', existingAppointments);  
        const content = Buffer.from(JSON.stringify(existingAppointments, null, 2)).toString('base64');  

        await octokit.repos.createOrUpdateFileContents({  
            owner: OWNER,  
            repo: REPO,  
            path: 'appointments.json',  
            message: `Aktualizace schůzek`,  
            content: content  
        });  
        
        console.log('Schůzky byly úspěšně uloženy.');  
        res.status(201).json({ message: 'Schůzka uložena na GitHub.' });  
    } catch (error) {  
        console.error('Chyba při ukládání na GitHub:', error);  
        res.status(500).json({ message: 'Nepodařilo se uložit schůzku.' });  
    }  
});  

app.get('/api/appointments', async (req, res) => {  
    try {  
        const response = await octokit.repos.getContent({  
            owner: OWNER,  
            repo: REPO,  
            path: 'appointments.json'  
        });  

        const content = Buffer.from(response.data.content, 'base64').toString();  
        const appointments = JSON.parse(content);  

        res.json(appointments);  
    } catch (error) {  
        console.error('Chyba při načítání schůzek:', error);  
        res.status(500).json({ message: 'Nepodařilo se načíst schůzky.' });  
    }  
});  

const PORT = process.env.PORT || 3000;  
app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));