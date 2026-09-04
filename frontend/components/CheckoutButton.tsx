'use client';

import { useState } from 'react';

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleCheckout = async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`${API_URL}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment initiation failed');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Could not connect to payment gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="bg-[#0056D2] hover:bg-[#00419E] text-white font-extrabold px-6 py-4 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-50"
    >
      {loading ? 'Securing checkout session...' : 'Enroll in Course — $49'}
    </button>
  );
}