const express = require('express');
const router = express.Router();
const { 
    getAllProjects, 
    createProject, 
    updateProject, 
    deleteProject,
    assignEmployee,
    getProject
} = require('../controllers/projectController');

// GET /api/projects - Get all projects
router.get('/', getAllProjects);

// GET /api/projects/:id - Get a single project
router.get('/:id', getProject);

// POST /api/projects - Create a new project
router.post('/', createProject);

// PUT /api/projects/:id - Update project status and progress
router.put('/:id', updateProject);

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', deleteProject);

// POST /api/projects/:id/assign - Assign an employee to a project
router.post('/:id/assign', assignEmployee);

module.exports = router;
