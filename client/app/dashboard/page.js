"use client";
import { useEffect, useState, useRef, Suspense } from 'react';
import API from '../../utils/api'; 
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

function DashboardContent() {
  const [coinList, setCoinList] = useState([]);
  const [shoppingCart, setShoppingCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWelcomeCartModal, setShowWelcomeCartModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [localQuantities, setLocalQuantities] = useState({});
  
  // Menu States
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [sortOrder, setSortOrder] = useState('default');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Refs for "Click Outside" logic
  const profileRef = useRef(null);
  const burgerRef = useRef(null);

  useEffect(() => {
    if (!Cookies.get('token')) { router.push('/login'); return; }
    
    if (localStorage.getItem('theme') === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }

    const isNewSession = searchParams.get('newSession');
    loadCart(isNewSession);
    if (isNewSession) router.replace('/dashboard');

    fetchCoins();
    const intervalId = setInterval(fetchCoins, 60000); 

    // CLICK OUTSIDE LISTENER
    const handleClickOutside = (event) => {
        // If click is NOT inside Profile Menu AND NOT inside Burger Menu
        if (
            profileRef.current && !profileRef.current.contains(event.target) &&
            burgerRef.current && !burgerRef.current.contains(event.target)
        ) {
            setShowProfileMenu(false);
            setShowBurgerMenu(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        clearInterval(intervalId);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
      if (isDarkMode) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
          setIsDarkMode(false);
      } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
          setIsDarkMode(true);
      }
      setShowBurgerMenu(false); // Close menu after selection
  };

  // --- MENU HANDLERS (MUTUALLY EXCLUSIVE) ---
  const handleProfileClick = (e) => {
      e.stopPropagation();
      setShowBurgerMenu(false); // Force close burger
      setShowProfileMenu(!showProfileMenu);
  };

  const handleBurgerClick = (e) => {
      e.stopPropagation();
      setShowProfileMenu(false); // Force close profile
      setShowBurgerMenu(!showBurgerMenu);
  };

  const loadCart = async (showPopup = false) => {
    try {
      const { data } = await API.get('/cart');
      setShoppingCart(data);
      if (showPopup && data.length > 0) setShowWelcomeCartModal(true);
    } catch (err) { console.error("Cart Error", err); }
  };

  const fetchCoins = async () => {
    try {
      const { data } = await API.get('/proxy/coins'); 
      setCoinList(data);
    } catch (error) { console.error("API Error", error); }
  };

  const adjustLocalQuantity = (e, id, amount) => {
    e.stopPropagation(); 
    setLocalQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + amount) }));
  };

  const handleManualQuantity = (e, id, value) => {
      e.stopPropagation(); 
      const val = parseInt(value);
      if(!isNaN(val) && val > 0) {
          setLocalQuantities(prev => ({ ...prev, [id]: val }));
      }
  };

  const addItemToCart = async (e, coin) => {
    e.stopPropagation(); 
    try {
        const qty = localQuantities[coin.id] || 1;
        await API.post('/cart', { 
            id: coin.id, name: coin.name, image: coin.image, 
            price: coin.current_price, amount: qty 
        });
        toast.success(`Acquired ${qty} ${coin.name}`);
        loadCart(false);
        setLocalQuantities(prev => ({ ...prev, [coin.id]: 1 }));
    } catch(err) { toast.error("Failed to add"); }
  };

  const getFilteredAndSortedCoins = () => {
      let result = coinList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (sortOrder === 'low') return result.sort((a, b) => a.current_price - b.current_price);
      if (sortOrder === 'high') return result.sort((a, b) => b.current_price - a.current_price);
      return result;
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  // Interactive Graph Component
  const InteractiveGraph = ({ data, color }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    if (!data || data.length < 5) return <div className="text-center text-gray-500 py-10">Chart Data Unavailable</div>;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100; 
        const y = 100 - ((d - min) / range) * 80 - 10; 
        return `${x},${y}`;
    }).join(' ');

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const index = Math.round((x / width) * (data.length - 1));
        
        if (index >= 0 && index < data.length) {
            setActiveIndex(index);
            const pointY = 100 - ((data[index] - min) / range) * 80 - 10; 
            setHoverPos({ x: (index / (data.length - 1)) * 100, y: pointY });
        }
    };

    const formatTime = (index) => {
        const hoursAgo = data.length - 1 - index;
        const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
        return date.toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-full relative cursor-crosshair group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setActiveIndex(null)}
        >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={`0,100 ${points} 100,100`} fill="url(#gradient)" />
                <polyline points={points} fill="none" stroke={color} strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                
                {activeIndex !== null && (
                    <line x1={hoverPos.x} y1="0" x2={hoverPos.x} y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="0.2" strokeDasharray="1,1" vectorEffect="non-scaling-stroke" />
                )}
                {activeIndex !== null && (
                    <circle cx={hoverPos.x} cy={hoverPos.y} r="1.5" fill="white" stroke={color} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                )}
            </svg>

            {activeIndex !== null && (
                <div 
                    className="absolute top-0 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity duration-75 z-20"
                    style={{ left: `${hoverPos.x}%`, top: `${hoverPos.y}%`, marginTop: '-15px' }}
                >
                    <div className="real-glass px-4 py-2 rounded-xl text-center min-w-[120px] shadow-2xl bg-black/60 dark:bg-white/10 border border-white/20 backdrop-blur-xl">
                        <p className="text-xs text-gray-300 dark:text-gray-200 font-medium mb-1">{formatTime(activeIndex)}</p>
                        <p className="text-lg font-bold text-white tracking-tight">₹{data[activeIndex].toLocaleString('en-IN')}</p>
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/20 mx-auto"></div>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="min-h-screen transition-colors duration-500 font-sans pb-32">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 w-full real-glass z-50 px-6 py-4 flex justify-between items-center shadow-lg border-b border-white/10">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(255,255,255,0.5)] transform rotate-3">X</div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">CryptoX</h1>
        </div>
        <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
                <button 
                    onClick={handleProfileClick} 
                    className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 flex items-center justify-center transition backdrop-blur-md"
                >
                    <span className="text-xl">👤</span>
                </button>
                {showProfileMenu && (
                    <div className="absolute top-14 right-0 w-56 real-glass rounded-xl p-2 flex flex-col gap-1 animate-fade-in overflow-hidden shadow-2xl bg-white/80 dark:bg-black/80 border border-white/20">
                        <button onClick={() => router.push('/profile')} className="text-left px-4 py-3 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-sm font-bold transition text-gray-900 dark:text-white">My Profile</button>
                        <button onClick={handleLogout} className="text-left px-4 py-3 hover:bg-red-500/10 text-red-500 rounded-lg text-sm font-bold transition">Log out</button>
                    </div>
                )}
            </div>

            {/* Burger Menu */}
            <div className="relative" ref={burgerRef}>
                <button 
                    onClick={handleBurgerClick} 
                    className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 flex items-center justify-center transition backdrop-blur-md text-xl font-bold text-gray-900 dark:text-white"
                >
                    ☰
                </button>
                 {showBurgerMenu && (
                    <div className="absolute top-14 right-0 w-64 real-glass rounded-xl p-4 flex flex-col gap-2 animate-fade-in shadow-2xl bg-white/80 dark:bg-black/80 border border-white/20">
                        <div className="px-4 py-2 text-[10px] font-black tracking-widest opacity-50 uppercase text-gray-900 dark:text-white">System</div>
                        <button onClick={toggleTheme} className="text-left px-5 py-3 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg flex justify-between font-bold transition text-gray-900 dark:text-white">Theme <span>{isDarkMode ? 'Dark' : 'Light'}</span></button>
                        <div className="px-4 py-2 text-[10px] font-black tracking-widest opacity-50 uppercase mt-2 text-gray-900 dark:text-white">Assets</div>
                        <button onClick={() => router.push('/profile')} className="text-left px-5 py-3 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg font-bold transition text-gray-900 dark:text-white">Portfolio</button>
                        <button onClick={() => router.push('/payment')} className="text-left px-5 py-3 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg font-bold transition text-gray-900 dark:text-white">Orders</button>
                    </div>
                )}
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mt-12 mb-12 flex flex-col items-center gap-6 animate-fade-in relative z-10 px-4">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-center opacity-90 drop-shadow-lg text-gray-900 dark:text-white">Market<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Overview</span></h2>
          <div className="real-glass p-2 rounded-full flex items-center w-full max-w-lg shadow-xl border border-gray-200 dark:border-white/20 bg-white/40 dark:bg-black/40">
              <span className="pl-6 text-xl opacity-50 text-gray-900 dark:text-white">🔍</span>
              <input type="text" placeholder="Find asset..." className="w-full p-4 bg-transparent outline-none text-lg font-bold placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-4">
              <button onClick={() => setSortOrder('default')} className={`px-6 py-2 rounded-full text-sm font-bold border transition ${sortOrder === 'default' ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'border-gray-400 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-white'}`}>Hot</button>
              <button onClick={() => setSortOrder('low')} className={`px-6 py-2 rounded-full text-sm font-bold border transition ${sortOrder === 'low' ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'border-gray-400 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-white'}`}>Cheap</button>
              <button onClick={() => setSortOrder('high')} className={`px-6 py-2 rounded-full text-sm font-bold border transition ${sortOrder === 'high' ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'border-gray-400 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-white'}`}>Expensive</button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto relative z-10 px-4">
        {getFilteredAndSortedCoins().map((coin, index) => {
            const isUp = coin.price_change_percentage_24h >= 0;
            return (
                <div 
                    key={coin.id} 
                    onClick={() => setSelectedCoin(coin)} 
                    className="real-glass p-6 rounded-[2rem] glass-hover-card flex flex-col justify-between h-[360px] relative overflow-hidden group border border-white/20 shadow-lg bg-white/20 dark:bg-black/40 cursor-pointer" 
                    style={{animationDelay: `${index * 50}ms`}}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-all group-hover:scale-150 pointer-events-none"></div>
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <img src={coin.image} alt={coin.name} className="w-16 h-16 rounded-full drop-shadow-xl bg-white p-1" />
                            <span className={`text-sm font-black px-4 py-2 rounded-full border ${isUp ? 'border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10'}`}>
                                {coin.price_change_percentage_24h?.toFixed(2)}%
                            </span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{coin.name}</h2>
                        <p className="text-4xl font-thin mt-2 tracking-tighter opacity-80 text-gray-800 dark:text-gray-200">₹{coin.current_price.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-auto z-10">
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center bg-gray-200/50 dark:bg-white/5 rounded-full p-1 backdrop-blur-sm border border-gray-300 dark:border-white/10">
                            <button onClick={(e) => adjustLocalQuantity(e, coin.id, -1)} className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/20 rounded-full font-bold text-xl transition text-gray-800 dark:text-white">-</button>
                            <input type="number" className="w-12 bg-transparent text-center font-bold outline-none text-gray-900 dark:text-white" value={localQuantities[coin.id] || 1} onChange={(e) => handleManualQuantity(e, coin.id, e.target.value)} onClick={(e) => e.stopPropagation()} />
                            <button onClick={(e) => adjustLocalQuantity(e, coin.id, 1)} className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/20 rounded-full font-bold text-xl transition text-gray-800 dark:text-white">+</button>
                        </div>
                        <button onClick={(e) => addItemToCart(e, coin)} className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition active:scale-95 text-3xl font-bold">
                            +
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
      
      {/* GRAPH MODAL */}
      {selectedCoin && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] animate-fade-in p-4" onClick={() => setSelectedCoin(null)}>
              <div className="real-glass p-8 md:p-12 rounded-[3rem] w-full max-w-4xl border border-white/20 shadow-2xl relative bg-white/10 dark:bg-black/40" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setSelectedCoin(null)} className="absolute top-6 right-8 text-4xl text-gray-500 hover:text-white transition">×</button>
                  <div className="flex items-center gap-6 mb-8">
                      <img src={selectedCoin.image} className="w-24 h-24 rounded-full drop-shadow-2xl bg-white p-2" />
                      <div>
                          <h2 className="text-4xl md:text-5xl font-black text-white">{selectedCoin.name}</h2>
                          <p className="text-2xl text-gray-300 uppercase tracking-widest">{selectedCoin.symbol}</p>
                      </div>
                  </div>
                  <div className="h-64 md:h-80 w-full bg-black/20 rounded-3xl p-6 border border-white/5 shadow-inner">
                      <InteractiveGraph data={selectedCoin.sparkline_in_7d?.price} color={selectedCoin.price_change_percentage_24h >= 0 ? '#4ade80' : '#f87171'} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-400 uppercase">Current Price</p>
                          <p className="text-xl font-bold text-white">₹{selectedCoin.current_price.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-400 uppercase">24h Change</p>
                          <p className={`text-xl font-bold ${selectedCoin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>{selectedCoin.price_change_percentage_24h?.toFixed(2)}%</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-400 uppercase">Market Cap</p>
                          <p className="text-xl font-bold text-white">₹{(selectedCoin.market_cap / 10000000).toLocaleString('en-IN')} Cr</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-400 uppercase">Volume (24h)</p>
                          <p className="text-xl font-bold text-white">₹{(selectedCoin.total_volume / 10000000).toLocaleString('en-IN')} Cr</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Floating Cart */}
      <button onClick={() => router.push('/payment')} className="fixed bottom-10 right-10 w-20 h-20 real-glass rounded-full flex items-center justify-center z-50 hover:scale-110 transition shadow-2xl border border-white/30 group bg-white/20 dark:bg-black/50 backdrop-blur-xl">
        <span className="text-3xl group-hover:animate-bounce">📦</span>
        {shoppingCart.length > 0 && <span className="absolute top-0 right-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white dark:border-black text-white">{shoppingCart.reduce((a, b) => a + b.amount, 0)}</span>}
      </button>

      {/* Welcome Modal */}
      {showWelcomeCartModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in">
          <div className="real-glass p-10 rounded-[3rem] max-w-md text-center border border-white/20 shadow-2xl bg-white/90 dark:bg-black/80">
            <h2 className="text-4xl font-black mb-4 text-gray-900 dark:text-white">Resume?</h2>
            <p className="opacity-60 mb-8 text-lg text-gray-600 dark:text-gray-300">You left items in your pending order.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => router.push('/payment')} className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[2rem] font-bold text-xl hover:scale-105 transition shadow-xl">Go to Orders</button>
              <button onClick={() => setShowWelcomeCartModal(false)} className="w-full py-5 hover:bg-black/5 dark:hover:bg-white/10 rounded-[2rem] font-bold opacity-60 text-gray-900 dark:text-white">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white tracking-widest font-bold">INITIALIZING...</div>}><DashboardContent /></Suspense>;
}