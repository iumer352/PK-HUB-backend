const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');

// Import routes
const applicantRoutes = require('./routes/applicantRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const projectRoutes = require('./routes/projectRoutes');
const interviewerRoutes = require('./routes/interviewerRoutes');
const stageLookupRoutes = require('./routes/stageLookupRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const hiringManagerRoutes = require('./routes/hiringManagerRoute');

// Import model associations
require('./models/associations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase payload size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applicant', applicantRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/interviewers', interviewerRoutes);
app.use('/api/stages', stageLookupRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/hiring-managers', hiringManagerRoutes);

// Sync database and start server
const startServer = async () => {
  try {
    // Force sync all tables
    await sequelize.sync({ alter: true });
    console.log('Database synchronized - all tables recreated');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

startServer();