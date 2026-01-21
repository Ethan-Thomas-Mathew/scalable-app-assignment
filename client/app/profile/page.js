"use client";
import { useEffect, useState } from 'react';
import API from '../../utils/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState({ username: '', email: '' });
    const [portfolio, setPortfolio] = useState([]);
    const [currentPrices, setCurrentPrices] = useState({});
    
    const [sellAmounts, setSellAmounts] = useState({});
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [inputOtp, setInputOtp] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const userRes = await API.get('/user'); 
            if (!userRes.data) throw new Error("No user");
            setUser(userRes.data);
            setFormData({ username: userRes.data.username, email: userRes.data.email, password: '' });
            
            const historyRes = await API.get('/crypto');
            const rawHistory = historyRes.data;
            const aggregated = rawHistory.reduce((acc, tx) => {
                if (!acc[tx.coinName]) {
                    acc[tx.coinName] = { name: tx.coinName, totalAmount: 0, totalSpent: 0 };
                }
                acc[tx.coinName].totalAmount += tx.amount;
                acc[tx.coinName].totalSpent += (tx.priceAtBuy * tx.amount);
                return acc;
            }, {});
            setPortfolio(Object.values(aggregated));
        } catch (err) {
            console.error("Auth Error", err);
            Cookies.remove('token');
            router.push('/login');
            return;
        }

        try {
            const coinsRes = await API.get('/proxy/coins');
            const priceMap = {};
            coinsRes.data.forEach(coin => {
                priceMap[coin.name] = { 
                    sparkline: coin.sparkline_in_7d?.price,
                    current_price: coin.current_price,
                    change: coin.price_change_percentage_24h 
                };
            });
            setCurrentPrices(priceMap);
        } catch (err) { console.warn("Price fetch failed"); }
        setIsLoading(false);
    };

    const initiateUpdate = (e) => {
        e.preventDefault();
        const otp = Math.floor(100000 + Math.random() * 900000);
        setGeneratedOtp(otp);
        setShowOtpModal(true); 
        toast("OTP sent to your email (Simulated)");
    };

    const verifyAndSave = async () => {
        if (parseInt(inputOtp) !== generatedOtp) return toast.error("Incorrect OTP!");
        try {
            await API.put('/user', formData);
            toast.success("Profile Updated! ✅");
            setUser({ ...user, username: formData.username, email: formData.email });
            setIsEditModalOpen(false);
            setShowOtpModal(false);
            setInputOtp('');
        } catch (err) { toast.error("Update failed."); }
    };

    const updateSellAmount = (coinName, val, max) => {
        const num = parseInt(val) || 0;
        const safeNum = Math.min(Math.max(0, num), max);
        setSellAmounts(prev => ({ ...prev, [coinName]: safeNum }));
    };

    const handleSell = async (coinName) => {
        const amount = sellAmounts[coinName] || 0;
        if (amount <= 0) return toast.error("Enter amount to sell");
        if (!confirm(`Sell ${amount} ${coinName}?`)) return;

        try {
            await API.post('/crypto/sell', { coinName, amountToSell: amount });
            toast.success("Sold successfully! 💸");
            setSellAmounts(prev => ({ ...prev, [coinName]: 0 }));
            loadData();
        } catch (err) { toast.error("Sell failed"); }
    };

    const Sparkline = ({ data, color }) => {
        if (!data || data.length < 5) return <span className="text-gray-400 text-xs italic">No Data</span>;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1; 
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 30 - ((d - min) / range) * 30;
            return `${x},${y}`;
        }).join(' ');
        return (
            <svg width="100" height="30" className="overflow-visible">
                <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
            </svg>
        );
    };

    if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen text-gray-900 dark:text-white p-8 transition-colors duration-500">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => router.push('/dashboard')} className="apple-glass px-4 py-2 rounded-xl font-bold flex items-center gap-2">← Back to Store</button>
                <button onClick={() => setIsEditModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-500 transition">Edit Profile / Password</button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="apple-glass p-8 rounded-3xl h-fit flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-4xl mb-4 shadow-xl">👤</div>
                    <h2 className="text-2xl font-bold">{user.username}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{user.email}</p>
                    <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-6">
                         <p className="text-sm font-bold text-gray-500 uppercase">Total Portfolio Value</p>
                         <p className="text-3xl font-extrabold text-green-600 mt-2">
                            {/* UPDATE: Indian Format */}
                            ₹{portfolio.reduce((acc, item) => {
                                const currentPrice = currentPrices[item.name]?.current_price || (item.totalSpent / item.totalAmount);
                                return acc + (currentPrice * item.totalAmount);
                            }, 0).toLocaleString('en-IN')}
                         </p>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-2xl font-bold mb-4 ml-2">Your Assets</h2>
                    {portfolio.length === 0 ? (
                        <div className="apple-glass p-10 rounded-3xl text-center text-gray-500">No assets found.</div>
                    ) : (
                        portfolio.map((item, idx) => {
                            const coinData = currentPrices[item.name];
                            const isUp = coinData?.change >= 0;
                            const avgBuyPrice = item.totalSpent / item.totalAmount;
                            const currentValue = (coinData?.current_price || avgBuyPrice) * item.totalAmount;
                            const sellQty = sellAmounts[item.name] || 0;
                            
                            return (
                                <div key={idx} className="apple-glass p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold">{item.name}</h3>
                                            {coinData && (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isUp ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{coinData.change?.toFixed(2)}%</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Holdings: <span className="font-bold text-gray-900 dark:text-white">{item.totalAmount}</span></p>
                                        
                                        {/* UPDATE: Indian Format */}
                                        <p className="text-xs text-gray-500">Avg Buy: ₹{avgBuyPrice.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="w-32 h-10 hidden md:block">
                                        {coinData && <Sparkline data={coinData.sparkline} color={isUp ? '#4ade80' : '#f87171'} />}
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-2">
                                        {/* UPDATE: Indian Format */}
                                        <p className="font-bold text-xl">₹{currentValue.toLocaleString('en-IN')}</p>
                                        
                                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/20 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
                                            <button 
                                                onClick={() => updateSellAmount(item.name, sellQty - 1, item.totalAmount)}
                                                className="w-6 h-6 flex items-center justify-center font-bold hover:bg-gray-200 dark:hover:bg-white/10 rounded"
                                            >-</button>
                                            
                                            <input 
                                                type="number" 
                                                className="w-10 bg-transparent text-center text-sm font-bold outline-none"
                                                value={sellQty}
                                                onChange={(e) => updateSellAmount(item.name, e.target.value, item.totalAmount)}
                                            />
                                            
                                            <button 
                                                onClick={() => updateSellAmount(item.name, sellQty + 1, item.totalAmount)}
                                                className="w-6 h-6 flex items-center justify-center font-bold hover:bg-gray-200 dark:hover:bg-white/10 rounded"
                                            >+</button>
                                        </div>

                                        <button 
                                            onClick={() => handleSell(item.name)} 
                                            disabled={sellQty === 0}
                                            className={`text-xs px-3 py-1.5 rounded-lg transition font-bold ${sellQty > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                        >
                                            Sell
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            {/* Modals are the same... */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-white/20 p-8 rounded-3xl w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
                        <form onSubmit={initiateUpdate} className="space-y-4">
                            <div><label className="text-xs font-bold ml-1">Username</label><input className="w-full p-3 rounded-xl glass-input dark:text-white" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                            <div><label className="text-xs font-bold ml-1">Email</label><input className="w-full p-3 rounded-xl glass-input dark:text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                            <div><label className="text-xs font-bold ml-1">New Password (Optional)</label><input type="password" className="w-full p-3 rounded-xl glass-input dark:text-white" placeholder="Leave blank to keep same" onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                            <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold border border-white/20">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Update</button></div>
                        </form>
                    </div>
                </div>
            )}
            {showOtpModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60]">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl text-center border-2 border-blue-500 animate-shake">
                        <h3 className="text-2xl font-bold mb-2">Verify It's You</h3>
                        <div className="bg-yellow-100 text-yellow-800 font-mono text-lg py-2 rounded mb-4">SIMULATED OTP: <strong>{generatedOtp}</strong></div>
                        <input className="w-full text-center text-3xl tracking-widest border-b-2 border-gray-300 focus:border-blue-500 bg-transparent outline-none mb-6 pb-2 dark:text-white" maxLength={6} placeholder="000000" value={inputOtp} onChange={(e) => setInputOtp(e.target.value)} />
                        <button onClick={verifyAndSave} className="w-full py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold text-lg shadow-lg">Confirm Changes</button>
                        <button onClick={() => setShowOtpModal(false)} className="mt-4 text-sm text-gray-500 hover:text-white">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}