const Interviewer = require('../models/Interviewer');
const Interview = require('../models/Interview');
const { Op } = require('sequelize');

// Get all interviewers
exports.getInterviewers = async (req, res) => {
    try {
        const { interview_type } = req.query;
        const whereClause = interview_type ? { interview_type } : {};

        const interviewers = await Interviewer.findAll({
            where: whereClause,
            order: [['name', 'ASC']]
        });

        res.status(200).json(interviewers);
    } catch (error) {
        console.error('Error fetching interviewers:', error);
        res.status(500).json({ 
            message: 'Error fetching interviewers',
            error: error.message 
        });
    }
};

// Get a single interviewer
exports.getInterviewer = async (req, res) => {
    try {
        const interviewer = await Interviewer.findByPk(req.params.id);
        
        if (!interviewer) {
            return res.status(404).json({ message: 'Interviewer not found' });
        }

        res.status(200).json(interviewer);
    } catch (error) {
        console.error('Error fetching interviewer:', error);
        res.status(500).json({ 
            message: 'Error fetching interviewer',
            error: error.message 
        });
    }
};

// Create a new interviewer
exports.createInterviewer = async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        const { name, email, phone, position, interview_type, function: functionType } = req.body;

        // Validate interview type
        const validTypes = ['HR', 'Technical', 'Cultural', 'Final'];
        if (!validTypes.includes(interview_type)) {
            return res.status(400).json({ 
                message: 'Invalid interview type. Must be one of: HR, Technical, Cultural, Final' 
            });
        }

        // Validate function type
        const validFunctions = ['Data Transformation', 'Analytics and AI', 'Low Code', 'Digital Enablement', 'Innovation and Emerging Tech'];
        if (functionType && !validFunctions.includes(functionType)) {
            return res.status(400).json({ 
                message: 'Invalid function. Must be one of: Data Transformation, Analytics and AI, Low Code, Digital Enablement, Innovation and Emerging Tech' 
            });
        }

        // Check if email already exists
        const existingInterviewer = await Interviewer.findOne({ where: { email } });
        if (existingInterviewer) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const interviewer = await Interviewer.create({
            name,
            email,
            phone,
            position,
            interview_type,
            function: functionType || 'Data Transformation' // Use default if not provided
        });

        res.status(201).json(interviewer);
    } catch (error) {
        console.error('Error creating interviewer:', error);
        res.status(500).json({ 
            message: 'Error creating interviewer',
            error: error.message 
        });
    }
};

// Update an interviewer
exports.updateInterviewer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, position, interview_type, function: functionType } = req.body;

        const interviewer = await Interviewer.findByPk(id);
        if (!interviewer) {
            return res.status(404).json({ message: 'Interviewer not found' });
        }

        // If email is being changed, check if new email already exists
        if (email && email !== interviewer.email) {
            const existingInterviewer = await Interviewer.findOne({ where: { email } });
            if (existingInterviewer) {
                return res.status(400).json({ message: 'Email already registered' });
            }
        }

        // Validate interview type if it's being updated
        if (interview_type) {
            const validTypes = ['HR', 'Technical', 'Cultural', 'Final'];
            if (!validTypes.includes(interview_type)) {
                return res.status(400).json({ 
                    message: 'Invalid interview type. Must be one of: HR, Technical, Cultural, Final' 
                });
            }
        }

        // Validate function type if it's being updated
        if (functionType) {
            const validFunctions = ['Data Transformation', 'Analytics and AI', 'Low Code', 'Digital Enablement', 'Innovation and Emerging Tech'];
            if (!validFunctions.includes(functionType)) {
                return res.status(400).json({ 
                    message: 'Invalid function. Must be one of: Data Transformation, Analytics and AI, Low Code, Digital Enablement, Innovation and Emerging Tech' 
                });
            }
        }

        await interviewer.update({
            name: name || interviewer.name,
            email: email || interviewer.email,
            phone: phone || interviewer.phone,
            position: position || interviewer.position,
            interview_type: interview_type || interviewer.interview_type,
            function: functionType || interviewer.function
        });

        res.status(200).json(interviewer);
    } catch (error) {
        console.error('Error updating interviewer:', error);
        res.status(500).json({ 
            message: 'Error updating interviewer',
            error: error.message 
        });
    }
};
// Get interview timeline data
exports.getInterviewTimeline = async (req, res) => {
    try {
        const { candidateId } = req.params;
        
        const interviews = await Interview.findAll({
            where: { candidateId },
            include: [{
                model: Interviewer,
                attributes: ['name', 'interview_type']
            }],
            order: [['scheduledDate', 'DESC']],
            attributes: [
                'id',
                'scheduledDate',
                'status',
                'interview_type',
                'notes'
            ]
        });

        const timelineData = interviews.map(interview => ({
            id: interview.id,
            type: interview.interview_type,
            interviewer: interview.Interviewer.name,
            scheduledDate: interview.scheduledDate,
            status: interview.status,
            notes: interview.notes
        }));

        res.status(200).json(timelineData);
    } catch (error) {
        console.error('Error fetching interview timeline:', error);
        res.status(500).json({ 
            message: 'Error fetching interview timeline',
            error: error.message 
        });
    }
};

exports.deleteInterviewer = async (req, res) => {
    try {
        const { id } = req.params;

        const interviewer = await Interviewer.findByPk(id);
        if (!interviewer) {
            return res.status(404).json({ message: 'Interviewer not found' });
        }

        await interviewer.destroy();
        res.status(200).json({ message: 'Interviewer deleted successfully' });
    } catch (error) {
        console.error('Error deleting interviewer:', error);
        res.status(500).json({ 
            message: 'Error deleting interviewer',
            error: error.message 
        });
    }
};
