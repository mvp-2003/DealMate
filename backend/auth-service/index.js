const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { auth } = require('express-oauth2-jwt-bearer');
const pg = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const morgan = require('morgan');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'auth-service-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'auth-service-combined.log' }),
  ],
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const checkInternalSecret = (req, res, next) => {
    const secret = req.headers['x-internal-secret'];
    if (!secret || secret !== process.env.INTER_SERVICE_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
});

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// This middleware will run after the JWT is validated,
// and it will sync the user with our database.
const syncUser = async (req, res, next) => {
    const { sub, email } = req.auth.payload;

    try {
        let userResult = await pool.query('SELECT * FROM users WHERE auth0_user_id = $1', [sub]);

        if (userResult.rows.length === 0) {
            // User does not exist, create them
            const newUserResult = await pool.query(
                'INSERT INTO users (auth0_user_id, email) VALUES ($1, $2) RETURNING *',
                [sub, email]
            );
            req.user = newUserResult.rows[0];
        } else {
            // User exists, attach them to the request
            req.user = userResult.rows[0];
        }
        next();
    } catch (error) {
        logger.error('Error syncing user:', error);
        res.status(500).json({ message: 'Error syncing user' });
    }
};


app.get('/api/public', (req, res) => {
  res.json({
    message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
  });
});

// This route needs authentication
app.get('/api/private', checkJwt, (req, res) => {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated to see this.'
  });
});

// This route will be called by the frontend after an Auth0 login
// to ensure the user is in our database.
app.post('/api/auth/token', checkInternalSecret, checkJwt, syncUser, (req, res) => {
    res.json(req.user);
});

// This is a protected route that returns the user's profile from our database.
app.get('/api/user/profile', checkInternalSecret, checkJwt, syncUser, (req, res) => {
    res.json(req.user);
});

// Local authentication routes
app.post('/api/auth/register', checkInternalSecret, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUserResult = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
            [email, password_hash]
        );

        res.status(201).json(newUserResult.rows[0]);
    } catch (error) {
        logger.error('Error registering user:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        res.status(500).json({ message: 'Error registering user' });
    }
});

app.post('/api/auth/login', checkInternalSecret, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        if (!user.password_hash) {
            return res.status(401).json({ message: 'Login with your social provider' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const payload = {
            sub: user.id,
            email: user.email,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        logger.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in user' });
    }
});


const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
