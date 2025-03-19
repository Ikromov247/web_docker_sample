// server.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'dbuser',
    password: process.env.DB_PASSWORD || 'dbpassword',
    database: process.env.DB_NAME || 'mydatabase',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create a pool
let pool;

// Function to wait for MariaDB to be ready
async function waitForMariaDB(maxAttempts = 10, delay = 5000) {
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            // Create the pool if it doesn't exist
            if (!pool) {
                pool = mysql.createPool(dbConfig);
            }
            
            // Test the connection
            const connection = await pool.getConnection();
            console.log('Successfully connected to MariaDB');
            connection.release();
            return true;
        } catch (err) {
            attempts++;
            console.log(`MariaDB connection attempt ${attempts}/${maxAttempts} failed. Retrying in ${delay/1000} seconds...`);
            console.error('Connection error:', err.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Could not connect to MariaDB after multiple attempts');
}

// Initialize database
async function initializeDb() {
    // First wait for MariaDB to be ready
    await waitForMariaDB();
    
    try {
        console.log('Creating tables...');
        
        // Create items table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert some sample data if table is empty
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM items');
        
        if (parseInt(rows[0].count) === 0) {
            await pool.query(`
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
    }
}

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is up and running' });
});

app.get('/items', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM items ORDER BY id');
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
        const [result] = await pool.query(
            'INSERT INTO items (name, description) VALUES (?, ?)',
            [name, description]
        );
        
        const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [result.insertId]);
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