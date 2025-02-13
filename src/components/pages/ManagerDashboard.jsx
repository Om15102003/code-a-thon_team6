import React, { useState, useEffect } from 'react';
import { Search, Users, Upload, CheckSquare, User, Plus, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import './CSS/ManagerDashboard.css';
import { useParams } from 'react-router-dom';

const ManagerDashboard = () => {
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState('Employees');
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState({});
  const [newTask, setNewTask] = useState({ title: '', assignedTo: '', dueDate: '' });
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDepartmentData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch employees
        const employeesResponse = await fetch(
          `http://localhost:4000/manager/department-employees/${userId}`
        );
        if (!employeesResponse.ok) {
          throw new Error('Failed to fetch employees');
        }
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);

        // Fetch tasks
        const tasksResponse = await fetch(
          `http://localhost:4000/manager/department-tasks/${userId}`
        );
        if (!tasksResponse.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const tasksData = await tasksResponse.json();
        
        // Organize tasks by status
        const organizedTasks = tasksData.reduce((acc, task) => {
          const status = task.status || 'pending';
          if (!acc[status]) acc[status] = [];
          acc[status].push(task);
          return acc;
        }, {});
        
        setTasks(organizedTasks);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching department data:', err);
        setError('Failed to load department data');
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchDepartmentData();
    }
  }, [userId]);

  const handleFileUpload = async (e) => {
    if (!e.target.files.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Send data to backend
        const response = await fetch(`http://localhost:4000/manager/upload-employees/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ employees: jsonData }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload employees');
        }

        // Refresh employee list
        const updatedEmployeesResponse = await fetch(
          `http://localhost:4000/manager/department-employees/${userId}`
        );
        const updatedEmployees = await updatedEmployeesResponse.json();
        setEmployees(updatedEmployees);
      } catch (error) {
        console.error('Error uploading employees:', error);
        setError('Failed to upload employees');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) return;
    
    try {
      const response = await fetch(`http://localhost:4000/manager/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          managerId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      // Refresh tasks
      const tasksResponse = await fetch(
        `http://localhost:4000/manager/department-tasks/${userId}`
      );
      const tasksData = await tasksResponse.json();
      
      const organizedTasks = tasksData.reduce((acc, task) => {
        const status = task.status || 'pending';
        if (!acc[status]) acc[status] = [];
        acc[status].push(task);
        return acc;
      }, {});
      
      setTasks(organizedTasks);
      setNewTask({ title: '', assignedTo: '', dueDate: '' });
      setShowNewTaskModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    }
  };

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.role_name && employee.role_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h1 className="dashboard-title">Manager Dashboard</h1>
        </div>
        
        <nav className="sidebar-nav">
          {['Employees', 'Tasks', 'Upload Data'].map((item) => (
            <button
              key={item}
              className={`nav-item ${activeTab === item ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab(item)}
            >
              {item === 'Employees' && <Users className="nav-icon" size={20} />}
              {item === 'Tasks' && <CheckSquare className="nav-icon" size={20} />}
              {item === 'Upload Data' && <Upload className="nav-icon" size={20} />}
              {item}
            </button>
          ))}
        </nav>

        <div className="profile-section">
          <div className="profile-avatar">
            <User size={20} className="text-black" />
          </div>
          <span>Manager</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="search-header">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search employees or tasks..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="search-icon" size={20} />
          </div>
        </div>

        <div className="content-container">
          {activeTab === 'Employees' && (
            <div className="section-container">
              <h2 className="section-title">Team Members</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Active Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.name}</td>
                      <td>{employee.role_name || 'N/A'}</td>
                      <td>{employee.email}</td>
                      <td>{employee.active_tasks || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div className="section-container">
              <h2 className="section-title">Tasks</h2>
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="add-button"
              >
                <Plus size={20} className="button-icon" /> New Task
              </button>
              <div className="tasks-container">
                {Object.entries(tasks).map(([status, statusTasks]) => (
                  <div key={status} className="task-status-section">
                    <h3 className="task-status-title">{status.charAt(0).toUpperCase() + status.slice(1)}</h3>
                    {statusTasks.map((task) => (
                      <div key={task.id} className="task-item">
                        <h3 className="task-title">{task.task_name}</h3>
                        <p className="task-assignee">Assigned to: {task.assigned_to}</p>
                        <p className="task-description">{task.description}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Upload Data' && (
            <div className="section-container">
              <h2 className="section-title">Upload Employee Data</h2>
              <div className="upload-container">
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileUpload}
                  className="upload-input"
                />
                <p className="upload-help">
                  Upload an Excel file containing employee information.
                  Required columns: name, email, phone_number, role
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>New Task</h3>
            <input
              type="text"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
            <select
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
            />
            <div className="modal-buttons">
              <button onClick={handleAddTask} className="submit-button">Add Task</button>
              <button onClick={() => setShowNewTaskModal(false)} className="cancel-button">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;