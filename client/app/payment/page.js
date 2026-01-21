"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '../../utils/api';
import toast from 'react-hot-toast';

export default function Payment() {
  const [cartItems, setCartItems] = useState([]);
  const router = useRouter();

  useEffect(() => { loadCart(); }, []);

  const loadCart = async () => {
    try {
        const { data } = await API.get('/cart');
        setCartItems(data);
    } catch (err) { console.error(err); }
  };

  const updateQuantity = async (coinId, action) => {
    try {
        await API.put('/cart', { coinId, action });
        loadCart(); 
    } catch (err) { toast.error("Error updating"); }
  };

  const clearCart = async () => {
    if(!confirm("Are you sure you want to empty your cart?")) return;
    try {
        await API.delete('/cart');
        setCartItems([]);
        toast.success("Cart Cleared 🗑️");
    } catch(err) { toast.error("Failed to clear"); }
  };

  const totalCost = cartItems.reduce((acc, item) => acc + (item.price * item.amount), 0);

  return (
    <div className="min-h-screen text-gray-900 dark:text-white p-6 flex flex-col items-center transition-colors duration-500">
      <div className="w-full max-w-4xl mb-6 flex justify-start">
        <button onClick={() => router.push('/dashboard')} className="apple-glass px-4 py-2 rounded-xl font-bold flex items-center gap-2">← Back to Store</button>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Your Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center p-10 apple-glass rounded-xl border border-gray-700 w-full max-w-2xl">
            <p className="text-xl text-gray-400 mb-4">Your cart is empty 😢</p>
            <button onClick={() => router.push('/dashboard')} className="bg-blue-600 px-6 py-2 rounded text-white font-bold">Go Shopping</button>
        </div>
      ) : (
        <div className="apple-glass p-8 rounded-2xl shadow-2xl max-w-4xl w-full">
            <div className="flex justify-between items-center mb-6 border-b border-gray-300 dark:border-gray-600 pb-4">
                <h2 className="text-2xl font-bold">Order Summary</h2>
                <button onClick={clearCart} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1">
                    🗑️ Clear All
                </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto pr-2 space-y-4 custom-scrollbar mb-8">
                {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/40 dark:bg-black/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <img src={item.image} className="w-12 h-12 rounded-full" />
                            <div>
                                <p className="font-bold text-lg">{item.name}</p>
                                <p className="text-sm text-gray-500">Unit Price: ₹{item.price.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg px-2 py-1">
                                <button onClick={() => updateQuantity(item.coinId, 'decrease')} className="px-3 font-bold hover:text-red-600">-</button>
                                <span className="text-lg font-bold w-6 text-center">{item.amount}</span>
                                <button onClick={() => updateQuantity(item.coinId, 'increase')} className="px-3 font-bold hover:text-green-600">+</button>
                            </div>
                            <span className="font-bold text-xl w-32 text-right">₹{(item.price * item.amount).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center bg-white/50 dark:bg-black/30 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">₹{totalCost.toLocaleString('en-IN')}</p>
                </div>
                <button 
                    onClick={() => router.push('/checkout')}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-lg transition transform hover:scale-105"
                >
                    Proceed to Payment →
                </button>
            </div>
        </div>
      )}
    </div>
  );
}