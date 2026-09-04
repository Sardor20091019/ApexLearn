'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'INSTRUCTOR' | 'ADMIN';
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        // Fetch current user profile to verify admin email
        const profileRes = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = await profileRes.json();

        if (profile.email !== 'sardor091019@gmail.com') {
          router.push('/dashboard');
          return;
        }

        // Fetch all users list
        const usersRes = await fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await usersRes.json();
        if (usersRes.ok) setUsers(usersData);
      } catch (err) {
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router, API_URL]);

  const handleGrantInstructor = async (userId: string) => {
    setError('');
    setSuccess('');
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'INSTRUCTOR' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');

      setUsers(users.map(u => u.id === userId ? { ...u, role: 'INSTRUCTOR' } : u));
      setSuccess('User successfully promoted to Instructor!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center font-sans text-xs text-gray-500">Verifying security credentials...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] p-6 lg:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Control Panel</h1>
            <p className="text-xs text-gray-500 font-medium mt-1">Authorized as sardor091019@gmail.com</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 shadow-2xs">
            Back to Dashboard
          </button>
        </div>

        {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold">{error}</div>}
        {success && <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-semibold">{success}</div>}

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600">Platform Users</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">{u.name || 'Unnamed User'}</p>
                  <p className="text-[11px] text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    u.role === 'INSTRUCTOR' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {u.role}
                  </span>
                  {u.role === 'USER' && (
                    <button
                      onClick={() => handleGrantInstructor(u.id)}
                      className="px-3 py-1.5 bg-[#0056D2] text-white rounded-xl text-[11px] font-bold hover:bg-[#00419E] shadow-2xs transition-all"
                    >
                      Make Instructor
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}