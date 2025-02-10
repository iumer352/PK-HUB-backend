const Interview = require('../models/Interview');
const InterviewStage = require('../models/InterviewStage');
const StageLookup = require('../models/stage_lookup');
const Applicant = require('../models/Applicant');

// Create a new interview stage
exports.createStage = async (req, res) => {
    try {
        const { interview_id, stage_id, notes } = req.body;

        // Validate if interview exists
        const interview = await Interview.findByPk(interview_id);
        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // Validate if stage exists
        const stage = await StageLookup.findByPk(stage_id);
        if (!stage) {
            return res.status(404).json({ message: 'Stage not found' });
        }

        const interviewStage = await InterviewStage.create({
            interview_id,
            stage_id,
            notes,
            result: 'pending'
        });

        res.status(201).json(interviewStage);
    } catch (error) {
        console.error('Error creating interview stage:', error);
        res.status(500).json({ message: 'Error creating interview stage', error: error.message });
    }
};

// Get stages for an interview
exports.getStages = async (req, res) => {
    try {
        const { interview_id } = req.params;
        
        console.log('Fetching stages for interview:', interview_id);
        
        const stages = await InterviewStage.findAll({
            where: { interview_id },
            include: [{
                model: StageLookup,
                as: 'stage',
                attributes: ['name', 'order', 'description']
            }],
            order: [[{ model: StageLookup, as: 'stage' }, 'order', 'ASC']]
        });

        console.log('Found stages:', stages.map(s => ({ id: s.id, stage_id: s.stage_id })));
        
        res.status(200).json(stages);
    } catch (error) {
        console.error('Error fetching interview stages:', error);
        res.status(500).json({ message: 'Error fetching interview stages', error: error.message });
    }
};

// Update stage result and feedback
exports.updateStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { result, feedback } = req.body;

        const stage = await InterviewStage.findByPk(id, {
            include: [{
                model: Interview,
                include: [{ model: Applicant }]
            }]
        });

        if (!stage) {
            return res.status(404).json({ message: 'Interview stage not found' });
        }

        // Update stage
        stage.result = result;
        stage.feedback = feedback;
        stage.completed_at = new Date();
        await stage.save();

        // If stage is completed, update applicant status based on result
        if (result === 'pass' || result === 'fail') {
            const applicant = stage.Interview.Applicant;
            
            if (result === 'fail') {
                await applicant.update({ status: 'rejected' });
            } else {
                // Check if this was the final stage
                const nextStage = await StageLookup.findOne({
                    where: {
                        order: { [Op.gt]: stage.stage.order }
                    },
                    order: [['order', 'ASC']]
                });

                if (!nextStage) {
                    // This was the final stage and candidate passed
                    await applicant.update({ status: 'offered' });
                }
            }
        }

        res.status(200).json(stage);
    } catch (error) {
        console.error('Error updating interview stage:', error);
        res.status(500).json({ message: 'Error updating interview stage', error: error.message });
    }
};

// Get stage result
// Get stage result
exports.getStageResult = async (req, res) => {
    const { interview_id, stage_id } = req.params;  // Move this outside try block so it's available in catch

    try {
        console.log('Fetching stage result for:', { interview_id, stage_id });

        if (!interview_id || !stage_id) {
            return res.status(400).json({
                message: 'Missing required parameters',
                searchParams: { interview_id, stage_id }
            });
        }

        const stage = await InterviewStage.findOne({
            where: {
                interview_id: parseInt(interview_id),  // Convert to integer
                stage_id: parseInt(stage_id)          // Convert to integer
            },
            include: [{
                model: StageLookup,
                as: 'stage',
                attributes: ['name', 'order']
            }],
            attributes: ['id', 'result', 'feedback', 'notes', 'completed_at']
        });

        if (!stage) {
            return res.status(404).json({ 
                message: 'Interview stage not found',
                searchParams: { interview_id, stage_id }
            });
        }

        res.json(stage);
    } catch (error) {
        console.error('Error fetching stage result:', error);
        res.status(500).json({ 
            message: 'Error fetching stage result',
            error: error.message,
            searchParams: { interview_id, stage_id }  // Now interview_id is in scope
        });
    }
};

// Update stage result
exports.updateStageResult = async (req, res) => {
    try {
        const { applicantId, stageId } = req.params;
        const { result } = req.body;

        const stage = await InterviewStage.findOne({
            where: {
                stage_id: stageId
            }
        });

        if (!stage) {
            return res.status(404).json({ message: 'No interview stage found' });
        }

        await stage.update({
            result,
            completed_at: new Date()
        });

        res.json({
            result: stage.result,
            completed_at: stage.completed_at
        });
    } catch (error) {
        console.error('Error updating stage result:', error);
        res.status(500).json({ message: error.message });
    }
};

