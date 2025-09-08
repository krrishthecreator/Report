import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

/* =========================
   Status labels & colors
   ========================= */
const STATUS_LIST = [
  'PRESENT','WFH','CASUAL LEAVE','SICK LEAVE',
  'SESSION_01 LEAVE','SESSION_02 LEAVE','COMP-OFF',
  'PHONE INTIMATION','NO INTIMATION','NCNS',
  'L.O.P.','HOLIDAY','RELIEVED','1 Hr Per MORN',
  '2 Hr Per MORN','1 Hr Per EVE','2 Hr Per EVE','SUNDAY'
];

const statusClass = (s) => ({
  'PRESENT': 'bg-green-600 text-white',
  'WFH': 'bg-blue-400 text-white',
  'CASUAL LEAVE': 'bg-cyan-500 text-white',
  'SICK LEAVE': 'bg-lime-500 text-black',
  'SESSION_01 LEAVE': 'bg-amber-300 text-black',
  'SESSION_02 LEAVE': 'bg-yellow-400 text-black',
  'COMP-OFF': 'bg-yellow-300 text-black',
  'PHONE INTIMATION': 'bg-black text-white',
  'NO INTIMATION': 'bg-red-700 text-white',
  'NCNS': 'bg-pink-700 text-white',
  'L.O.P.': 'bg-red-600 text-white',
  'HOLIDAY': 'bg-emerald-400 text-black',
  'RELIEVED': 'bg-gray-400 text-black',
  '1 Hr Per MORN': 'bg-amber-200 text-black',
  '2 Hr Per MORN': 'bg-orange-300 text-black',
  '1 Hr Per EVE': 'bg-teal-200 text-black',
  '2 Hr Per EVE': 'bg-teal-300 text-black',
  'SUNDAY': 'bg-gray-700 text-white'
}[s] || 'bg-white');

/* =========================
   Local-time date helpers
   ========================= */
const pad = (n) => String(n).padStart(2, '0');
const toYMD = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};
const parseYMD = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0); // local midnight
};
const getMonthRange = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end   = new Date(y, m, 0, 0, 0, 0);
  return { from: toYMD(start), to: toYMD(end) };
};
const buildDates = (fromStr, toStr) => {
  const out = [];
  let d = parseYMD(fromStr);
  const end = parseYMD(toStr);
  while (d <= end) {
    out.push(toYMD(d));
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  }
  return out;
};

