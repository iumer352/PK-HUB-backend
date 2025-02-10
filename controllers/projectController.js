const Project = require('../models/Project');
const Employee = require('../models/Employee');

// Get all projects with their assignees
const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.findAll({
            include: [{
                model: Employee,
                as: 'assignees',
                attributes: ['id', 'name', 'role', 'department'],
                through: { attributes: [] }
            }]
        });

        // Transform the response to ensure consistent ID format
        const transformedProjects = projects.map(project => {
            const plainProject = project.get({ plain: true });
            return {
                ...plainProject,
                assignees: plainProject.assignees.map(assignee => ({
                    ...assignee,
                    _id: assignee.id
                }))
            };
        });

        res.json(transformedProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
};

// Get a single project by ID
const getProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByPk(id, {
            include: [{
                model: Employee,
                as: 'assignees',
                attributes: ['id', 'name', 'role', 'department'],
                through: { attributes: [] }
            }]
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Transform the response to ensure consistent ID format
        const plainProject = project.get({ plain: true });
        const transformedProject = {
            ...plainProject,
            assignees: plainProject.assignees.map(assignee => ({
                ...assignee,
                _id: assignee.id
            }))
        };

        res.json(transformedProject);
    } catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({ 
            message: 'Error getting project',
            error: error.message 
        });
    }
};

// Create a new project
const createProject = async (req, res) => {
    try {
        const { name, description, status, startDate, deadline, assignees } = req.body;
        
        const project = await Project.create({
            name,
            description,
            status,
            startDate,
            deadline,
            progress: 0
        });

        if (assignees && assignees.length > 0) {
            const employees = await Employee.findAll({
                where: { id: assignees }
            });
            await project.setAssignees(employees);
        }

        // Fetch the created project with assignees
        const createdProject = await Project.findByPk(project.id, {
            include: [{
                model: Employee,
                as: 'assignees',
                attributes: ['id', 'name', 'role', 'department'],
                through: { attributes: [] }
            }]
        });

        res.status(201).json(createdProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Error creating project', error: error.message });
    }
};

// Update a project
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status, startDate, deadline, progress } = req.body;

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await project.update({
            name: name || project.name,
            description: description || project.description,
            status: status || project.status,
            startDate: startDate || project.startDate,
            deadline: deadline || project.deadline,
            progress: progress !== undefined ? progress : project.progress
        });

        // Fetch the updated project with assignees
        const updatedProject = await Project.findByPk(id, {
            include: [{
                model: Employee,
                as: 'assignees',
                attributes: ['id', 'name', 'role', 'department'],
                through: { attributes: [] }
            }]
        });

        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};

// Delete a project
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await project.destroy();
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
};

// Assign an employee to a project
const assignEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId } = req.body;

        // Find the project
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Find the employee
        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Add the employee to the project
        await project.addAssignee(employee);

        // Get the updated project with assignees
        const updatedProject = await Project.findByPk(id, {
            include: [{
                model: Employee,
                as: 'assignees',
                attributes: ['id', 'name', 'role', 'department'],
                through: { attributes: [] }
            }]
        });

        // Transform the response
        const plainProject = updatedProject.get({ plain: true });
        const transformedProject = {
            ...plainProject,
            assignees: plainProject.assignees.map(assignee => ({
                ...assignee,
                _id: assignee.id
            }))
        };

        res.json(transformedProject);
    } catch (error) {
        console.error('Error assigning employee:', error);
        res.status(500).json({ 
            message: 'Error assigning employee to project',
            error: error.message 
        });
    }
};

module.exports = {
    getAllProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    assignEmployee
};
