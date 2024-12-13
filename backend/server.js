const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'CONNECTION_STRING_HERE',
    ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Funkce pro přidání chybějících sloupců do existující tabulky
async function addMissingColumns() {
    const columnsToAdd = [
        { name: 'phone', type: 'TEXT' },
        { name: 'appliance', type: 'TEXT' },
        { name: 'technician', type: 'TEXT' }
    ];

    for (const column of columnsToAdd) {
        try {
            await pool.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`);
        } catch (err) {
            console.error(`Chyba při přidávání sloupce ${column.name}:`, err);
        }
    }
}

// Vytvoření tabulky při spuštění, pokud neexistuje
pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        name TEXT,
        address TEXT,
        phone TEXT,
        appliance TEXT,
        note TEXT,
        date DATE,
        time TIME,
        technician TEXT
    );
`)
    .then(() => addMissingColumns())
    .catch(err => console.error('Chyba při vytváření tabulky:', err));

// Získání všech schůzek
app.get('/api/appointments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM appointments');
        res.json(result.rows);
    } catch (err) {
        console.error('Chyba při získávání schůzek:', err);
        res.status(500).json({ error: 'Chyba při získávání schůzek' });
    }
});

// Přidání nové schůzky
app.post('/api/appointments', async (req, res) => {
    const { name, address, phone, appliance, note, date, time, technician } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO appointments (name, address, phone, appliance, note, date, time, technician)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, address, phone, appliance, note, date, time, technician]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Chyba při ukládání schůzky:', err);
        res.status(500).json({ error: 'Chyba při ukládání schůzky' });
    }
});

// Smazání schůzky
app.delete('/api/appointments/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
        res.json({ message: 'Schůzka smazána' });
    } catch (err) {
        console.error('Chyba při mazání schůzky:', err);
        res.status(500).json({ error: 'Chyba při mazání schůzky' });
    }
});

// Spuštění serveru
app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
