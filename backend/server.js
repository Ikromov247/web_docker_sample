// server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Function to wait for postgres to be ready
async function waitForPostgres(maxAttempts = 10, delay = 5000) {
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            const client = await pool.connect();
            console.log('Successfully connected to PostgreSQL');
            client.release();
            return true;
        } catch (err) {
            attempts++;
            console.log(`PostgreSQL connection attempt ${attempts}/${maxAttempts} failed. Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Could not connect to PostgreSQL after multiple attempts');
}

// Initialize database
async function initializeDb() {
    // First wait for PostgreSQL to be ready
    await waitForPostgres();
    
    // Then initialize the database
    let client;
    try {
        client = await pool.connect();
        console.log('Creating tables...');
        
        // Create items table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert some sample data if table is empty
        const { rows } = await client.query('SELECT COUNT(*) FROM items');
        
        if (parseInt(rows[0].count) === 0) {
            await client.query(`
                INSERT INTO items (name, description) VALUES
                ('Item 1', 'This is the first item'),
                ('Item 2', 'This is the second item'),
                ('Item 3', 'This is the third item')
            `);
            console.log('Sample data inserted');
        }
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error; // Rethrow to handle in the calling function
    } finally {
        if (client) client.release();
    }
}

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is up and running' });
});

app.get('/items', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM items ORDER BY id');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/items', async (req, res) => {
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    
    try {
        const { rows } = await pool.query(
            'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server only after database initialization
async function startServer() {
    try {
        // Wait for database to initialize first
        console.log('Initializing database...');
        await initializeDb();
        
        // Then start the server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the application
startServer();