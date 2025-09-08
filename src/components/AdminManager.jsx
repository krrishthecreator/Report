import React, { useEffect, useState } from 'react';
import { api } from '../api';

const TEAM_TYPES = ['On Going', 'One Time'];

export default function AdminManager() {
  const role = localStorage.getItem('role');
  const [list, setList] = useState([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamType, setTeamType] = useState('');

  const load = async () => {
    const { data } = await api.get('/admins');
    setList(data || []);
  };
  useEffect(() => { load(); }, []);

  const createAdmin = async (e) => {
    e.preventDefault();
    if (!email || !password || !teamType) return alert('Fill all fields');
    await api.post('/admins', { email, password, teamType });
    setEmail(''); setPassword(''); setTeamType('');
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this admin?')) return;
    await api.delete(`/admins/${id}`);
    load();
  };

  if (role !== 'super') {
    return <div className="card">You do not have access to this page.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Create Admin (Team Scoped)</h3>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={createAdmin}>
          <div>
            <div className="label">Email</div>
            <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <div className="label">Password</div>
            <input type="password" className="input w-full" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div>
            <div className="label">Team</div>
            <select className="select w-full" value={teamType} onChange={e=>setTeamType(e.target.value)}>
              <option value="">Select...</option>
              {TEAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <button className="btn btn-primary">Create</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Admins</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="pb-2 px-3">Email</th>
                <th className="pb-2 px-3">Role</th>
                <th className="pb-2 px-3">Team</th>
                <th className="pb-2 px-3">Shift</th>
                <th className="pb-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(a => (
                <tr key={a._id} className="border-t">
                  <td className="py-2 px-3">{a.email}</td>
                  <td className="px-3">{a.role}</td>
                  <td className="px-3">{a.allowedTeamType || ''}</td>
                  <td className="px-3">{a.allowedShift || ''}</td>
                  <td className="px-3">
                    {a.role !== 'super' && (
                      <button className="btn" onClick={()=>remove(a._id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr className="border-t"><td className="py-6 px-3 text-gray-500" colSpan={5}>No admins yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
