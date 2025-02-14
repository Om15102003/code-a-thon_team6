# Code-a-Company Employee Management System

## Overview
Code-a-Company Employee Management System is a full-stack web application designed to streamline employee management, task tracking, and organizational operations. The system features role-based access control with separate dashboards for employees, managers, and CEOs.

## Features

### Authentication & Authorization
- Secure login system with role-based access (Employee, Manager, CEO)
- JWT-based authentication
- Protected routes based on user roles

### Employee Dashboard
- Personal information display
- Task management with status tracking (Pending, In Progress, Completed)
- Real-time task updates
- Department information
- Team member visibility

### Manager Dashboard
- Department employee management
- Task assignment and tracking
- Bulk employee data upload via Excel
- Employee performance monitoring
- Department-wide task overview

### CEO Dashboard
- Company-wide oversight
- Impact analysis reporting
- Department performance metrics
- Excel report generation

## Technology Stack

### Frontend
- React.js
- React Router for navigation
- Lucide React for icons
- Axios for API calls
- CSS for styling

### Backend
- Node.js with Express
- PostgreSQL database
- Python for data analysis
- JWT for authentication
- bcrypt for password hashing

### Additional Tools
- XLSX for Excel file handling
- pandas for data manipulation
- psycopg2 for PostgreSQL connection in Python

## Installation

1. Clone the repository

```bash
git clone https://github.com/Om15102003/code-a-company.git
cd code-a-company
```

2. Install Frontend dependencies

```bash
cd src
npm install
```

   Install Backend dependencies

```bash
cd ../backend
npm install
pip install -r requirements.txt
``` 


3. Set up the database
- Create a PostgreSQL database named `employee_system`
- Update the database configuration in `backend/.env`

4. Configure environment variables
Create a `.env` file in the backend directory with the following:
PG_USER=your_postgres_user
PG_HOST=localhost
PG_DATABASE=employee_system
PG_PASSWORD=your_postgres_password
PG_PORT=5432
JWT_SECRET=your_jwt_secret

5. Start the client

```bash
Backend Server
cd backend      
npm start

Frontend Server
cd ../src
npm start
```


## Database Schema

The application uses the following main tables:
- employee
- department
- tasks
- employee_task_assignments
- roles
- impactanalysis

## API Endpoints

### Authentication
- POST /login
- POST /register

### Employee Routes
- GET /employee/:id
- GET /employee/:id/tasks
- PUT /tasks/:id/status

### Manager Routes
- GET /manager/department-employees/:managerId
- GET /manager/department-tasks/:managerId
- POST /manager/upload-employees/:managerId

### Analysis Routes
- POST /execute-impact-analysis

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

- Thanks to all contributors who have helped shape Code-a-Company
- Special thanks to the open-source community for the amazing tools and libraries

## Contact

Your Name - Om Gupta
Project Link: https://github.com/Om15102003/code-a-company
