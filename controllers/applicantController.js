const Applicant = require('../models/Applicant');
const Job = require('../models/Job');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for resume storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/resumes';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get all applicants
exports.getApplicants = async (req, res) => {
    try {
        const applicants = await Applicant.findAll();
        res.json(applicants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single applicant
exports.getApplicant = async (req, res) => {
    try {
        const applicant = await Applicant.findByPk(req.params.id);
        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found' });
        }
        res.json(applicant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get applicants for a specific job by Job ID
exports.getApplicantsByJobId = async (req, res) => {
    const { jobId } = req.params;

    try {
        // Validate the Job ID parameter
        if (!jobId) {
            return res.status(400).json({ message: 'Job ID is required' });
        }

        // Find the job by Job ID
        const job = await Job.findByPk(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Find applicants for the job
        const applicants = await Applicant.findAll({
            where: {
                JobId: jobId
            }
        });

        if (applicants.length === 0) {
            return res.status(404).json({ message: 'No applicants found for this job' });
        }

        // Return the applicants
        res.json(applicants);
    } catch (error) {
        console.error('Error fetching applicants:', error);
        res.status(500).json({ message: 'Error fetching applicants' });
    }
};

// Create an applicant
exports.createApplicant = async (req, res) => {
    try {
        const { name, email, phone, resume, JobId } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !resume || !JobId) {
            return res.status(400).json({ 
                message: 'Please provide all required fields: name, email, phone, resume, and JobId' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Check if job exists
        const job = await Job.findByPk(JobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Create the applicant
        const applicant = await Applicant.create({
            name,
            email,
            phone,
            resume,
            status: 'applied', // default status
            JobId
        });

        res.status(201).json(applicant);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        console.error('Error creating applicant:', error);
        res.status(500).json({ message: 'Error creating applicant' });
    }
};

// Create applicants from parsed resumes
exports.createApplicantsFromParsedResumes = async (req, res) => {
    try {
        const { successful_parses, failed_files, jobId } = req.body;
        const results = {
            created: [],
            failed: []
        };

        if (!jobId) {
            return res.status(400).json({ message: 'Job ID is required' });
        }

        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
        console.log('Creating upload directory:', uploadDir);
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Created upload directory');
        }

        for (const parse of successful_parses) {
            try {
                // Check if applicant already exists for this job
                const existingApplicant = await Applicant.findOne({
                    where: {
                        email: parse.content.Email,
                        JobId: jobId
                    }
                });

                if (existingApplicant) {
                    results.failed.push({
                        name: parse.content.Name,
                        error: 'Application already exists for this job'
                    });
                    continue; // Skip to next applicant
                }

                // Save the resume file if it exists in the request
                let resumePath = null;
                if (parse.originalFile && parse.originalFile.data) {
                    const fileExt = path.extname(parse.originalFile.name);
                    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
                    resumePath = path.join(uploadDir, fileName);
                    console.log('Saving resume to:', resumePath);

                    // Convert base64 to buffer and save file
                    const fileData = Buffer.from(parse.originalFile.data, 'base64');
                    fs.writeFileSync(resumePath, fileData);
                    console.log('Resume file saved successfully');
                }

                const resumeData = {
                    ...parse.content,
                    score: parse.score || 0,
                    score_details: parse.score_details || {
                        Skills_Score: 0,
                        Experience_Score: 0,
                        Education_Score: 0,
                        Certification_Score: 0
                    },
                    resumePath: resumePath
                };

                const applicant = await Applicant.create({
                    name: parse.content.Name,
                    email: parse.content.Email,
                    phone: parse.content.Phone,
                    resume: JSON.stringify(resumeData),
                    status: 'applied',
                    JobId: jobId
                });

                results.created.push({
                    name: parse.content.Name,
                    id: applicant.id,
                    score: parse.score || 0
                });
            } catch (error) {
                console.error('Error processing applicant:', error);
                results.failed.push({
                    name: parse.content.Name,
                    error: error.message
                });
            }
        }

        res.json({
            message: 'Import completed',
            results: results
        });
    } catch (error) {
        console.error('Error importing resumes:', error);
        res.status(500).json({ message: 'Error importing resumes' });
    }
};

// Get resume file
exports.getResume = async (req, res) => {
    try {
        console.log('Getting resume for applicant ID:', req.params.id);
        
        const applicant = await Applicant.findByPk(req.params.id);
        if (!applicant) {
            console.log('Applicant not found');
            return res.status(404).json({ message: 'Applicant not found' });
        }

        console.log('Applicant found:', applicant.name);
        console.log('Resume data:', applicant.resume);

        const resumeData = JSON.parse(applicant.resume);
        console.log('Parsed resume data:', resumeData);
        
        const resumePath = resumeData.resumePath;
        console.log('Resume path:', resumePath);

        if (!resumePath) {
            console.log('No resume path found in data');
            return res.status(404).json({ message: 'Resume path not found' });
        }

        if (!fs.existsSync(resumePath)) {
            console.log('Resume file not found at path:', resumePath);
            return res.status(404).json({ message: 'Resume file not found' });
        }

        console.log('Sending file from path:', path.resolve(resumePath));
        res.sendFile(path.resolve(resumePath));
    } catch (error) {
        console.error('Error retrieving resume:', error);
        res.status(500).json({ message: 'Error retrieving resume' });
    }
};

// Update applicant status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const applicant = await Applicant.findByPk(id);
        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found' });
        }

        await applicant.update({ status });
        res.json(applicant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update offer status
exports.updateOfferStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { offer_status } = req.body;

        // Validate offer status
        const validStatuses = ['pending','accepted', 'rejected'];
        if (!validStatuses.includes(offer_status)) {
            return res.status(400).json({ 
                message: `Invalid offer status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }

        const applicant = await Applicant.findByPk(id);
        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found' });
        }

        await applicant.update({ offer_status });

        // If offer is accepted or rejected, also update the main status
        if (offer_status === 'accepted') {
            await applicant.update({ status: 'offer_accepted' });
        } else if (offer_status === 'rejected') {
            await applicant.update({ status: 'offer_rejected' });
        }

        res.json({ message: 'Offer status updated successfully', applicant });
    } catch (error) {
        console.error('Error updating offer status:', error);
        res.status(500).json({ 
            message: 'Error updating offer status', 
            error: error.message 
        });
    }
};
// ... existing imports and code ...

// Update AI result for an employee
exports.updateAiResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { ai_result } = req.body;

        // Validate AI result value
        if (!['shortlisted', 'rejected'].includes(ai_result)) {
            return res.status(400).json({ 
                message: 'AI result must be either "shortlisted" or "rejected"' 
            });
        }

        const [updatedRowsCount, [updatedApplicant]] = await Applicant.update(
            { ai_result },
            {
                where: { id },
                returning: true
            }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ message: 'Applicant not found' });
        }

        res.json({
            message: 'AI result updated successfully',
            applicant: updatedApplicant
        });
    } catch (error) {
        console.error('Error updating AI result:', error);
        res.status(500).json({
            message: 'Error updating AI result',
            error: error.message
        });
    }
};

exports.getApplicantAiResult = async (req, res) => {
    try {
        const { id } = req.params;  // applicant id

        const applicant = await Applicant.findByPk(id, {
            include: [{
                model: Job,
                attributes: ['id', 'title']
            }]
        });

        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found' });
        }

        res.json({
            message: 'AI result retrieved successfully',
            applicant: {
                ai_result: applicant.ai_result,
             
            }
        });
    } catch (error) {
        console.error('Error fetching applicant AI result:', error);
        res.status(500).json({
            message: 'Error fetching AI result',
            error: error.message
        });
    }
};

// ... rest of the existing code ...
// Get applicants by offer status
exports.getApplicantsByOfferStatus = async (req, res) => {
    try {
        const { offer_status } = req.query;
        
        // Build where clause
        const whereClause = {};
        if (offer_status) {
            whereClause.offer_status = offer_status;
        }

        const applicants = await Applicant.findAll({
            where: whereClause,
            include: [{
                model: Job,
                attributes: ['id', 'title', 'grade']
            }],
            order: [['updatedAt', 'DESC']]
        });

        res.json(applicants);
    } catch (error) {
        console.error('Error fetching applicants by offer status:', error);
        res.status(500).json({ 
            message: 'Error fetching applicants', 
            error: error.message 
        });
    }
};

exports.getOfferStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const applicant = await Applicant.findByPk(id, {
            attributes: ['id', 'name', 'offer_status', 'status'],
            include: [{
                model: Job,
                attributes: ['id', 'title']
            }]
        });

        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found' });
        }

        res.json(applicant);
    } catch (error) {
        console.error('Error getting offer status:', error);
        res.status(500).json({ 
            message: 'Error getting offer status', 
            error: error.message 
        });
    }
};

