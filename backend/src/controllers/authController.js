const pool = require('../db');
const { sendVerificationEmail, sendWelcomeEmail, generateVerificationCode } = require('../services/emailService');

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();

// Send verification email endpoint
const sendVerificationCode = async (req, res) => {
  try {
    const { email, username } = req.body;

    // Validation
    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required' });
    }

    // Check if email already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code temporarily
    verificationCodes.set(email, { code, expiryTime, username });

    // Send verification email
    await sendVerificationEmail(email, code, username);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      email: email, // For testing purposes only
    });
  } catch (error) {
    console.error('Error sending verification:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
};

// Verify email code endpoint
const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const stored = verificationCodes.get(email);

    // Check if code exists and hasn't expired
    if (!stored) {
      return res.status(400).json({ error: 'No verification code found for this email' });
    }

    if (Date.now() > stored.expiryTime) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code expired' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Code is valid
    verificationCodes.delete(email);

    res.json({
      success: true,
      message: 'Email verified successfully',
      verified: true,
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

// Register user endpoint
const registerUser = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    // Validation
    if (!username || !name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username exists
    const usernameExists = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (usernameExists.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email exists
    const emailExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // TODO: Hash password before storing
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const result = await pool.query(
      'INSERT INTO users (username, name, email, password, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, name',
      [username, name, email, password, true] // Mark as verified after email verification
    );

    const user = result.rows[0];

    // Send welcome email
    await sendWelcomeEmail(email, name);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login user endpoint
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    // Find user by username or email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const column = isEmail ? 'email' : 'username';

    const result = await pool.query(
      `SELECT * FROM users WHERE ${column} = $1`,
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // TODO: Compare hashed password
    // const passwordMatch = await bcrypt.compare(password, user.password);
    // if (!passwordMatch) {
    //   return res.status(401).json({ error: 'Invalid credentials' });
    // }

    // Simple password check (for demo only)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: 'user',
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

module.exports = {
  sendVerificationCode,
  verifyEmailCode,
  registerUser,
  loginUser,
};
