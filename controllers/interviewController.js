const Interview = require('../models/Interview');
const InterviewStage = require('../models/InterviewStage');
const StageLookup = require('../models/stage_lookup');
const Applicant = require('../models/Applicant');
const Interviewer = require('../models/Interviewer');
const Job = require('../models/Job');
const { Op } = require('sequelize');

// Get all interviews for an applicant
exports.getInterviews = async (req, res) => {
  try {
    const { applicantId } = req.params;
    console.log('Fetching interviews for applicant:', applicantId);
    
    // First check if applicant exists
    const applicant = await Applicant.findByPk(applicantId);
    if (!applicant) {
      console.log('Applicant not found:', applicantId);
      return res.status(404).json({ message: 'Applicant not found' });
    }

    console.log('Found applicant:', applicant.id);

    // Get interviews with interviewer and stage details
    const interviews = await Interview.findAll({
      where: { applicant_id: applicantId },
      include: [
        {
          model: Interviewer,
          as: 'interviewer',
          attributes: ['id', 'name', 'position', 'interview_type']
        },
        {
          model: InterviewStage,
          as: 'stages',
          attributes: ['id', 'stage_id', 'result', 'completed_at']
        }
      ],
      order: [['date_time', 'DESC']]
    });

    console.log('Found interviews:', interviews.length);
    res.status(200).json(interviews);
  } catch (error) {
    console.error('Error in getInterviews:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching interviews',
      error: error.message,
      stack: error.stack 
    });
  }
};

// Get a single interview
exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      where: { id: req.params.id },
      include: [{
        model: Interviewer,
        as: 'interviewer',
        attributes: ['id', 'name', 'position', 'interview_type']
      }]
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.status(200).json(interview);
  } catch (error) {
    console.error('Error in getInterview:', error);
    res.status(500).json({ message: 'Error fetching interview' });
  }
};

// Schedule first interview
exports.scheduleFirstInterview = async (req, res) => {
  try {
    const { applicant_id, interviewer_id, date_time, job_id } = req.body;

    // Validate applicant and job
    const applicant = await Applicant.findByPk(applicant_id, {
      include: [{
        model: Job,
        as: 'job'
      }]
    });
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    // Validate interviewer exists and is HR type
    const interviewer = await Interviewer.findByPk(interviewer_id);
    if (!interviewer) {
      return res.status(404).json({ message: 'Interviewer not found' });
    }
    if (interviewer.interview_type !== 'HR') {
      return res.status(400).json({ message: 'First interview must be with an HR interviewer' });
    }

    // Get the first stage (HR)
    const firstStage = await StageLookup.findOne({
      where: {},
      order: [['order', 'ASC']]
    });

    // Create interview
    const interview = await Interview.create({
      applicant_id,
      interviewer_id,
      date_time,
      status: 'scheduled',
      name: `${firstStage.name} - ${applicant.name}`
    });

    // Create first interview stage
    await InterviewStage.create({
      interview_id: interview.id,
      stage_id: firstStage.id,
      result: 'pending'
    });

    // Update applicant status
    await applicant.update({ status: 'interviewing' });

    // Return full interview details
    const fullInterview = await Interview.findByPk(interview.id, {
      include: [
        {
          model: InterviewStage,
          as: 'stages',
          include: [{ 
            model: StageLookup, 
            as: 'stage' 
          }]
        },
        {
          model: Interviewer,
          as: 'interviewer',
          attributes: ['id', 'name', 'position', 'interview_type']
        },
        {
          model: Applicant,
          as: 'applicant',
          attributes: ['id', 'name', 'email', 'status'],
          include: [{
            model: Job,
            as: 'job',
            attributes: ['id', 'title', 'company']
          }]
        }
      ]
    });

    res.status(201).json(fullInterview);
  } catch (error) {
    console.error('Error scheduling first interview:', error);
    res.status(500).json({ message: 'Error scheduling interview', error: error.message });
  }
};

