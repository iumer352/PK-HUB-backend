const express = require('express');
const router = express.Router();
const stageLookupController = require('../controllers/stageLookupController');

// Get all stages
router.get('/', stageLookupController.getAllStages);

// Get a single stage
router.get('/:id', stageLookupController.getStage);

// Create a new stage
router.post('/', stageLookupController.createStage);

// Update a stage
router.put('/:id', stageLookupController.updateStage);

// Delete a stage
router.delete('/:id', stageLookupController.deleteStage);

module.exports = router;
