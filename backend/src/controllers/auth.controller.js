const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usersRepository = require('../repositories/users.repository');

const JWT_SECRET = process.env.JWT_SECRET || '';

async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await usersRepository.create({ email, passwordHash });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await usersRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = { register, login };
