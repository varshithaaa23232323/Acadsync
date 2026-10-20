
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '.env') });

const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const { startDeadlineReminderJob, checkDeadlines } = require('./cron/deadlineReminder');

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const logSheetRoutes = require('./routes/logSheetRoutes');

// Try to connect to MongoDB
console.log('📡 Attempting to connect to MongoDB...');
connectDB().catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

const app = express();

// 🔥 ALLOW ALL ORIGINS (Bypasses the CORS error completely)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests (Fixed syntax for Express v5)


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/logsheet', logSheetRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: '🎉 AcadSync API is running!' });
});

// Test route for manual reminder trigger
app.get('/api/test/check-deadlines', async (req, res) => {
  try {
    await checkDeadlines();
    res.json({ success: true, message: 'Deadline check completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start cron job
startDeadlineReminderJob();

// Error handler
app.use(errorHandler);

// 404 handler (Fixed syntax for Express v5)

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});