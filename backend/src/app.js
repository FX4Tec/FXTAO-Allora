const express = require('express');
const authRoutes = require('./routes/authRoutes');
const taoRoutes = require('./routes/taoRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const integrationAdminRoutes = require('./routes/integrationAdminRoutes');
const taoTransferRoutes = require('./routes/taoTransferRoutes');
const tenantContextMiddleware = require('./middlewares/tenantContextMiddleware');
const {
  requestId,
  corsMiddleware,
  helmetMiddleware,
  globalApiLimiter,
  authLimiter,
  uploadLimiter,
} = require('./middlewares/securityMiddleware');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');

app.use(requestId);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use('/api', globalApiLimiter);

const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '10mb';
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ limit: requestBodyLimit, extended: true }));

app.use(tenantContextMiddleware);

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/saas', require('./routes/saasRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/taos', taoRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/integration-admin', integrationAdminRoutes);
app.use('/api/v1/tao-transfer', taoTransferRoutes);
app.use('/api/v1/sharepoint', require('./routes/sharepointRoutes'));
app.use('/uploads', express.static('uploads'));
app.use('/api/v1/resources', require('./routes/resourceRoutes'));
app.use('/api/v1/uploads', uploadLimiter, require('./routes/uploadRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  if (err?.message === 'Origem não autorizada pelo CORS.') {
    return res.status(403).json({ error: err.message });
  }

  if (err) {
    console.error('Unhandled request error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }

  return next();
});

module.exports = app;
