const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Allow cross-origin requests only from trusted sources
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'https://yourdomain.com'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Security middleware for JavaScript files to prevent direct access to functions
app.use(/\.js$/, (req, res, next) => {
  // Add X-Content-Type-Options to prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Route for the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Custom 404 page
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// Start the server
app.listen(PORT, () => {
  console.log(`SoundGen server running at http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop the server`);
});
