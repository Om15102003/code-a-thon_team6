import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();

const app = express();
const port = 4000;
const saltRounds = 10;

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

db.connect();


// ... existing code ...

// Execute Impact Analysis
app.post("/execute-impact-analysis", async (req, res) => {
    try {
        // Execute the Python script using child_process
        const { exec } = require('child_process');
        
        exec('python3 impact_analysis_pg.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error}`);
                return res.status(500).json({ error: "Failed to execute impact analysis" });
            }
            
            if (stderr) {
                console.error(`Python script stderr: ${stderr}`);
            }
            
            res.json({ 
                message: "Impact analysis completed successfully",
                output: stdout
            });
        });
    } catch (error) {
        console.error("Error running impact analysis:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ... existing code ...


// Login Route
app.post("/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        // Query employee table
        const result = await db.query(
            "SELECT * FROM employee WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];
        
        // Compare password
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: role,
                company: user.company
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: role,
                company: user.company
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Registration Route
app.post("/register", async (req, res) => {
    try {
        const { name, email, phone_number, password, role, company, department_id } = req.body;
        
        // Check if user already exists
        const existingUser = await db.query(
            "SELECT * FROM employee WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new employee
        const result = await db.query(
            `INSERT INTO employee 
            (name, email, phone_number, hire_date, status, password, company, department_id) 
            VALUES ($1, $2, $3, CURRENT_DATE, 'Active', $4, $5, $6) 
            RETURNING id, name, email, company`,
            [name, email, phone_number, hashedPassword, company, department_id]
        );

        const newUser = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: newUser.id,
                email: newUser.email,
                role: role,
                company: newUser.company
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: "Registration successful",
            token,
            user: newUser
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



// ... existing code ...

// Get department employees for manager
app.get("/manager/department-employees/:managerId", async (req, res) => {
    try {
        const managerId = req.params.managerId;
        
        // First get the manager's department
        const managerQuery = await db.query(
            `SELECT department_id FROM employee WHERE id = $1`,
            [managerId]
        );
        
        if (managerQuery.rows.length === 0) {
            return res.status(404).json({ error: "Manager not found" });
        }
        
        const departmentId = managerQuery.rows[0].department_id;
        
        // Get all employees in the same department except the manager
        const employeesQuery = await db.query(
            `SELECT e.*, 
                    COUNT(DISTINCT eta.task_id) as active_tasks,
                    r.role_name
             FROM employee e
             LEFT JOIN employee_task_assignments eta 
                ON e.id = eta.employee_id 
                AND eta.status != 'completed'
             LEFT JOIN roles r ON r.id = e.role_id  -- Assuming there's a role_id column in employee table
             WHERE e.department_id = $1 
             AND e.id != $2
             AND e.status = 'Active'
             GROUP BY e.id, r.role_name`,
            [departmentId, managerId]
        );
        console.log(employeesQuery.rows);
        res.json(employeesQuery.rows);
    } catch (error) {
        console.error("Error fetching department employees:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get department tasks
app.get("/manager/department-tasks/:managerId", async (req, res) => {
    try {
        const managerId = req.params.managerId;
        
        // Get tasks for employees in the same department
        const tasksQuery = await db.query(
            `SELECT t.*, 
                    eta.status,
                    e.name as assigned_to
             FROM tasks t
             JOIN employee_task_assignments eta ON t.id = eta.task_id
             JOIN employee e ON eta.employee_id = e.id
             WHERE e.department_id = (
                SELECT department_id 
                FROM employee 
                WHERE id = $1
             )`,
            [managerId]
        );

        res.json(tasksQuery.rows);
    } catch (error) {
        console.error("Error fetching department tasks:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ... existing code ...

// Department Routes
app.get("/departments", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM department");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Get employee details
app.get("/employee/:id", async (req, res) => {
    try {
        const employeeId = req.params.id;
        const result = await db.query(`
            SELECT e.*, d.deptname as department_name, r.role_name
            FROM employee e
            LEFT JOIN department d ON e.department_id = d.deptid
            LEFT JOIN roles r ON e.id = r.id
            WHERE e.id = $1
        `, [employeeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get employee tasks
app.get("/employee/:id/tasks", async (req, res) => {
    try {
        const employeeId = req.params.id;
        const result = await db.query(`
            SELECT t.*, eta.status
            FROM tasks t
            JOIN employee_task_assignments eta ON t.id = eta.task_id
            WHERE eta.employee_id = $1
        `, [employeeId]);

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update task status
app.put("/tasks/:id/status", async (req, res) => {
    try {
        const taskId = req.params.id;
        const { status } = req.body;

        const result = await db.query(`
            UPDATE employee_task_assignments
            SET status = $1
            WHERE task_id = $2
            RETURNING *
        `, [status, taskId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;