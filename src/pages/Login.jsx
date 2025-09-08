import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Login() {
  const [hasSuper, setHasSuper] = useState(true);
  const [view, setView] = useState('login'); // 'login' | 'setup'

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/auth/has-super');
        setHasSuper(!!data?.hasSuper);
        setView(data?.hasSuper ? 'login' : 'setup');
      } catch {
        setHasSuper(true);
        setView('login');
      }
    })();
  }, []);

  const setupSuper = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/auth/setup-super', { email, password });
    if (data?.ok) {
      alert('Super admin created. Please login.');
      setEmail(''); setPassword('');
      setHasSuper(true); setView('login');
    }
  };

  const login = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('scope', JSON.stringify(data.scope || {}));
    window.location.href = '/';
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card w-full max-w-md">
        {!hasSuper && view==='setup' ? (
          <>
            <h2 className="font-semibold mb-3">Setup Super Admin</h2>
            <form className="space-y-3" onSubmit={setupSuper}>
              <div>
                <div className="label">Email</div>
                <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div>
                <div className="label">Password</div>
                <input type="password" className="input w-full" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full">Create Super Admin</button>
            </form>
          </>
        ) : (
          <>
            <h2 className="font-semibold mb-3">Admin Login</h2>
            <form className="space-y-3" onSubmit={login}>
              <div>
                <div className="label">Email</div>
                <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div>
                <div className="label">Password</div>
                <input type="password" className="input w-full" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full">Login</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