// Schedule next interview
exports.scheduleNextInterview = async (req, res) => {
  try {
    const { applicant_id, interviewer_id, date_time } = req.body;

    // Find the applicant's latest interview and its stage
    const currentInterview = await Interview.findOne({
      where: { applicant_id },
      include: [
        {
          model: InterviewStage,
          as: 'stages',
          include: [{ 
            model: StageLookup, 
            as: 'stage' 
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!currentInterview) {
      return res.status(404).json({ message: 'No previous interview found for this applicant' });
    }

    // Check if previous interview was completed and passed
    const currentStage = currentInterview.stages[0];
    if (currentStage.result !== 'pass') {
      return res.status(400).json({ 
        message: 'Cannot schedule next interview. Previous interview was not passed or is still pending.' 
      });
    }

    // Get current stage order
    const currentStageOrder = currentStage.stage.order;

    // Find the next stage
    const nextStage = await StageLookup.findOne({
      where: {
        order: currentStageOrder + 1
      }
    });

    if (!nextStage) {
      return res.status(400).json({ message: 'No next stage available. Interview process completed.' });
    }

    // Validate interviewer type matches next stage
    const interviewer = await Interviewer.findByPk(interviewer_id);
    if (!interviewer) {
      return res.status(404).json({ message: 'Interviewer not found' });
    }

    // Map stage names to interview types
    const stageToInterviewerType = {
      'HR Interview': 'HR',
      'Technical Round': 'Technical',
      'Cultural Fit': 'Cultural',
      'Final Round': 'Final'
    };

    if (interviewer.interview_type !== stageToInterviewerType[nextStage.name]) {
      return res.status(400).json({ 
        message: `This stage requires a ${stageToInterviewerType[nextStage.name]} interviewer` 
      });
    }

    // Create next interview
    const interview = await Interview.create({
      applicant_id,
      interviewer_id,
      date_time,
      status: 'scheduled',
      name: `${nextStage.name} - ${currentInterview.name.split(' - ')[1]}`
    });

    // Create interview stage
    await InterviewStage.create({
      interview_id: interview.id,
      stage_id: nextStage.id,
      result: 'pending'
    });

    // Return full interview details
    const fullInterview = await Interview.findByPk(interview.id, {
      include: [
        {
          model: InterviewStage,
          as: 'stages',
          include: [{ 
            model: StageLookup, 
            as: 'stage' 
          }]
        },
        {
          model: Interviewer,
          as: 'interviewer',
          attributes: ['id', 'name', 'position', 'interview_type']
        },
        {
          model: Applicant,
          as: 'applicant',
          attributes: ['id', 'name', 'email', 'status'],
          include: [{
            model: Job,
            as: 'job',
            attributes: ['id', 'title', 'company']
          }]
        }
      ]
    });

    res.status(201).json(fullInterview);
  } catch (error) {
    console.error('Error scheduling next interview:', error);
    res.status(500).json({ message: 'Error scheduling interview', error: error.message });
  }
};

// Schedule specific interview stage
exports.scheduleSpecificStage = async (req, res) => {
  try {
    const { applicant_id, interviewer_id, date_time, stage_id, stage_name } = req.body;
    console.log('Received request body:', req.body);
    
    if (!stage_name || !stage_id) {
      return res.status(400).json({ message: 'Stage name and ID are required' });
    }

    // Find the stage by name
    console.log('Looking for stage with name:', stage_name);
    const stage = await StageLookup.findOne({
      where: { name: stage_name }
    });
    console.log('Found stage:', stage);

    if (!stage) {
      return res.status(404).json({ message: `Stage not found with name: ${stage_name}` });
    }

    // Get applicant details
    const applicant = await Applicant.findByPk(applicant_id, {
      include: [{
        model: Job,
        as: 'job'
      }]
    });

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    // Validate interviewer type matches stage
    const interviewer = await Interviewer.findByPk(interviewer_id);
    if (!interviewer) {
      return res.status(404).json({ message: 'Interviewer not found' });
    }

    // Map stage IDs to interview types
    const stageToInterviewerType = {
      'HR': 'HR',
      'TECHNICAL': 'Technical',
      'CULTURAL': 'Cultural',
      'FINAL': 'Final'
    };

    console.log('Stage ID:', stage_id);
    console.log('Stage name:', stage_name);
    console.log('Interviewer type:', interviewer.interview_type);
    console.log('Expected type:', stageToInterviewerType[stage_id]);

    // Validate interviewer type using stage_id
    if (interviewer.interview_type !== stageToInterviewerType[stage_id]) {
      return res.status(400).json({ 
        message: `This stage requires a ${stageToInterviewerType[stage_id]} interviewer, but got ${interviewer.interview_type}` 
      });
    }

    // Check if this stage was already completed for this applicant
    const existingInterview = await Interview.findOne({
      where: { applicant_id },
      include: [{
        model: InterviewStage,
        as: 'stages',
        where: { stage_id: stage.id }
      }]
    });

    if (existingInterview) {
      return res.status(400).json({ 
        message: `${stage_name} was already conducted for this applicant` 
      });
    }

    // Create interview
    const interview = await Interview.create({
      applicant_id,
      interviewer_id,
      date_time,
      status: 'scheduled',
      name: stage_name
    });

    // Create interview stage
    await InterviewStage.create({
      interview_id: interview.id,
      stage_id: stage.id,
      result: 'pending'
    });

    // Return full interview details
    const fullInterview = await Interview.findByPk(interview.id, {
      include: [
        {
          model: InterviewStage,
          as: 'stages',
          include: [{ 
            model: StageLookup, 
            as: 'stage' 
          }]
        },
        {
          model: Interviewer,
          as: 'interviewer',
          attributes: ['id', 'name', 'position', 'interview_type']
        },
        {
          model: Applicant,
          as: 'applicant',
          attributes: ['id', 'name', 'email', 'status'],
          include: [{
            model: Job,
            as: 'job',
            attributes: ['id', 'title']
          }]
        }
      ]
    });

    res.status(201).json(fullInterview);
  } catch (error) {
    console.error('Error scheduling specific stage interview:', error);
    res.status(500).json({ message: 'Error scheduling interview', error: error.message });
  }
};

// Get all interviews for a job
exports.getInterviewsByJobId = async (req, res) => {
    const { jobId } = req.params;
    try {
        const interviews = await Interview.findAll({
            include: [{
                model: Applicant,
                where: { JobId: jobId },
                attributes: ['id']
            }],
            order: [['date_time', 'DESC']]
        });
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update interview status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const interview = await Interview.findByPk(id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    await interview.update({ status });
    res.status(200).json(interview);
  } catch (error) {
    console.error('Error updating interview status:', error);
    res.status(500).json({ message: 'Error updating interview status' });
  }
};

// Submit interview feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { interview_id, stage_id } = req.params;
    const { feedback, result, notes } = req.body;

    console.log('Searching for stage with:', { interview_id, stage_id });

    // Find interview stage with all necessary associations
    const interviewStage = await InterviewStage.findOne({
      where: { 
        interview_id,
        stage_id
      },
      include: [
        {
          model: Interview,
          include: [{ 
            model: Applicant,
            as: 'applicant',
            attributes: ['id', 'status']
          }]
        },
        {
          model: StageLookup,
          as: 'stage',
          attributes: ['name', 'order']
        }
      ]
    });

    if (!interviewStage) {
      return res.status(404).json({ 
        message: 'Interview stage not found',
        searchParams: { interview_id, stage_id }
      });
    }

    // Update the stage
    await interviewStage.update({
      feedback,
      result,
      notes,
      completed_at: new Date()
    });

    // Handle applicant status updates based on result
    if (result === 'pass' || result === 'fail') {
      const applicant = interviewStage.Interview.applicant;
      
      if (result === 'fail') {
        await applicant.update({ status: 'rejected' });
      } else {
        // Check if this was the final stage
        const nextStage = await StageLookup.findOne({
          where: {
            order: { [Op.gt]: interviewStage.stage.order }
          },
          order: [['order', 'ASC']]
        });

        if (!nextStage) {
          // This was the final stage and candidate passed
          await applicant.update({ status: 'offered' });
        } else {
          // Move to next stage
          await applicant.update({ status: 'interviewing' });
        }
      }
    }

    // Get and return the updated stage with all associations
    const updatedStage = await InterviewStage.findOne({
      where: { 
        interview_id,
        stage_id
      },
      include: [
        {
          model: Interview,
          include: [{ 
            model: Applicant,
            as: 'applicant',
            attributes: ['id', 'status', 'name']
          }]
        },
        {
          model: StageLookup,
          as: 'stage',
          attributes: ['name', 'order']
        }
      ]
    });

    res.status(200).json(updatedStage);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      message: 'Error submitting feedback',
      error: error.message,
      searchParams: { interview_id, stage_id }
    });
  }
};

// Submit HR feedback
exports.submitHRFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { feedback } = req.body;

    const interview = await Interview.findByPk(interviewId);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    await interview.update({
      feedback: feedback,
      status: 'completed'
    });

    res.status(200).json({ message: 'HR feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting HR feedback:', error);
    res.status(500).json({ message: 'Error submitting HR feedback', error: error.message });
  }
};

module.exports = exports;
