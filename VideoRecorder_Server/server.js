const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); 
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Routes
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Returns API information and documentation link
 *     tags: []
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Video Recorder API is running!
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'Video Recorder API is running!',
    documentation: '/api-docs',
    version: '1.0.0'
  });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Video Recorder API Documentation'
}));

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 Swagger API Documentation: http://localhost:${PORT}/api-docs`);
  
  const videoModel = require('./models/videoModel');
  setInterval(() => {
    const result = videoModel.rescanVideos();
    if (result.added > 0) {
      console.log(`[AUTO-RESCAN] Added ${result.added} new videos. Total: ${result.total}`);
    }
  }, 5 * 60 * 1000); 
});

