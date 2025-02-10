const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicantController');

// Get all applicants
router.get('/', applicantController.getApplicants);

// Get applicants by job ID
router.get('/job/:jobId', applicantController.getApplicantsByJobId);

// Get applicants by offer status
router.get('/by-offer-status', applicantController.getApplicantsByOfferStatus);

// Get a single applicant
router.get('/:id', applicantController.getApplicant);

// Get resume file
router.get('/:id/resume', applicantController.getResume);

// Create a new applicant
router.post('/', applicantController.createApplicant);

// Create applicants from parsed resumes
router.post('/from-parsed-resumes', applicantController.createApplicantsFromParsedResumes);

// Update applicant status
router.put('/:id/status', applicantController.updateStatus);

router.put('/:id/ai-result', applicantController.updateAiResult);

// ... existing routes ...
// ... existing routes ...
router.get('/:id/ai-result', applicantController.getApplicantAiResult);
// Update offer status
router.post('/:id/offer-status', applicantController.updateOfferStatus);

router.get('/:id/offer-status', applicantController.getOfferStatus);

module.exports = router;
