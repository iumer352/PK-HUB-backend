const Job = require('../models/Job');

// Get all jobs
exports.getJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Error fetching jobs', error: error.message });
    }
};

// Get a single job
exports.getJob = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ message: 'Error fetching job', error: error.message });
    }
};

// Create a job
exports.createJob = async (req, res) => {
    try {
        const job = await Job.create(req.body);
        res.status(201).json(job);
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ message: 'Error creating job posting', error: error.message });
    }
};

// Update a job
exports.updateJob = async (req, res) => {
    try {
        const { 
            title, 
            grade, 
            hiringManager, 
            hiringUrgency,
            roleOverview,
            keyResponsibilities,
            keySkillsAndCompetencies,
            functionType,
            status 
        } = req.body;
        
        const job = await Job.findByPk(req.params.id);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        await job.update({
            title,
            grade,
            hiringManager,
            hiringUrgency,
            roleOverview,
            keyResponsibilities,
            keySkillsAndCompetencies,
            functionType,
            status
        });

        res.status(200).json(job);
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ message: 'Error updating job', error: error.message });
    }
};

// Delete a job
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        await job.destroy();
        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Error deleting job', error: error.message });
    }
};