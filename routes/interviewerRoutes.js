const express = require('express');
const router = express.Router();
const interviewerController = require('../controllers/interviewerController');

// Get all interviewers (with optional filter by interview_type)
router.get('/', interviewerController.getInterviewers);

// Get interview timeline data
router.get('/timeline/:candidateId', interviewerController.getInterviewTimeline);

// Get a single interviewer
router.get('/:id', interviewerController.getInterviewer);

// Create a new interviewer
router.post('/', interviewerController.createInterviewer);

// Update an interviewer
router.put('/:id', interviewerController.updateInterviewer);

// Delete an interviewer
router.delete('/:id', interviewerController.deleteInterviewer);

module.exports = router;
