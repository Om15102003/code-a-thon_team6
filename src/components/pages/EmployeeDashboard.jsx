import React, { useState, useEffect } from "react";
import {
  Search,
  Home,
  CheckSquare,
  User,
  Users,
  Calendar,
  Clock,
  Building,
  AlertCircle,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import "./CSS/Dashboard.css";
import { useParams } from "react-router-dom";

const Dashboard = () => {
  const {userId}=useParams();
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [tasks, setTasks] = useState({
    pending: [],
    inProgress: [],
    completed: []
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:4000"; // Update with your backend URL

  // Fetch auth token from localStorage (set during login)
  const token = localStorage.getItem('token');
  //const userId = localStorage.getItem('userId');

  const fetchHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/employee/${userId}`, {
          headers: fetchHeaders
        });
        if (!response.ok) throw new Error('Failed to fetch employee info');
        const data = await response.json();
        setEmployeeInfo(data);
      } catch (err) {
        setError('Failed to load employee information');
        console.error(err);
      }
    };

    const fetchEmployeeTasks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/employee/${userId}/tasks`, {
          headers: fetchHeaders
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const data = await response.json();
        
        // Organize tasks by status
        const organizedTasks = {
          pending: data.filter(task => task.status === 'pending'),
          inProgress: data.filter(task => task.status === 'inProgress'),
          completed: data.filter(task => task.status === 'completed')
        };
        setTasks(organizedTasks);
      } catch (err) {
        setError('Failed to load tasks');
        console.error(err);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/departments`, {
          headers: fetchHeaders
        });
        if (!response.ok) throw new Error('Failed to fetch departments');
        const data = await response.json();
        setDepartments(data);
      } catch (err) {
        setError('Failed to load departments');
        console.error(err);
      }
    };

    const loadDashboardData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEmployeeInfo(),
        fetchEmployeeTasks(),
        fetchDepartments()
      ]);
      setLoading(false);
    };

    loadDashboardData();
  }, [userId]);

  const moveTask = async (taskId, fromStatus, toStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: fetchHeaders,
        body: JSON.stringify({ status: toStatus })
      });

      if (!response.ok) throw new Error('Failed to update task status');

      setTasks((prevTasks) => {
        const taskToMove = prevTasks[fromStatus].find((task) => task.id === taskId);
        if (!taskToMove) return prevTasks;

        return {
          ...prevTasks,
          [fromStatus]: prevTasks[fromStatus].filter((task) => task.id !== taskId),
          [toStatus]: [...prevTasks[toStatus], taskToMove],
        };
      });
      setOpenDropdown(null);
    } catch (err) {
      setError('Failed to update task status');
      console.error(err);
    }
  };

  const StatusDropdown = ({ task, currentStatus }) => {
    const isOpen = openDropdown === task.id;

    return (
      <div className="status-dropdown">
        <button onClick={() => setOpenDropdown(isOpen ? null : task.id)} className="status-dropdown-button">
          Change Status
          <ChevronDown size={14} className="ml-1" />
        </button>

        {isOpen && (
          <div className="status-dropdown-menu">
            {currentStatus !== "inProgress" && (
              <button onClick={() => moveTask(task.id, currentStatus, "inProgress")} className="status-dropdown-item">
                Move to In Progress
              </button>
            )}
            {currentStatus !== "completed" && (
              <button onClick={() => moveTask(task.id, currentStatus, "completed")} className="status-dropdown-item">
                Mark as Completed
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDashboardContent = () => (
    <div className="dashboard-grid">
      <div className="dashboard-card">
        <h3 className="card-header">
          <User className="icon-yellow" />
          Employee Information
        </h3>
        <div className="info-container">
          {employeeInfo && (
            <>
              <div>
                <p className="text-info">Position: Developer</p>
                <p className="text-info">Department: {employeeInfo.department_name}</p>
                <p className="text-info">Employee ID: {employeeInfo.id}</p>
              </div>
              <div>
                <h4 className="section-header">Contact Information</h4>
                <p className="text-info">Name: {employeeInfo.name}</p>
                <p className="text-info">Email: {employeeInfo.email}</p>
                <p className="text-info">Phone: {employeeInfo.phone_number}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-card">
        <h3 className="card-header">
          <CheckSquare className="icon-yellow" />
          Task Summary
        </h3>
        <div className="task-summary-grid">
          <div className="summary-card summary-card-yellow">
            <p className="summary-label">Pending</p>
            <p className="summary-count">{tasks.pending.length}</p>
          </div>
          <div className="summary-card summary-card-blue">
            <p className="summary-label">In Progress</p>
            <p className="summary-count">{tasks.inProgress.length}</p>
          </div>
          <div className="summary-card summary-card-green">
            <p className="summary-label">Completed</p>
            <p className="summary-count">{tasks.completed.length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasksContent = () => (
    <div className="tasks-container">
      <div className="tasks-card">
        <h3 className="tasks-header">Task Management</h3>
        <div className="task-sections">
          {["pending", "inProgress", "completed"].map((status) => (
            <div key={status} className="task-section">
              <h4 className={`task-section-header ${status}-header`}>
                {status === "pending" ? <AlertCircle /> : status === "inProgress" ? <Clock /> : <CheckCircle />}
                {status.charAt(0).toUpperCase() + status.slice(1)} Tasks
              </h4>
              <div className="task-list">
                {tasks[status].map((task) => (
                  <div key={task.id} className="task-item">
                    <span>{task.task_name}</span>
                    <div className="task-meta">
                      <span className="task-deadline">Due: {task.deadline}</span>
                      <span className={`task-priority ${task.priority?.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      {status !== "completed" && <StatusDropdown task={task} currentStatus={status} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Code-a-Company</h1>
        </div>
        <nav className="sidebar-nav">
          {[
            { name: "Dashboard", icon: <Home size={20} /> },
            { name: "Tasks", icon: <CheckSquare size={20} /> },
            { name: "Schedule", icon: <Calendar size={20} /> },
            { name: "Department", icon: <Building size={20} /> },
            { name: "Team", icon: <Users size={20} /> },
          ].map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activeItem === item.name ? "nav-item-active" : ""}`}
              onClick={() => setActiveItem(item.name)}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="main-content">
        <div className="main-header">
          <h2 className="page-title">{activeItem}</h2>
          <div className="search-container">
            <input type="text" placeholder="Search..." className="search-input" />
            <Search className="search-icon" size={20} />
          </div>
        </div>
        {activeItem === "Dashboard" ? renderDashboardContent() :
         activeItem === "Tasks" ? renderTasksContent() :
         <div className="construction-container">
           <h3>Page Under Construction</h3>
         </div>
        }
      </div>
    </div>
  );
};

export default Dashboard;