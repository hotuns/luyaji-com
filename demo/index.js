import React, { useState, useEffect, useMemo } from 'react';
import { 
  Fish, MapPin, Anchor, BookOpen, User, Plus, 
  Calendar, Cloud, Wind, Thermometer, ChevronRight, 
  Trophy, Settings, LogOut, Map as MapIcon, List,
  Smartphone, Search, Navigation, Droplets, Menu
} from 'lucide-react';

/**
 * MOCK DATA & CONSTANTS
 */
const FISH_DATABASE = [
  { id: 'f1', name: '大口黑鲈', scientific: 'Micropterus salmoides', image: '🐟', rarity: 1 },
  { id: 'f2', name: '鳜鱼', scientific: 'Siniperca chuatsi', image: '🐠', rarity: 2 },
  { id: 'f3', name: '翘嘴鲌', scientific: 'Culter alburnus', image: '🦈', rarity: 1 },
  { id: 'f4', name: '黑鱼', scientific: 'Channa argus', image: '🐡', rarity: 1 },
  { id: 'f5', name: '鳡鱼', scientific: 'Elopichthys bambusa', image: '🐊', rarity: 3 },
  { id: 'f6', name: '马口', scientific: 'Opsariichthys bidens', image: '🎣', rarity: 1 },
  { id: 'f7', name: '赤眼鳟', scientific: 'Squaliobarbus curriculus', image: '🐟', rarity: 2 },
  { id: 'f8', name: '罗非鱼', scientific: 'Oreochromis mossambicus', image: '🐠', rarity: 1 },
];

const INITIAL_RODS = [
  { id: 'r1', name: '佐迪亚斯 264L', brand: 'Shimano', length: '1.93m', power: 'L', lure: '3-10g' },
  { id: 'r2', name: '黑标 SG 6101M', brand: 'Daiwa', length: '2.08m', power: 'M', lure: '5-21g' },
  { id: 'r3', name: '世界煞那 270M-2', brand: 'Shimano', length: '2.13m', power: 'M', lure: '7-20g' },
];

const INITIAL_REELS = [
  { id: 'rl1', name: 'Stradic 2500SHG', brand: 'Shimano', ratio: '6.0:1', capacity: 'PE 0.8/150m' },
  { id: 'rl2', name: 'Tatula SV TW', brand: 'Daiwa', ratio: '7.1:1', capacity: '12lb/80m' },
];

const INITIAL_COMBOS = [
  { id: 'c1', name: '泛用精细直柄', rodId: 'r1', reelId: 'rl1', line: '0.6号 PE + 2.0号 碳前导', scene: '倒钓, 小米诺' },
];

const INITIAL_TRIPS = [
  {
    id: 't1',
    title: '周六淀山湖晨练',
    date: '2023-10-24',
    startTime: '06:00',
    endTime: '10:00',
    location: '淀山湖西岸',
    weather: '多云',
    temp: '22°C',
    catches: [
      { speciesId: 'f1', count: 3, maxLength: 35 },
      { speciesId: 'f3', count: 1, maxLength: 40 },
    ],
    note: '窗口期很短，主要靠障碍区倒钓。'
  },
  {
    id: 't2',
    title: '夜战城市河道',
    date: '2023-10-20',
    startTime: '19:00',
    endTime: '21:30',
    location: '苏州河段',
    weather: '晴',
    temp: '18°C',
    catches: [
      { speciesId: 'f2', count: 1, maxLength: 28 },
    ],
    note: '水位较低，结构区有一口。'
  },
  {
    id: 't3',
    title: '千岛湖探钓',
    date: '2023-10-15',
    startTime: '07:00',
    endTime: '16:00',
    location: '千岛湖',
    weather: '小雨',
    temp: '20°C',
    catches: [
      { speciesId: 'f3', count: 5, maxLength: 65 },
      { speciesId: 'f1', count: 2, maxLength: 30 },
    ],
    note: '全天窗口期，水面系炸裂。'
  }
];

const INITIAL_USER = {
  name: '路亚新手',
  phone: '138****8888',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  joinDate: '2023-01-15'
};

/**
 * UI COMPONENTS
 */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon }) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all active:scale-95 duration-200";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

/**
 * MAIN APP COMPONENT
 */
