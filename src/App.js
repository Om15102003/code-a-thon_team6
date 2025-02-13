



import React  from 'react';
import { BrowserRouter,Route,Routes } from 'react-router-dom';
import Login from './components/pages/Login'
import EmployeeDashboard from './components/pages/EmployeeDashboard'
import './index.css'
import './App.css';
import ManagerDashboard from './components/pages/ManagerDashboard';
import CeoDashboard from './components/pages/Ceo-Dashboard';
function App() {
  return (
    <div>
      <BrowserRouter> 
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<EmployeeDashboard />}>
            <Route path=':userId' element={<EmployeeDashboard/>}/>
            
            
            </Route>
            <Route path="/manager-dashboard" element={<ManagerDashboard/>}>
            <Route path=':userId' element={<ManagerDashboard/>}/>
            
            
            </Route>
            <Route path="/ceo-dashboard" element={<CeoDashboard/>}>
            <Route path=':userId' element={<CeoDashboard/>}/>
            
            
            </Route>
            
          </Routes>
      </BrowserRouter>

    </div>
  );
}
export default App;
