'use client';

import "./css/nabvar.css";

interface NavbarProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onDashboardClick?: () => void;
  onStudentClick?: () => void;
  onMentorClick?: () => void;
}

export default function Navbar({ onLoginClick, onRegisterClick, onDashboardClick, onStudentClick, onMentorClick }: NavbarProps) {
  return (
    <div className="navbar">
      <h1 className="title">TriCode Academic Help</h1>
      <div className="navButtons">
        <button className="btnDashboard" onClick={onDashboardClick}>Teacher</button>
        <button className="btnDashboard" onClick={onStudentClick}>Student</button>
        <button className="btnMentor" onClick={onMentorClick}>Mentor</button>
        <button className="btnLogin" onClick={onLoginClick}>Login</button>
        <button className="btnRegister" onClick={onRegisterClick}>Register</button>
      </div>
    </div>
  );
}
