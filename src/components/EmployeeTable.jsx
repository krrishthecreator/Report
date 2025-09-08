import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';

/** Helpers */
const pad = (n) => String(n).padStart(2, '0');
const toYMD = (d) => {
  if (!d) return '';
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '');
// date value for <input type="date">
const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

/** Defaults for select inputs */
const GENDER = ['Male', 'Female', 'Others'];
const SHIFTS = ['Day Shift', 'Night Shift'];
const TEAMS  = ['On Going', 'One Time'];
const DESIGNATIONS = [
  'Senior Process Associate',
  'Process Associate',
  'Trainee Process Associate',
  'SME',
  'ATL'
];
const LAPTOP_STATUS = ['PC', 'Laptop'];

export default function EmployeeTable() {
  const [employees, setEmployees] = useState([]);

  /** ---------- form state ---------- */
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [dob, setDob] = useState('');
  const [certDob, setCertDob] = useState('');
  const [doj, setDoj] = useState('');
  const [designation, setDesignation] = useState('');
  const [shift, setShift] = useState('');
  const [teamType, setTeamType] = useState('');
  const [department, setDepartment] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [laptopStatus, setLaptopStatus] = useState('');
  const [presentLocation, setPresentLocation] = useState('');
  const [permanentLocation, setPermanentLocation] = useState('');

  /** edit mode: null => create; otherwise update employee with this id */
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  /** ---------- load ---------- */
  const loadEmployees = async () => {
    const { data } = await api.get('/employees');
    setEmployees(Array.isArray(data) ? data : []);
  };
  useEffect(() => { loadEmployees(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setName(''); setCode(''); setGender(''); setBloodGroup('');
    setDob(''); setCertDob(''); setDoj('');
    setDesignation(''); setShift(''); setTeamType(''); setDepartment('');
    setPersonalEmail(''); setOfficialEmail('');
    setPersonalPhone(''); setParentPhone('');
    setLaptopStatus(''); setPresentLocation(''); setPermanentLocation('');
  };

  /** ---------- create / update submit ---------- */
  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      code,
      gender,
      bloodGroup,
      dob: dob || null,
      certDob: certDob || null,
      doj: doj || null,
      designation,
      shift,
      teamType,
      department,
      personalEmail,
      officialEmail,
      personalPhone,
      parentPhone,
      laptopStatus,
      presentLocation,
      permanentLocation,
    };

    setBusy(true);
    try {
      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      await loadEmployees();
      resetForm();
    } catch (err) {
      alert(err?.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  /** ---------- set edit mode ---------- */
  const onEdit = (e) => {
    setEditingId(e._id);
    setName(e.name || '');
    setCode(e.code || '');
    setGender(e.gender || '');
    setBloodGroup(e.bloodGroup || '');
    setDob(toDateInput(e.dob));
    setCertDob(toDateInput(e.certDob));
    setDoj(toDateInput(e.doj));
    setDesignation(e.designation || '');
    setShift(e.shift || '');
    setTeamType(e.teamType || '');
    setDepartment(e.department || '');
    setPersonalEmail(e.personalEmail || '');
    setOfficialEmail(e.officialEmail || '');
    setPersonalPhone(e.personalPhone || '');
    setParentPhone(e.parentPhone || '');
    setLaptopStatus(e.laptopStatus || '');
    setPresentLocation(e.presentLocation || '');
    setPermanentLocation(e.permanentLocation || '');
    // scroll to form
    document.getElementById('employee-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  /** ---------- delete ---------- */
  const onDelete = async (e) => {
    if (!window.confirm(`Delete ${e.name} (${e.code})?`)) return;
    try {
      await api.delete(`/employees/${e._id}`);
      await loadEmployees();
      // if we were editing this one, exit edit mode
      if (editingId === e._id) resetForm();
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  /** columns (without actions) */
  const columns = useMemo(() => ([
    { key:'name',               title:'Name' },
    { key:'code',               title:'Emp ID' },
    { key:'gender',             title:'Gender' },
    { key:'bloodGroup',         title:'Blood' },
    { key:'dob',                title:'DOB', render:(e)=>fmtDate(e.dob) },
    { key:'certDob',            title:'Cert DOB', render:(e)=>fmtDate(e.certDob) },
    { key:'doj',                title:'DOJ', render:(e)=>fmtDate(e.doj) },
    { key:'designation',        title:'Designation' },
    { key:'shift',              title:'Shift' },
    { key:'teamType',           title:'Team' },
    { key:'personalEmail',      title:'Personal Email' },
    { key:'officialEmail',      title:'Official Email' },
    { key:'personalPhone',      title:'Personal Phone' },
    { key:'parentPhone',        title:'Parent Phone' },
    { key:'laptopStatus',       title:'Laptop' },
    { key:'presentLocation',    title:'Present Location' },
    { key:'permanentLocation',  title:'Permanent Location' },
  ]), []);

  /** ---------- Excel export ---------- */
  const downloadEmployeesExcel = async () => {
    const header = [
      'Name','Emp ID','Gender','Blood Group',
      'DOB','Cert DOB','Date of Joining',
      'Designation','Shift','Team','Department',
      'Personal Email','Official Email',
      'Personal Phone','Parent Phone',
      'Laptop Status','Present Location','Permanent Location',
      'Created At','Updated At'
    ];
    const rows = employees.map(e => ([
      e.name || '',
      e.code || '',
      e.gender || '',
      e.bloodGroup || '',
      fmtDate(e.dob),
      fmtDate(e.certDob),
      fmtDate(e.doj),
      e.designation || '',
      e.shift || '',
      e.teamType || '',
      e.department || '',
      e.personalEmail || '',
      e.officialEmail || '',
      e.personalPhone || '',
      e.parentPhone || '',
      e.laptopStatus || '',
      e.presentLocation || '',
      e.permanentLocation || '',
      e.createdAt ? new Date(e.createdAt).toLocaleString() : '',
      e.updatedAt ? new Date(e.updatedAt).toLocaleString() : '',
    ]));

    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      XLSX.writeFile(wb, `employees_${toYMD(new Date())}.xlsx`);
    } catch {
      const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
      const csv = [header, ...rows].map(r => r.map(esc).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `employees_${toYMD(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* LEFT: Add / Update form */}
      <div className="card col-span-12 lg:col-span-4" id="employee-form">
        <h3 className="font-semibold mb-4">
          {editingId ? 'Update Employee' : 'Add Employee'}
        </h3>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <div className="label">Name</div>
            <input className="input w-full" value={name} onChange={e=>setName(e.target.value)} required />
          </div>

          <div>
            <div className="label">Emp ID</div>
            <input className="input w-full" value={code} onChange={e=>setCode(e.target.value)} required disabled={!!editingId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label">Gender</div>
              <select className="select w-full" value={gender} onChange={e=>setGender(e.target.value)}>
                <option value="">Select...</option>
                {GENDER.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Blood Group</div>
              <input className="input w-full" placeholder="e.g., O+, A-" value={bloodGroup} onChange={e=>setBloodGroup(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="label">DOB</div>
              <input type="date" className="input w-full" value={dob} onChange={e=>setDob(e.target.value)} />
            </div>
            <div>
              <div className="label">Cert. DOB</div>
              <input type="date" className="input w-full" value={certDob} onChange={e=>setCertDob(e.target.value)} />
            </div>
            <div>
              <div className="label">Date of Joining</div>
              <input type="date" className="input w-full" value={doj} onChange={e=>setDoj(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="label">Designation</div>
              <select className="select w-full" value={designation} onChange={e=>setDesignation(e.target.value)}>
                <option value="">Select...</option>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Shift</div>
              <select className="select w-full" value={shift} onChange={e=>setShift(e.target.value)}>
                <option value="">Select...</option>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Team</div>
              <select className="select w-full" value={teamType} onChange={e=>setTeamType(e.target.value)}>
                <option value="">Select...</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label">Personal Email</div>
              <input className="input w-full" value={personalEmail} onChange={e=>setPersonalEmail(e.target.value)} />
            </div>
            <div>
              <div className="label">Official Email</div>
              <input className="input w-full" value={officialEmail} onChange={e=>setOfficialEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label">Personal Contact No.</div>
              <input className="input w-full" value={personalPhone} onChange={e=>setPersonalPhone(e.target.value)} />
            </div>
            <div>
              <div className="label">Parent Contact No.</div>
              <input className="input w-full" value={parentPhone} onChange={e=>setParentPhone(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="label">Laptop Status</div>
              <select className="select w-full" value={laptopStatus} onChange={e=>setLaptopStatus(e.target.value)}>
                <option value="">Select...</option>
                {LAPTOP_STATUS.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Present Location</div>
              <input className="input w-full" value={presentLocation} onChange={e=>setPresentLocation(e.target.value)} />
            </div>
            <div>
              <div className="label">Permanent Location</div>
              <input className="input w-full" value={permanentLocation} onChange={e=>setPermanentLocation(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Update' : 'Save'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={resetForm}
                disabled={busy}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT: Team table + Download */}
      <div className="card col-span-12 lg:col-span-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Team</h3>
          <button className="btn btn-primary" onClick={downloadEmployeesExcel}>
            Download
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1250px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                {columns.map(col => (
                  <th key={col.key} className="pb-2 px-3">{col.title}</th>
                ))}
                <th className="pb-2 px-3 w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!employees.length && (
                <tr className="border-t">
                  <td className="py-6 px-3 text-gray-500" colSpan={columns.length + 1}>
                    No employees yet.
                  </td>
                </tr>
              )}
              {employees.map((e) => (
                <tr key={e._id} className="border-t">
                  {columns.map(col => (
                    <td key={col.key} className="py-2 px-3">
                      {col.render ? col.render(e) : (e[col.key] || '')}
                    </td>
                  ))}
                  <td className="py-2 px-3">
                    <div className="flex gap-2">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onEdit(e)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDelete(e)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