export default function LuyaJiApp() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(INITIAL_USER);

  // App Data State
  const [activeTab, setActiveTab] = useState('home');
  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [rods, setRods] = useState(INITIAL_RODS);
  const [reels, setReels] = useState(INITIAL_REELS);
  const [combos, setCombos] = useState(INITIAL_COMBOS);
  const [showModal, setShowModal] = useState(null); // 'trip', 'gear', etc.

  // Derived Stats
  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const totalFish = trips.reduce((acc, trip) => acc + trip.catches.reduce((c, item) => c + item.count, 0), 0);
    const unlockedSpeciesIds = new Set(trips.flatMap(t => t.catches.map(c => c.speciesId)));
    const unlockedCount = unlockedSpeciesIds.size;
    const totalSpecies = FISH_DATABASE.length;
    
    return { totalTrips, totalFish, unlockedCount, totalSpecies };
  }, [trips]);

  // Unlock Status for Dex
  const getSpeciesStatus = (speciesId) => {
    const catchRecords = [];
    trips.forEach(trip => {
      const match = trip.catches.find(c => c.speciesId === speciesId);
      if (match) {
        catchRecords.push({ date: trip.date, count: match.count, max: match.maxLength });
      }
    });
    
    if (catchRecords.length === 0) return { unlocked: false };
    
    const totalCaught = catchRecords.reduce((sum, r) => sum + r.count, 0);
    const maxLen = Math.max(...catchRecords.map(r => r.max || 0));
    const firstCatch = catchRecords.sort((a,b) => new Date(a.date) - new Date(b.date))[0];

    return { unlocked: true, total: totalCaught, maxLen, firstDate: firstCatch.date };
  };

  /**
   * VIEW: AUTH
   */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-600 to-blue-500 rounded-b-[100%] scale-x-150 shadow-2xl z-0"></div>
        <div className="absolute top-20 right-20 text-blue-400 opacity-20 hidden md:block"><Fish size={200} /></div>
        
        <div className="z-10 w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Anchor size={40} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">路亚记</h1>
            <p className="text-slate-500 mt-2">记录每一次抛投的期待</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">手机号 / 昵称</label>
              <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="请输入账号" defaultValue="路亚新手" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">密码</label>
              <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="******" defaultValue="123456" />
            </div>
            <Button className="w-full py-3 mt-4" onClick={() => setIsAuthenticated(true)}>
              立即登录
            </Button>
            <p className="text-center text-xs text-slate-400 mt-4">
              还没有账号? <span className="text-blue-600 cursor-pointer hover:underline">立即注册</span>
            </p>
          </div>
        </div>
        
        <p className="absolute bottom-6 text-slate-400 text-xs">© 2024 LuyaJi App. All rights reserved.</p>
      </div>
    );
  }

  /**
   * VIEW: DASHBOARD (HOME)
   */
  const HomeView = () => (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">早安，{user.name} 👋</h2>
          <p className="text-slate-500 text-sm mt-1">今天适合去抛两杆吗？</p>
        </div>
        <div className="hidden md:block">
           <Button icon={Plus} onClick={() => { setActiveTab('trips'); setShowModal('addTrip'); }}>记录出击</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 md:grid-cols-3">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none flex flex-col justify-between h-32 md:h-40">
          <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
             <MapPin size={16}/> <span>总出击</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold">{stats.totalTrips} <span className="text-lg font-normal opacity-70">次</span></div>
        </Card>
        <Card className="p-4 md:p-6 bg-white flex flex-col justify-between h-32 md:h-40">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
             <Fish size={16}/> <span>总渔获</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-slate-800">{stats.totalFish} <span className="text-lg font-normal text-slate-400">尾</span></div>
        </Card>
        <Card className="p-4 md:p-6 bg-white flex flex-col justify-between h-32 md:h-40">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
             <BookOpen size={16}/> <span>解锁图鉴</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-slate-800">{stats.unlockedCount}<span className="text-slate-300 text-lg mx-1">/</span><span className="text-lg text-slate-400">{stats.totalSpecies}</span></div>
        </Card>
      </div>

      {/* Quick Action (Mobile Only mostly, or secondary on desktop) */}
      <div className="grid grid-cols-2 gap-4 md:hidden">
        <button onClick={() => { setActiveTab('trips'); setShowModal('addTrip'); }} className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors">
          <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700">
            <Plus size={20} />
          </div>
          <div className="text-left">
            <div className="font-bold text-sm">记录出击</div>
            <div className="text-xs opacity-70">添加新行程</div>
          </div>
        </button>
        <button onClick={() => { setActiveTab('gear'); }} className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-colors">
          <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700">
            <Settings size={20} />
          </div>
          <div className="text-left">
            <div className="font-bold text-sm">整理装备</div>
            <div className="text-xs opacity-70">管理竿轮</div>
          </div>
        </button>
      </div>

      {/* Recent Trips */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-bold text-lg md:text-xl text-slate-800">最近出击</h3>
          <button onClick={() => setActiveTab('trips')} className="text-xs md:text-sm text-blue-600 font-medium flex items-center hover:underline">全部记录 <ChevronRight size={14}/></button>
        </div>
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {trips.slice(0, 3).map(trip => (
            <TripCard key={trip.id} trip={trip} simple />
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * VIEW: TRIPS
   */
  const TripCard = ({ trip, simple }) => (
    <Card className="group hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-800 text-lg truncate">{trip.title || trip.location}</span>
            <div className="flex items-center gap-2">
               <Badge color="blue">{trip.location}</Badge>
               <span className="text-xs text-slate-400 font-mono hidden md:inline-block">{trip.date}</span>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono md:hidden">{trip.date}</span>
        </div>
        
        {!simple && (
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
            <span className="flex items-center gap-1 justify-center"><Cloud size={14}/> {trip.weather}</span>
            <span className="flex items-center gap-1 justify-center"><Thermometer size={14}/> {trip.temp}</span>
            <span className="flex items-center gap-1 justify-center"><Wind size={14}/> {trip.endTime.split(':')[0] - trip.startTime.split(':')[0]}h</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-auto">
          {trip.catches.length > 0 ? (
            trip.catches.map((c, idx) => {
              const fish = FISH_DATABASE.find(f => f.id === c.speciesId);
              return (
                <div key={idx} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100">
                  <span>{fish?.image}</span>
                  <span className="font-medium">{fish?.name}</span>
                  <span className="bg-white/50 px-1.5 rounded-full ml-1 font-bold">x{c.count}</span>
                </div>
              );
            })
          ) : (
             <span className="text-xs text-slate-400 italic">空军 (此次无渔获)</span>
          )}
        </div>
      </div>
    </Card>
  );

  const TripView = () => (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">出击记录</h2>
        <div className="flex gap-2">
          <Button variant="secondary" className="px-3" icon={MapIcon}>地图视图</Button>
          <Button onClick={() => setShowModal('addTrip')} icon={Plus}>记一笔</Button>
        </div>
      </div>
      
      <div className="flex-1 pb-24 md:pb-8">
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
        </div>
        {trips.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <MapPin size={48} className="mx-auto mb-4 opacity-30"/>
            <p>还没有出击记录，快去钓鱼吧！</p>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * VIEW: GEAR
   */
  const GearView = () => {
    const [gearTab, setGearTab] = useState('rod');

    const GearItem = ({ title, sub, detail, icon: Icon }) => (
      <Card className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-l-4 border-l-transparent hover:border-l-blue-500">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 truncate">{title}</h4>
          <p className="text-xs text-slate-500 truncate">{sub}</p>
        </div>
        <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded whitespace-nowrap">
          {detail}
        </div>
      </Card>
    );

    return (
      <div className="space-y-6 pb-24 md:pb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">装备库</h2>
          
           {/* Custom Tabs */}
          <div className="flex p-1 bg-slate-200/60 rounded-xl md:w-auto w-full">
            {['rod', 'reel', 'combo'].map(t => (
              <button
                key={t}
                onClick={() => setGearTab(t)}
                className={`flex-1 md:flex-none md:w-24 py-2 text-sm font-medium rounded-lg transition-all ${gearTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {{ rod: '鱼竿', reel: '渔轮', combo: '组合' }[t]}
              </button>
            ))}
          </div>
          
          <Button variant="secondary" className="hidden md:flex h-10 text-xs" icon={Plus}>添加装备</Button>
          <Button variant="secondary" className="md:hidden w-full" icon={Plus}>添加</Button>
        </div>

        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {gearTab === 'rod' && rods.map(r => (
            <GearItem key={r.id} title={r.name} sub={r.brand} detail={`${r.length} | ${r.power}`} icon={Navigation} />
          ))}
          {gearTab === 'reel' && reels.map(r => (
            <GearItem key={r.id} title={r.name} sub={r.brand} detail={r.ratio} icon={Droplets} />
          ))}
          {gearTab === 'combo' && combos.map(c => {
             const r = rods.find(rod => rod.id === c.rodId);
             const rl = reels.find(reel => reel.id === c.reelId);
             return (
               <GearItem key={c.id} title={c.name} sub={`${r?.name} + ${rl?.name}`} detail={c.scene.split(',')[0]} icon={Anchor} />
             );
          })}
        </div>
      </div>
    );
  };

  /**
   * VIEW: DEX (POKEDEX)
   */
  const DexView = () => (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="bg-slate-900 text-white p-6 md:p-10 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-4xl font-bold mb-2">渔获图鉴</h2>
          <p className="text-slate-400 text-sm md:text-base mb-6">收集进度: <span className="text-white font-mono text-xl">{stats.unlockedCount}</span> <span className="mx-1">/</span> {stats.totalSpecies}</p>
          <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(stats.unlockedCount / stats.totalSpecies) * 100}%` }}></div>
          </div>
        </div>
        <Fish className="absolute -right-6 -bottom-6 text-slate-800 opacity-50" size={140} />
        <Fish className="absolute right-32 top-10 text-slate-800 opacity-20 hidden md:block" size={80} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {FISH_DATABASE.map(fish => {
          const status = getSpeciesStatus(fish.id);
          return (
            <div key={fish.id} className={`group relative p-4 rounded-xl border flex flex-col items-center text-center transition-all duration-300 ${status.unlocked ? 'bg-white border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-md' : 'bg-slate-50 border-slate-100 grayscale opacity-60'}`}>
              <div className="text-4xl md:text-5xl mb-3 filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300">{fish.image}</div>
              <div className="font-bold text-slate-800 text-sm">{status.unlocked ? fish.name : '???'}</div>
              <div className="text-[10px] text-slate-400 italic mb-2 h-3">{status.unlocked ? fish.scientific : ''}</div>
              
              {status.unlocked ? (
                <div className="w-full mt-2 pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>{status.maxLen}cm</span>
                  <span>{status.total}尾</span>
                </div>
              ) : (
                 <div className="mt-auto pt-2 text-[10px] text-slate-400 flex items-center gap-1">
                   <Trophy size={10} /> 待解锁
                 </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /**
   * VIEW: PROFILE
   */
  const ProfileView = () => (
    <div className="pb-24 md:pb-8 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Profile Card */}
        <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-6">
          <div className="relative inline-block shrink-0">
            <img src={user.avatar} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-blue-50" />
            <div className="absolute bottom-2 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white cursor-pointer hover:bg-blue-700">
              <Settings size={16} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
               <Badge color="slate">Lv. 5 钓鱼佬</Badge>
               <Badge color="blue">ID: 89757</Badge>
            </div>
            <p className="text-slate-400 text-sm mt-4">入坑时间: {user.joinDate}</p>
            <p className="text-slate-400 text-sm">个人简介：路亚是一种生活方式。</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100 shadow-sm">
          <div className="p-4 bg-slate-50 font-semibold text-slate-500 text-sm">账户设置</div>
          <div className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors">
             <span className="text-slate-600 flex items-center gap-3"><User size={18}/> 个人资料</span>
             <ChevronRight size={16} className="text-slate-300"/>
          </div>
          <div className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors">
             <span className="text-slate-600 flex items-center gap-3"><Smartphone size={18}/> 手机绑定</span>
             <span className="text-xs text-slate-400 mr-2">{user.phone}</span>
          </div>
          <div className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors">
             <span className="text-slate-600 flex items-center gap-3"><Settings size={18}/> 通用设置</span>
             <ChevronRight size={16} className="text-slate-300"/>
          </div>
        </div>

        <div className="space-y-4">
           <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
             <h3 className="font-bold text-blue-800 mb-2">Pro 会员</h3>
             <p className="text-sm text-blue-600 mb-4">解锁更多地图点位标记，导出高清数据报表。</p>
             <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none shadow-none">升级 Pro</Button>
           </div>
           
           <Button variant="danger" className="w-full bg-white border border-red-100 text-red-600 hover:bg-red-50" icon={LogOut} onClick={() => setIsAuthenticated(false)}>
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );

  /**
   * MODAL: ADD TRIP FORM
   */
  const AddTripModal = () => {
    const [formData, setFormData] = useState({ title: '', location: '', fishId: 'f1', count: 1 });

    const handleSubmit = () => {
      const newTrip = {
        id: `t${Date.now()}`,
        title: formData.title || '未知水域出击',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '12:00',
        location: formData.location || '秘密标点',
        weather: '晴',
        temp: '25°C',
        catches: [{ speciesId: formData.fishId, count: parseInt(formData.count), maxLength: 0 }],
        note: '新记录'
      };
      setTrips([newTrip, ...trips]);
      setShowModal(null);
    };

    return (
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">记录新出击</h3>
            <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">标题</label>
              <input 
                className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" 
                placeholder="例如：周末水库探钓" 
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">地点</label>
              <input 
                className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" 
                placeholder="地点名称"
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">主要渔获</label>
                 <select 
                    className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                    onChange={e => setFormData({...formData, fishId: e.target.value})}
                 >
                   {FISH_DATABASE.map(f => <option key={f.id} value={f.id}>{f.image} {f.name}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">数量</label>
                 <input 
                   type="number" 
                   className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" 
                   defaultValue={1}
                   onChange={e => setFormData({...formData, count: e.target.value})}
                 />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(null)}>取消</Button>
            <Button className="flex-1" onClick={handleSubmit}>保存记录</Button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * LAYOUT SHELL
   */
  const NavItem = ({ id, icon: Icon, label, mobileOnly }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${mobileOnly ? 'md:hidden flex-col justify-center space-y-1 py-0 w-full h-full rounded-none' : ''}
        ${activeTab === id 
          ? (mobileOnly ? 'text-blue-600' : 'bg-blue-50 text-blue-700 font-medium shadow-sm') 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      <Icon size={mobileOnly ? 20 : 22} strokeWidth={activeTab === id ? 2.5 : 2} />
      <span className={mobileOnly ? "text-[10px] font-medium" : "text-sm"}>{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 🖥️ DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 fixed h-full z-20 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
           <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
             <Anchor size={24} />
           </div>
           <div>
             <h1 className="font-bold text-xl tracking-tight text-slate-800">路亚记</h1>
             <p className="text-xs text-slate-400">Web App v1.0</p>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
           <NavItem id="home" icon={List} label="数据概览" />
           <NavItem id="trips" icon={MapPin} label="出击记录" />
           <NavItem id="gear" icon={Anchor} label="装备管理" />
           <NavItem id="dex" icon={BookOpen} label="渔获图鉴" />
           <div className="pt-4 mt-4 border-t border-slate-100">
             <NavItem id="profile" icon={User} label="个人中心" />
           </div>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
             <div className="flex-1 min-w-0">
               <div className="font-bold text-sm truncate">{user.name}</div>
               <div className="text-xs text-slate-400">Pro Member</div>
             </div>
             <Settings size={16} className="text-slate-400 cursor-pointer hover:text-slate-600"/>
          </div>
        </div>
      </aside>

      {/* 📱 MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col md:ml-64 relative min-h-screen transition-all duration-300">
        
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex justify-between items-center md:hidden">
          <div className="flex items-center gap-2 text-blue-600">
            <Anchor size={24} />
            <span className="font-bold text-lg tracking-tight">路亚记</span>
          </div>
          <img src={user.avatar} className="w-8 h-8 rounded-full border border-slate-200" onClick={() => setActiveTab('profile')} />
        </header>

        {/* Desktop Header (Breadcrumbs / Context) */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 justify-between items-center">
           <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <span className="text-slate-400">App</span>
              <ChevronRight size={14} />
              <span className="text-slate-800 font-bold">
                {activeTab === 'home' && '数据概览'}
                {activeTab === 'trips' && '出击记录'}
                {activeTab === 'gear' && '装备管理'}
                {activeTab === 'dex' && '渔获图鉴'}
                {activeTab === 'profile' && '个人中心'}
              </span>
           </div>
           <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"><Search size={20}/></button>
              <div className="h-6 w-px bg-slate-200"></div>
              <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
           </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-hide">
           <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300 slide-in-from-bottom-2">
              {activeTab === 'home' && <HomeView />}
              {activeTab === 'trips' && <TripView />}
              {activeTab === 'gear' && <GearView />}
              {activeTab === 'dex' && <DexView />}
              {activeTab === 'profile' && <ProfileView />}
           </div>
        </main>

        {/* 📱 Mobile Bottom Nav */}
        <nav className="sticky bottom-0 z-30 bg-white border-t border-slate-100 pb-safe md:hidden">
          <div className="flex justify-around items-center h-16">
            <NavItem id="home" icon={List} label="首页" mobileOnly />
            <NavItem id="trips" icon={MapPin} label="出击" mobileOnly />
            <NavItem id="gear" icon={Anchor} label="装备" mobileOnly />
            <NavItem id="dex" icon={BookOpen} label="图鉴" mobileOnly />
            <NavItem id="profile" icon={User} label="我的" mobileOnly />
          </div>
        </nav>

        {/* Modals */}
        {showModal === 'addTrip' && <AddTripModal />}
      </div>
    </div>
  );
}