export default function AttendanceTable() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);

  // Filters
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0,7)); // YYYY-MM
  const [{ from, to }, setRange] = useState(() => getMonthRange(new Date().toISOString().slice(0,7)));
  const [teamFilter, setTeamFilter] = useState('');   // '' = All
  const [shiftFilter, setShiftFilter] = useState(''); // '' = All

  // SCOPE: read once from localStorage
  const role = useMemo(() => localStorage.getItem('role') || '', []);
  const scope = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('scope') || '{}'); }
    catch { return {}; }
  }, []);

  // When scoped admin logs in, prefill and lock filters
  useEffect(() => {
    if (role === 'admin') {
      if (scope.teamType) setTeamFilter(scope.teamType);
      if (scope.shift)    setShiftFilter(scope.shift);
    }
  // we intentionally only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Editing a cell
  const [editing, setEditing] = useState(null); // { empId, date }

  // Update month range
  useEffect(() => setRange(getMonthRange(month)), [month]);

  // Load employees once (server already scopes by token)
  useEffect(() => {
    (async () => {
      const { data } = await api.get('/employees');
      setEmployees(data);
    })();
  }, []);

  // Load attendance for selected month (server scopes by token)
  const fetchRecords = async () => {
    const { data } = await api.get('/attendance', { params: { from, to } });
    setRecords(data);
  };
  useEffect(() => { if (from && to) fetchRecords(); }, [from, to]);

  // Unique filter options from scoped employees
  const teamOptions  = useMemo(() =>
    Array.from(new Set(employees.map(e => e.teamType).filter(Boolean))), [employees]);
  const shiftOptions = useMemo(() =>
    Array.from(new Set(employees.map(e => e.shift).filter(Boolean))), [employees]);

  // Apply Team/Shift filters on client
  const filteredEmployees = useMemo(() =>
    employees.filter(e =>
      (!teamFilter  || e.teamType === teamFilter) &&
      (!shiftFilter || e.shift     === shiftFilter)
    ), [employees, teamFilter, shiftFilter]);

  // Map records for O(1) lookup
  const recMap = useMemo(() => {
    const m = new Map();
    for (const r of records) {
      m.set(`${r.employee?._id || r.employee}|${toYMD(new Date(r.date))}`, r);
    }
    return m;
  }, [records]);

  // Month days
  const dates = useMemo(() => buildDates(from, to), [from, to]);

  // Save status
  const saveStatus = async (empId, date, status) => {
    await api.post('/attendance/mark', { employeeId: empId, date, status });
    // optimistic update
    const key = `${empId}|${date}`;
    const existing = recMap.get(key);
    if (existing) existing.status = status;
    else records.push({ _id: key, employee: employees.find(e => e._id === empId), date, status });
    setRecords([...records]);
    setEditing(null);
  };

  // Export current (month + filters) → Excel with two sheets (Attendance + Remarks)
  const exportExcel = async () => {
    const header1 = ['S. No', 'Employee', 'Emp ID', ...dates.map(d => parseYMD(d).toLocaleDateString())];
    const rows1 = filteredEmployees.map((emp, idx) => {
      const row = [idx + 1, emp.name, emp.code];
      for (const d of dates) {
        const rec = recMap.get(`${emp._id}|${d}`);
        row.push(rec?.status || '');
      }
      return row;
    });

    // Remarks (only rows with note)
    const header2 = ['Date', 'Employee', 'Emp ID', 'Status', 'Remark'];
    const rows2 = [];
    for (const emp of filteredEmployees) {
      for (const d of dates) {
        const rec = recMap.get(`${emp._id}|${d}`);
        if (rec?.note) {
          rows2.push([
            parseYMD(d).toLocaleDateString(),
            emp.name,
            emp.code,
            rec.status || '',
            rec.note
          ]);
        }
      }
    }

    // file tag
    const tag = [
      month,
      teamFilter  ? `_${teamFilter.replace(/\s+/g,'_')}`   : '',
      shiftFilter ? `_${shiftFilter.replace(/\s+/g,'_')}` : ''
    ].join('');

    try {
      const XLSX = await import('xlsx'); // npm i xlsx
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet([header1, ...rows1]);
      XLSX.utils.book_append_sheet(wb, ws1, 'Attendance');
      const ws2 = XLSX.utils.aoa_to_sheet([header2, ...(rows2.length ? rows2 : [['','','','','']])]);
      XLSX.utils.book_append_sheet(wb, ws2, 'Remarks');
      XLSX.writeFile(wb, `attendance${tag}.xlsx`);
    } catch {
      // Fallback: download two CSVs
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv1 = [header1, ...rows1].map(r => r.map(esc).join(',')).join('\n');
      const csv2 = [header2, ...rows2].map(r => r.map(esc).join(',')).join('\n');

      const blob1 = new Blob([csv1], { type:'text/csv;charset=utf-8;' });
      const a1 = document.createElement('a');
      a1.href = URL.createObjectURL(blob1);
      a1.download = `attendance${tag}.csv`;
      a1.click();
      URL.revokeObjectURL(a1.href);

      const blob2 = new Blob([csv2], { type:'text/csv;charset=utf-8;' });
      const a2 = document.createElement('a');
      a2.href = URL.createObjectURL(blob2);
      a2.download = `attendance${tag}_remarks.csv`;
      a2.click();
      URL.revokeObjectURL(a2.href);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-12 gap-4">
        <div className="card col-span-12 md:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="label mb-1">Month</div>
              <input
                type="month"
                className="input w-full"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>

            <div>
              <div className="label mb-1">Team</div>
              <select
                className="select w-full"
                value={teamFilter}
                onChange={(e)=>setTeamFilter(e.target.value)}
                // SCOPE: lock Team when admin has teamType scope
                disabled={role === 'admin' && !!scope.teamType}
              >
                <option value="">All</option>
                {teamOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <div className="label mb-1">Shift</div>
              <select
                className="select w-full"
                value={shiftFilter}
                onChange={(e)=>setShiftFilter(e.target.value)}
                // SCOPE: lock Shift when admin has shift scope
                disabled={role === 'admin' && !!scope.shift}
              >
                <option value="">All</option>
                {shiftOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card col-span-12 md:col-span-4">
          <div className="font-semibold mb-2">Legend</div>
          <div className="flex flex-wrap gap-2">
            {STATUS_LIST.map(s => (
              <span key={s} className={`text-xs px-2 py-1 rounded ${statusClass(s)}`}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold">
            Attendance (Matrix) — {month}
            {teamFilter  && <> · Team: <span className="font-normal">{teamFilter}</span></>}
            {shiftFilter && <> · Shift: <span className="font-normal">{shiftFilter}</span></>}
          </h3>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline" onClick={fetchRecords}>Refresh</button>
            <button className="btn btn-primary" onClick={exportExcel}>Download</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-gray-600">
                <th className="pb-2 px-3">#</th>
                <th className="pb-2 px-3">Employee</th>
                <th className="pb-2 px-3">Emp ID</th>
                {dates.map(d => (
                  <th key={d} className="pb-2 px-3 text-center">
                    {parseYMD(d).toLocaleDateString()}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((emp, idx) => (
                <tr key={emp._id} className="border-t">
                  <td className="py-2 px-3">{idx + 1}</td>
                  <td className="px-3">{emp.name}</td>
                  <td className="px-3">{emp.code}</td>

                  {dates.map((d) => {
                    const key = `${emp._id}|${d}`;
                    const rec = recMap.get(key);
                    const val = rec?.status || '';
                    const note = rec?.note || '';
                    const isEditing = editing?.empId === emp._id && editing?.date === d;

                    const titleParts = [
                      `${emp.name} — ${parseYMD(d).toLocaleDateString()}`,
                      val ? `Status: ${val}` : 'Status: —',
                      note ? `Remark: ${note}` : ''
                    ].filter(Boolean);
                    const title = titleParts.join('\n');

                    return (
                      <td key={key} className="px-3 py-1">
                        {isEditing ? (
                          <select
                            autoFocus
                            className="select w-full"
                            defaultValue={val || 'PRESENT'}
                            onBlur={(e) => saveStatus(emp._id, d, e.target.value)}
                            onChange={(e) => saveStatus(emp._id, d, e.target.value)}
                          >
                            {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <div className="relative">
                            <button
                              className={`w-full rounded text-xs px-2 py-2 border ${val ? statusClass(val) : 'bg-white'}`}
                              onClick={() => setEditing({ empId: emp._id, date: d })}
                              title={title}
                            >
                              {val || '—'}
                            </button>
                            {note && (
                              <span
                                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"
                                title={`Remark: ${note}`}
                              />
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {!filteredEmployees.length && (
                <tr className="border-t">
                  <td className="py-6 px-3 text-gray-500" colSpan={3 + dates.length}>
                    No employees match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
