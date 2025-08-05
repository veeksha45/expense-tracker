require('dotenv').config();
const express = require('express');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/User.js'); // ✅ adjust if needed
const passwordRoutes = require('./routes/passwordRoutes');

const { sequelize } = require('./db');

const app = express();

// Static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend Views
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'signup.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/expenses', (req, res) => res.sendFile(path.join(__dirname, 'views', 'expense.html')));
app.get('/premium', (req, res) => res.sendFile(path.join(__dirname, 'views', 'premium.html')));

// API routes
app.use('/api', authRoutes);
app.use('/api', expenseRoutes);
app.use('/api', premiumRoutes);
app.use('/api', paymentRoutes);
app.use('/api', userRoutes);
app.use('/password', passwordRoutes);

// DB & server start
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ DB synced successfully');
    app.listen(3000, () => console.log(`✅ Server running at http://localhost:3000`));
  })
  .catch(err => console.error('❌ DB sync failed:', err));
