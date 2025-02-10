const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const interviewStageController = require('../controllers/interviewStageController');

// Interview Routes
// Get all interviews for an applicant
router.get('/applicant/:applicantId', interviewController.getInterviews);

// Get all interviews for a job
router.get('/job/:jobId', interviewController.getInterviewsByJobId);

// Get a single interview
router.get('/:id', interviewController.getInterview);

// Schedule first interview
router.post('/schedule-first', interviewController.scheduleFirstInterview);

// Schedule next interview
router.post('/schedule-next', interviewController.scheduleNextInterview);

// Schedule specific stage interview
router.post('/schedule-stage', interviewController.scheduleSpecificStage);

// Update interview status
router.patch('/:id/status', interviewController.updateStatus);

// Submit interview feedback
router.post('/stages/:interview_id/:stage_id/feedback', interviewController.submitFeedback);

// HR round feedback route
router.post('/hr/:interviewId/feedback', interviewController.submitHRFeedback);

// Interview Stage Routes
// Get all stages for an interview
router.get('/:interview_id/stages', interviewStageController.getStages);

// Create new stage
router.post('/stages', interviewStageController.createStage);

// Update stage
router.patch('/stages/:id', interviewStageController.updateStage);

// Get stage result
router.get('/stages/:interview_id/:stage_id/result', interviewStageController.getStageResult);

// Update stage result
router.put('/stages/:stageId/applicant/:applicantId/result', interviewStageController.updateStageResult);

// HR stage result routes
router.get('/stages/:stage_id/applicant/:applicant_id/hr-result', interviewStageController.getHRStageResult);
router.post('/stages/:stage_id/applicant/:applicant_id/hr-result', interviewStageController.updateHRStageResult);

module.exports = router;