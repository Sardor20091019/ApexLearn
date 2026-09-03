'use client';

import React, { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/';
      return;
    }

    fetch('http://localhost:3000/courses', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          setError(data.message || 'Failed to load courses');
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>ApexLearn Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{ backgroundColor: '#ff4d4f', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Published Courses</h2>
      {courses.length === 0 ? (
        <p>No courses available yet.</p>
      ) : (
        <ul>
          {courses.map((course: any) => (
            <li key={course.id}>
              <strong>{course.title}</strong> - {course.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}   