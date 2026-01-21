"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '../../utils/api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [method, setMethod] = useState('card'); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  const router = useRouter();

  useEffect(() => {
    API.get('/cart').then(res => setCartItems(res.data)).catch(console.error);
  }, []);

  const totalCost = cartItems.reduce((acc, item) => acc + (item.price * item.amount), 0);

  // --- SMART VALIDATIONS ---
  const handleCardInput = (e) => {
      // Remove spaces, only digits
      let val = e.target.value.replace(/\D/g, '');
      // Add space every 4 digits
      val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
      setCardNumber(val);
  };

  const handleExpiryInput = (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length >= 2) {
          val = val.substring(0, 2) + '/' + val.substring(2, 4);
      }
      setExpiry(val);
  };
  // -------------------------

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Basic Validation
    if (method === 'card') {
        if (cardNumber.length < 19) return toast.error("Invalid Card Number");
        if (expiry.length < 5) return toast.error("Invalid Expiry");
        if (cvv.length < 3) return toast.error("Invalid CVV");
    }

    setIsProcessing(true);
    setTimeout(async () => {
        try {
            await API.post('/crypto/buy', { items: cartItems, paymentMethod: method });
            await API.delete('/cart');
            toast.success('Order Placed Successfully! 🎉');
            router.push('/profile');
        } catch (err) { toast.error('Payment Failed.'); }
        setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-white p-4 md:p-10 transition-colors duration-500 font-sans">
      
      <div className="max-w-6xl mx-auto mb-6">
        <button 
            onClick={() => router.push('/payment')} // Back to Cart
            className="real-glass px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white/10 transition border border-white/20 text-gray-900 dark:text-white"
        >
            ← Back to Cart
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT: Payment Methods */}
        <div className="md:col-span-2 real-glass rounded-[2rem] shadow-2xl p-8 border border-white/20">
            <h1 className="text-3xl font-black mb-8 border-b border-gray-300 dark:border-gray-700 pb-4 text-gray-900 dark:text-white">Checkout</h1>
            
            <div className="flex flex-col md:flex-row gap-8">
                {/* SIDEBAR */}
                <div className="w-full md:w-1/3 space-y-2">
                    <button onClick={() => setMethod('card')} className={`w-full text-left p-4 rounded-xl font-bold transition border ${method === 'card' ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-white/10 border-transparent text-gray-600 dark:text-gray-400'}`}>Credit / Debit Card</button>
                    <button onClick={() => setMethod('upi')} className={`w-full text-left p-4 rounded-xl font-bold transition border ${method === 'upi' ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-white/10 border-transparent text-gray-600 dark:text-gray-400'}`}>UPI / Apps</button>
                    <button onClick={() => setMethod('netbanking')} className={`w-full text-left p-4 rounded-xl font-bold transition border ${method === 'netbanking' ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-white/10 border-transparent text-gray-600 dark:text-gray-400'}`}>Net Banking</button>
                </div>

                {/* FORM AREA */}
                <div className="w-full md:w-2/3 border-l border-gray-300 dark:border-gray-700 pl-0 md:pl-8">
                    {method === 'card' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Card Details</h3>
                                <input 
                                    type="text" 
                                    placeholder="0000 0000 0000 0000" 
                                    className="w-full glass-input p-4 rounded-xl text-xl font-mono text-gray-900 dark:text-white placeholder-gray-400" 
                                    maxLength={19} 
                                    value={cardNumber}
                                    onChange={handleCardInput}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <input 
                                        type="text" 
                                        placeholder="MM/YY" 
                                        className="w-full glass-input p-4 rounded-xl text-center font-bold text-gray-900 dark:text-white placeholder-gray-400" 
                                        maxLength={5} 
                                        value={expiry}
                                        onChange={handleExpiryInput}
                                    />
                                </div>
                                <div className="flex-1">
                                    <input 
                                        type="password" 
                                        placeholder="CVV" 
                                        className="w-full glass-input p-4 rounded-xl text-center font-bold text-gray-900 dark:text-white placeholder-gray-400" 
                                        maxLength={3} 
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Name on Card" 
                                className="w-full glass-input p-4 rounded-xl font-bold text-gray-900 dark:text-white placeholder-gray-400" 
                                value={nameOnCard}
                                onChange={(e) => setNameOnCard(e.target.value)}
                            />
                        </div>
                    )}

                    {method === 'upi' && (
                         <div className="space-y-6 animate-fade-in">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">UPI Payment</h3>
                            <input type="text" placeholder="username@oksbi" className="w-full glass-input p-4 rounded-xl font-bold text-gray-900 dark:text-white placeholder-gray-400" />
                            <p className="text-sm opacity-60 text-gray-800 dark:text-gray-300">Open your UPI app to approve the request after placing order.</p>
                         </div>
                    )}

                    {method === 'netbanking' && (
                         <div className="space-y-6 animate-fade-in">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Select Bank</h3>
                            <select className="w-full glass-input p-4 rounded-xl font-bold text-gray-900 dark:text-white bg-transparent">
                                <option className="text-black">HDFC Bank</option>
                                <option className="text-black">State Bank of India</option>
                                <option className="text-black">ICICI Bank</option>
                            </select>
                         </div>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="md:col-span-1">
            <div className="real-glass rounded-[2rem] shadow-2xl p-8 border border-white/20 sticky top-10">
                <h2 className="text-xl font-black mb-6 text-gray-900 dark:text-white">Summary</h2>
                <div className="space-y-3 mb-8 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between"><span>Subtotal:</span><span>₹{totalCost.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Fees:</span><span className="text-green-500">₹0</span></div>
                    <div className="flex justify-between border-t border-gray-400/30 pt-4 font-black text-xl text-gray-900 dark:text-white mt-4"><span>Total:</span><span>₹{totalCost.toLocaleString('en-IN')}</span></div>
                </div>
                
                <button 
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="w-full bg-white text-black hover:bg-gray-200 p-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] text-lg font-black transition transform active:scale-95"
                >
                    {isProcessing ? 'Processing...' : `Pay ₹${totalCost.toLocaleString('en-IN')}`}
                </button>
                <p className="text-[10px] text-gray-500 mt-4 text-center uppercase tracking-widest">Secure 256-bit Encryption</p>
            </div>
        </div>

      </div>
    </div>
  );
}