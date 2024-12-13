const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'CONNECTION_STRING_HERE',
    ssl: { rejectUnauthorized: false }
});

// Vytvoření tabulky při spuštění
pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        name TEXT,
        address TEXT,
        note TEXT,
        date DATE,
        time TIME
    );
`);

// Získání všech schůzek
app.get('/api/appointments', async (req, res) => {
    const result = await pool.query('SELECT * FROM appointments');
    res.json(result.rows);
});

// Přidání nové schůzky
app.post('/api/appointments', async (req, res) => {
    const { name, address, note, date, time } = req.body;
    const result = await pool.query(
        'INSERT INTO appointments (name, address, note, date, time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, address, note, date, time]
    );
    res.status(201).json(result.rows[0]);
});

// Smazání schůzky
app.delete('/api/appointments/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
    res.json({ message: 'Schůzka smazána' });
});
