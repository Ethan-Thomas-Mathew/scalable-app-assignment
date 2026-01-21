"use client";
import { useState } from 'react';
import API from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const router = useRouter();

  const checkStrength = (pass) => {
    let score = 0;
    if (pass.length > 5) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    setStrength(Math.min(score, 4));
    setPassword(pass);
  };

  const getBarColor = () => {
    if (strength < 2) return 'bg-red-500';
    if (strength === 3) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (strength < 2) return toast.error("Password too weak!");
    
    try {
      await API.post('/user/register', { username, email, password });
      toast.success('Registered! Please Login.');
      router.push('/login');
    } catch (err) {
      toast.error('Registration Failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <form onSubmit={handleRegister} className="p-10 bg-white rounded shadow-xl w-96">
        <h1 className="mb-6 text-3xl font-bold text-center">Join CryptoX</h1>
        <input 
          className="w-full p-3 mb-4 border rounded" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
        />
        <input 
          className="w-full p-3 mb-4 border rounded" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          className="w-full p-3 mb-2 border rounded" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => checkStrength(e.target.value)} 
        />
        
        <div className="w-full h-2 bg-gray-200 rounded mb-6 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getBarColor()}`} 
              style={{ width: `${(strength / 4) * 100}%` }}
            ></div>
        </div>

        <button className="w-full p-3 text-white bg-green-600 rounded font-bold hover:bg-green-700">Create Account</button>
        <p className="mt-4 text-center">Member? <Link href="/login" className="text-blue-600">Login</Link></p>
      </form>
    </div>
  );
}