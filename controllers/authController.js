const bcrypt = require('bcrypt');
const pool = require('../config/db');
const userModel = require('../models/userModel');
const profileModel = require('../models/profileModel');

async function register(req, res, next) {
  const { username, email, password, display_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await userModel.createUser(conn, {
      username,
      email,
      passwordHash,
    });

    await profileModel.createProfile(conn, {
      userId,
      displayName: display_name,
      username,
    });

    await conn.commit();

    req.session.user = {
      user_id: userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role: 'user',
    };

    res.status(201).json({ message: 'Registered successfully.', user: req.session.user });
  } catch (error) {
    await conn.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    next(error);
  } finally {
    conn.release();
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid login.' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid login.' });

    req.session.user = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    res.json({ message: 'Logged in successfully.', user: req.session.user });
  } catch (error) {
    next(error);
  }
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie('fitshare.sid');
    res.json({ message: 'Logged out successfully.' });
  });
}

function me(req, res) {
  res.json({ user: req.session.user || null });
}

module.exports = {
  register,
  login,
  logout,
  me,
};
