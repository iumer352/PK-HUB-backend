const HiringManager = require('../models/HiringManager');

// Get all hiring managers
exports.getHiringManagers = async (req, res) => {
    try {
        const hiringManagers = await HiringManager.findAll();
        res.status(200).json(hiringManagers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching hiring managers', error: error.message });
    }
};

// Get a single hiring manager
exports.getHiringManager = async (req, res) => {
    try {
        const hiringManager = await HiringManager.findByPk(req.params.id);
        if (!hiringManager) {
            return res.status(404).json({ message: 'Hiring manager not found' });
        }
        res.status(200).json(hiringManager);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching hiring manager', error: error.message });
    }
};

// Create a new hiring manager
exports.createHiringManager = async (req, res) => {
    try {
        const { name, email } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Check if hiring manager with same email exists
        const existingManager = await HiringManager.findOne({ where: { email } });
        if (existingManager) {
            return res.status(400).json({ message: 'Hiring manager with this email already exists' });
        }

        const hiringManager = await HiringManager.create({
            name,
            email
        });

        res.status(201).json(hiringManager);
    } catch (error) {
        res.status(500).json({ message: 'Error creating hiring manager', error: error.message });
    }
};

// Update a hiring manager
exports.updateHiringManager = async (req, res) => {
    try {
        const { name, email } = req.body;
        const hiringManager = await HiringManager.findByPk(req.params.id);
        
        if (!hiringManager) {
            return res.status(404).json({ message: 'Hiring manager not found' });
        }

        await hiringManager.update({
            name: name || hiringManager.name,
            email: email || hiringManager.email
        });

        res.status(200).json(hiringManager);
    } catch (error) {
        res.status(500).json({ message: 'Error updating hiring manager', error: error.message });
    }
};

// Delete a hiring manager
exports.deleteHiringManager = async (req, res) => {
    try {
        const hiringManager = await HiringManager.findByPk(req.params.id);
        
        if (!hiringManager) {
            return res.status(404).json({ message: 'Hiring manager not found' });
        }

        await hiringManager.destroy();
        res.status(200).json({ message: 'Hiring manager deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting hiring manager', error: error.message });
    }
};