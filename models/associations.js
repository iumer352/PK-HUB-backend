const Employee = require('./Employee');
const Project = require('./Project');
const ProjectAssignee = require('./ProjectAssignee');
const Interview = require('./Interview');
const Applicant = require('./Applicant');
const InterviewStage = require('./InterviewStage');
const StageLookup = require('./stage_lookup')
const Job = require('./Job');
const Interviewer = require('./Interviewer');
const Timesheet = require('./Timesheet');
const JobApplication = require('./JobApplication');
// Project-Employee many-to-many relationship
Project.belongsToMany(Employee, {
    through: ProjectAssignee,
    as: 'assignees',
    foreignKey: 'project_id'
});

Employee.belongsToMany(Project, {
    through: ProjectAssignee,
    as: 'projects',
    foreignKey: 'employee_id'
});

// Interview associations
Interview.belongsTo(Applicant, {
    foreignKey: 'applicant_id',
    as: 'applicant'
});
  
Interview.belongsTo(Interviewer, {
    foreignKey: 'interviewer_id',
    as: 'interviewer'
});
  
Interview.hasMany(InterviewStage, {
    foreignKey: 'interview_id',
    as: 'stages'
});
  
// Interview Stage associations
InterviewStage.belongsTo(Interview, {
    foreignKey: 'interview_id'
});
  
InterviewStage.belongsTo(StageLookup, {
    foreignKey: 'stage_id',
    as: 'stage'
});
  
// Reverse associations
Applicant.hasMany(Interview, {
    foreignKey: 'applicant_id',
    as: 'interviews'
});
  
Interviewer.hasMany(Interview, {
    foreignKey: 'interviewer_id',
    as: 'conducted_interviews'
});
  
StageLookup.hasMany(InterviewStage, {
    foreignKey: 'stage_id',
    as: 'interview_stages'
});

// Job-Applicant association
Applicant.belongsToMany(Job, {
    through: 'JobApplication',
    foreignKey: 'applicant_id',
    otherKey: 'job_id',
    as: 'job'
});

Job.belongsToMany(Applicant, {
    through: JobApplication,
    foreignKey: 'job_id',
    otherKey: 'applicant_id',
    as: 'applicant'
});


// Timesheet associations
Timesheet.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

Timesheet.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
  onDelete: 'RESTRICT' // Prevent deletion of projects with timesheet entries
});

Employee.hasMany(Timesheet, {
  foreignKey: 'employee_id',
  as: 'timesheets'
});

Project.hasMany(Timesheet, {
  foreignKey: 'project_id',
  as: 'timesheets'
});

module.exports = {
    Employee,
    Project,
    ProjectAssignee,
    Interview,
    InterviewStage,
    StageLookup,
    Interviewer,
    Job,
    Applicant,
    Timesheet
};