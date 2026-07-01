require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const commentRoutes = require('./routes/commentRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const metaRoutes = require('./routes/metaRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(
  session({
    name: 'fitshare.sid',
    secret: process.env.SESSION_SECRET || 'dev_secret_replace_this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.get('/', (_req, res) => {
  res.json({
    app: 'FitShare API',
    status: 'running',
    architecture: 'MVC',
    useful_routes: [
      'POST /auth/register',
      'POST /auth/login',
      'GET /auth/me',
      'GET /workouts',
      'POST /workouts',
      'GET /workouts/:slug',
      'GET /exercises',
      'GET /meta',
    ],
  });
});

app.use('/auth', authRoutes);
app.use('/profiles', profileRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/workouts', workoutRoutes);
app.use('/meta', metaRoutes);
app.use(commentRoutes);
app.use(interactionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FitShare MVC server running on http://localhost:${PORT}`);
});
