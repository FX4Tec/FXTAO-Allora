const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const taoRoutes = require('./routes/taoRoutes');

const app = express();

app.use(cors({
  origin: true, // Allow all origins for debugging
  credentials: true
}));

// Increase body size limits to avoid 413 Payload Too Large errors
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/taos', taoRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/v1/resources', require('./routes/resourceRoutes'));
app.use('/api/v1/uploads', require('./routes/uploadRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app;
