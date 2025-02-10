const StageLookup = require('../models/stage_lookup');

// Get all stages
exports.getAllStages = async (req, res) => {
    try {
        const stages = await StageLookup.findAll({
            order: [['order', 'ASC']]
        });
        res.status(200).json(stages);
    } catch (error) {
        console.error('Error fetching stages:', error);
        res.status(500).json({ 
            message: 'Error fetching stages',
            error: error.message 
        });
    }
};

// Get a single stage
exports.getStage = async (req, res) => {
    try {
        const stage = await StageLookup.findByPk(req.params.id);
        if (!stage) {
            return res.status(404).json({ message: 'Stage not found' });
        }
        res.status(200).json(stage);
    } catch (error) {
        console.error('Error fetching stage:', error);
        res.status(500).json({ 
            message: 'Error fetching stage',
            error: error.message 
        });
    }
};

// Create a new stage
exports.createStage = async (req, res) => {
    try {
        const { name, order, description } = req.body;

        // Check if stage with same order exists
        const existingStageOrder = await StageLookup.findOne({ where: { order } });
        if (existingStageOrder) {
            return res.status(400).json({ 
                message: 'A stage with this order already exists' 
            });
        }

        // Check if stage with same name exists
        const existingStageName = await StageLookup.findOne({ where: { name } });
        if (existingStageName) {
            return res.status(400).json({ 
                message: 'A stage with this name already exists' 
            });
        }

        const stage = await StageLookup.create({
            name,
            order,
            description
        });

        res.status(201).json(stage);
    } catch (error) {
        console.error('Error creating stage:', error);
        res.status(500).json({ 
            message: 'Error creating stage',
            error: error.message 
        });
    }
};

// Update a stage
exports.updateStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, order, description } = req.body;

        const stage = await StageLookup.findByPk(id);
        if (!stage) {
            return res.status(404).json({ message: 'Stage not found' });
        }

        // If order is being changed, check if new order already exists
        if (order && order !== stage.order) {
            const existingStageOrder = await StageLookup.findOne({ 
                where: { order },
                where: { id: { [Op.ne]: id } }
            });
            if (existingStageOrder) {
                return res.status(400).json({ 
                    message: 'A stage with this order already exists' 
                });
            }
        }

        // If name is being changed, check if new name already exists
        if (name && name !== stage.name) {
            const existingStageName = await StageLookup.findOne({ 
                where: { name },
                where: { id: { [Op.ne]: id } }
            });
            if (existingStageName) {
                return res.status(400).json({ 
                    message: 'A stage with this name already exists' 
                });
            }
        }

        await stage.update({
            name: name || stage.name,
            order: order || stage.order,
            description: description || stage.description
        });

        res.status(200).json(stage);
    } catch (error) {
        console.error('Error updating stage:', error);
        res.status(500).json({ 
            message: 'Error updating stage',
            error: error.message 
        });
    }
};

// Delete a stage
exports.deleteStage = async (req, res) => {
    try {
        const { id } = req.params;

        const stage = await StageLookup.findByPk(id);
        if (!stage) {
            return res.status(404).json({ message: 'Stage not found' });
        }

        await stage.destroy();
        res.status(200).json({ message: 'Stage deleted successfully' });
    } catch (error) {
        console.error('Error deleting stage:', error);
        res.status(500).json({ 
            message: 'Error deleting stage',
            error: error.message 
        });
    }
};
