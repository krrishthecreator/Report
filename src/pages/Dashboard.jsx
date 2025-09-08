import React, { useState } from 'react';
import AttendanceTable from '../components/AttendanceTable';
import EmployeeTable from '../components/EmployeeTable';
import EmployeeInsight from '../components/EmployeeInsight';
import LeaveSummary from '../components/LeaveSummary';
import CompOffManager from '../components/CompOffManager';
import FullExport from '../components/FullExport';
import AdminManager from '../components/AdminManager'; // NEW

export default function Dashboard() {
  const [tab, setTab] = useState('attendance');
  const role = localStorage.getItem('role');

  const TabBtn = ({ id, children }) => (
    <button className={`btn ${tab===id ? 'btn-primary' : ''}`} onClick={()=>setTab(id)}>
      {children}
    </button>
  );

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-5 space-y-6">
      <div className="card flex flex-wrap items-center gap-2">
        <TabBtn id="attendance">Attendance</TabBtn>
        <TabBtn id="team">Team</TabBtn>
        <TabBtn id="employee">Employee Details</TabBtn>
        <TabBtn id="leave">Leave Report</TabBtn>
        <TabBtn id="compoff">Comp-Off</TabBtn>
        <TabBtn id="alldetails">All Details</TabBtn>
        {role === 'super' && <TabBtn id="admins">Admins</TabBtn>}
      </div>

      {tab==='attendance' && <AttendanceTable />}
      {tab==='team' && <EmployeeTable />}
      {tab==='employee' && <EmployeeInsight />}
      {tab==='leave' && <LeaveSummary />}
      {tab==='compoff' && <CompOffManager />}
      {tab==='alldetails' && <FullExport />}
      {tab==='admins' && role === 'super' && <AdminManager />}
    </div>
  );
}
