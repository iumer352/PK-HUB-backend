const express = require('express');
const router = express.Router();
const hiringManagerController = require('../controllers/hiringManagerController');

// Get all hiring managers
router.get('/', hiringManagerController.getHiringManagers);

// Get a single hiring manager
router.get('/:id', hiringManagerController.getHiringManager);

// Create a new hiring manager
router.post('/', hiringManagerController.createHiringManager);

// Update a hiring manager
router.put('/:id', hiringManagerController.updateHiringManager);

// Delete a hiring manager
router.delete('/:id', hiringManagerController.deleteHiringManager);

module.exports = router;