import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-4 text-yellow-500">CryptoX</h1>
      <p className="text-xl text-gray-300 mb-8">Secure. Scalable. Fast.</p>
      
      <div className="space-x-4">
        <Link 
          href="/login" 
          className="px-8 py-3 bg-blue-600 rounded hover:bg-blue-700 font-bold transition"
        >
          Login
        </Link>
        <Link 
          href="/register" 
          className="px-8 py-3 bg-green-600 rounded hover:bg-green-700 font-bold transition"
        >
          Register
        </Link>
      </div>
    </div>
  );
}