// Schedule next stage
exports.scheduleNextStage = async (req, res) => {
    try {
        const { interview_id } = req.params;
        const { date_time, interviewer_id } = req.body;

        // Get current stage
        const currentStage = await InterviewStage.findOne({
            where: { interview_id },
            include: [{ model: StageLookup, as: 'stage' }],
            order: [['createdAt', 'DESC']]
        });

        if (!currentStage || currentStage.result !== 'pass') {
            return res.status(400).json({ 
                message: 'Cannot schedule next stage. Current stage must be completed and passed.' 
            });
        }

        // Find next stage in sequence
        const nextStage = await StageLookup.findOne({
            where: {
                order: { [Op.gt]: currentStage.stage.order }
            },
            order: [['order', 'ASC']]
        });

        if (!nextStage) {
            return res.status(400).json({ message: 'No more stages available' });
        }

        // Update interview with new interviewer and date
        const interview = await Interview.findByPk(interview_id);
        await interview.update({
            interviewer_id,
            date_time
        });

        // Create new stage record
        const newStage = await InterviewStage.create({
            interview_id,
            stage_id: nextStage.id,
            result: 'pending'
        });

        res.status(201).json({
            interview,
            stage: newStage
        });
    } catch (error) {
        console.error('Error scheduling next stage:', error);
        res.status(500).json({ message: 'Error scheduling next stage', error: error.message });
    }
};

// Get stage statistics
exports.getStageStats = async (req, res) => {
    try {
        const stats = await InterviewStage.findAll({
            attributes: [
                'stage_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN result = 'pass' THEN 1 ELSE 0 END")), 'passed'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN result = 'fail' THEN 1 ELSE 0 END")), 'failed'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN result = 'pending' THEN 1 ELSE 0 END")), 'pending']
            ],
            include: [{
                model: StageLookup,
                as: 'stage',
                attributes: ['name']
            }],
            group: ['stage_id', 'stage.name']
        });

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching stage statistics:', error);
        res.status(500).json({ message: 'Error fetching stage statistics', error: error.message });
    }
};

// Get HR stage result
exports.getHRStageResult = async (req, res) => {
    try {
        const { stage_id, applicant_id } = req.params;

        const hrStage = await InterviewStage.findOne({
            where: {
                stage_id,
                '$Interview.applicant_id$': applicant_id,
                '$Interview.name$': 'HR round'
            },
            include: [{
                model: Interview,
                attributes: ['name', 'applicant_id']
            }],
            attributes: [
                'id', 'result', 'feedback', 'completed_at',
                'current_salary', 'expected_salary', 'notice_period',
                'willing_to_relocate', 'willing_to_travel_saudi'
            ]
        });

        if (!hrStage) {
            return res.status(404).json({ message: 'HR stage not found' });
        }

        res.status(200).json(hrStage);
    } catch (error) {
        console.error('Error getting HR stage result:', error);
        res.status(500).json({ message: 'Error getting HR stage result', error: error.message });
    }
};

// Update HR stage result
exports.updateHRStageResult = async (req, res) => {
    try {
        const { stage_id, applicant_id } = req.params;
        const {
            result,
            feedback,
            currentSalary,
            expectedSalary,
            noticePeriod,
            willingToRelocate,
            willingToTravelSaudi
        } = req.body;

        // First find the interview for this applicant
        const interview = await Interview.findOne({
            where: {
                applicant_id,
                name: 'HR round'
            }
        });

        if (!interview) {
            return res.status(404).json({ message: 'HR interview not found for this applicant' });
        }

        // Then find or create the HR stage
        const [hrStage] = await InterviewStage.findOrCreate({
            where: {
                stage_id,
                interview_id: interview.id
            },
            defaults: {
                result: 'pending',
                feedback: ''
            }
        });

        // Update HR stage with the new data
        const updatedStage = await hrStage.update({
            result,
            feedback,
            current_salary: currentSalary,
            expected_salary: expectedSalary,
            notice_period: noticePeriod,
            willing_to_relocate: willingToRelocate,
            willing_to_travel_saudi: willingToTravelSaudi,
            completed_at: new Date()
        });

        // Update interview status
        await interview.update({ status: 'completed' });

        // Update applicant status based on result
        if (result === 'pass') {
            await Applicant.update(
                { status: 'hr_round_passed' },
                { where: { id: applicant_id } }
            );
        } else if (result === 'fail') {
            await Applicant.update(
                { status: 'hr_round_failed' },
                { where: { id: applicant_id } }
            );
        }

        res.status(200).json(updatedStage);
    } catch (error) {
        console.error('Error updating HR stage result:', error);
        res.status(500).json({ message: 'Error updating HR stage result', error: error.message });
    }
};
