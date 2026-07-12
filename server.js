require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();

// Enable trust proxy for Render rate limiting compatibility
app.set('trust proxy', 1);

// Connect to Database
connectDB();

// Security Middlewares
// Customize helmet to allow resource loading (like google maps, google fonts, cloudinary images, custom scripts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://code.jquery.com", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "http://res.cloudinary.com", "*"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", "https://www.google.com"],
      },
    },
  })
);

app.use(cors());

// Rate Limiting (100 requests per 15 minutes for APIs)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploaded images from public/uploads folder as static
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Secure Server-Side Gatekeeper & Cache Control for Admin Panel
app.use('/admin', (req, res, next) => {
  // Set anti-caching headers for admin panel pages to prevent back-button access after logout
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Skip gatekeeper checks if it is not an HTML route (like CSS, JS, fonts, etc. loaded by allowed admin pages)
  const isHtmlRequest = req.path.endsWith('/') || req.path.endsWith('.html') || !req.path.includes('.');
  if (!isHtmlRequest) {
    return next();
  }

  // Retrieve secret key from environment variables
  const secretKey = process.env.ADMIN_SECRET_KEY || 'kdesigns_gatekeeper';
  
  // Verify secret URL query parameter
  if (req.query.secret === secretKey) {
    res.cookie('admin_access_authorized', 'true', {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days authorization
      httpOnly: false, // Access from client check if required
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    // Redirect to clean the URL query parameter from history
    const cleanUrl = req.baseUrl + req.path;
    return res.redirect(cleanUrl);
  }

  // Verify if browser holds the authorization cookie
  const cookies = req.headers.cookie || '';
  if (cookies.includes('admin_access_authorized=true')) {
    return next();
  }

  // Not authorized - redirect to public website home page
  return res.redirect('/');
});

// Serve public static folder with clean URL support (extensions parameter resolves /about to /about.html)
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html']
}));

// API Routes
app.use('/api', apiRoutes);

// Catch-all route to serve the 404 page for missing static assets/routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
