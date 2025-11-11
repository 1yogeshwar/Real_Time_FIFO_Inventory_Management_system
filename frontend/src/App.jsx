// import React, { useState, useEffect } from 'react';
// import { 
//   BarChart3, Package, TrendingUp, Activity, LogOut, Play, RefreshCw,
//   ShoppingCart, DollarSign, Clock, AlertCircle
// } from 'lucide-react';

// const API_BASE_URL = 'http://localhost:5000/api';

// const api = {
//   login: async (username, password) => {
//     const res = await fetch(`${API_BASE_URL}/auth/login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ username, password })
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//     return data;
//   },

//   getInventory: async (token) => {
//     const res = await fetch(`${API_BASE_URL}/inventory/status`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//     return data;
//   },

//   getTransactions: async (token) => {
//     const res = await fetch(`${API_BASE_URL}/inventory/transactions?limit=100`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//     return data;
//   },

//   simulateEvents: async (token, events) => {
//     const res = await fetch(`${API_BASE_URL}/inventory/simulate`, {
//       method: 'POST',
//       headers: { 
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}` 
//       },
//       body: JSON.stringify({ events })
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//     return data;
//   }
// };

// const Dashboard = ({ token, user, onLogout }) => {
//   const [inventory, setInventory] = useState([]);
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [simulating, setSimulating] = useState(false);
//   const [lastUpdate, setLastUpdate] = useState(new Date());
//   const [error, setError] = useState('');

//   const fetchData = async () => {
//     try {
//       setError('');
//       const [invData, txData] = await Promise.all([
//         api.getInventory(token),
//         api.getTransactions(token)
//       ]);
//       if (invData.success) setInventory(invData.data);
//       if (txData.success) setTransactions(txData.data);
//       setLastUpdate(new Date());
//     } catch (err) {
//       console.error('Error fetching data:', err);
//       setError(err.message);
//       if (err.message.includes('401')) {
//         setTimeout(() => onLogout(), 2000);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     const interval = setInterval(fetchData, 5000);
//     return () => clearInterval(interval);
//   }, [token]);

//   const handleSimulate = async () => {
//     setSimulating(true);
//     setError('');
//     try {
//       const events = generateSampleEvents();
//       await api.simulateEvents(token, events);
//       setTimeout(fetchData, 2000);
//     } catch (err) {
//       console.error('Simulation error:', err);
//       setError(err.message);
//     } finally {
//       setSimulating(false);
//     }
//   };

//   const totalValue = inventory.reduce((sum, item) => sum + parseFloat(item.total_cost || 0), 0);
//   const totalItems = inventory.reduce((sum, item) => sum + parseInt(item.current_quantity || 0), 0);
//   const avgCost = totalItems > 0 ? totalValue / totalItems : 0;

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//         <div className="text-center">
//           <RefreshCw className="w-16 h-16 text-slate-600 animate-spin mx-auto mb-4" />
//           <p className="text-slate-600 text-lg font-medium">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50">
//       {/* Header */}
//       <header className="bg-white border-b border-slate-200">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-4">
//               <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
//                 <Package className="w-7 h-7 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900">FlowStock</h1>
//                 <p className="text-sm text-slate-500">Real-Time FIFO Inventory Management</p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="text-right mr-2">
//                 <p className="text-xs text-slate-500">Logged in as</p>
//                 <p className="text-sm font-semibold text-slate-700">{user.username}</p>
//               </div>
//               <button
//                 onClick={onLogout}
//                 className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
//               >
//                 <LogOut className="w-4 h-4" />
//                 <span className="font-medium">Logout</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         {/* Error Alert */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r">
//             <div className="flex items-center">
//               <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
//               <div>
//                 <p className="text-sm font-semibold text-red-800">Error</p>
//                 <p className="text-sm text-red-700">{error}</p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Stats Overview */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//           <StatCard 
//             title="Total Products" 
//             value={inventory.length} 
//             icon={<Package className="w-6 h-6" />} 
//             color="slate"
//             subtitle="Unique SKUs"
//           />
//           <StatCard 
//             title="Total Units" 
//             value={totalItems.toLocaleString()} 
//             icon={<ShoppingCart className="w-6 h-6" />} 
//             color="emerald"
//             subtitle="In stock"
//           />
//           <StatCard 
//             title="Inventory Value" 
//             value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
//             icon={<DollarSign className="w-6 h-6" />} 
//             color="blue"
//             subtitle="Total worth"
//           />
//           <StatCard 
//             title="Avg Unit Cost" 
//             value={`$${avgCost.toFixed(2)}`}
//             icon={<TrendingUp className="w-6 h-6" />} 
//             color="amber"
//             subtitle="Per item"
//           />
//         </div>

//         {/* Control Panel */}
//         <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h3 className="text-lg font-bold text-slate-900 mb-1">Event Simulator</h3>
//               <p className="text-sm text-slate-600">Generate sample purchase and sale transactions</p>
//             </div>
//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={fetchData}
//                 className="flex items-center space-x-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
//               >
//                 <RefreshCw className="w-4 h-4" />
//                 <span className="font-medium">Refresh</span>
//               </button>
//               <button
//                 onClick={handleSimulate}
//                 disabled={simulating}
//                 className="flex items-center space-x-2 px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Play className="w-4 h-4" />
//                 <span className="font-medium">{simulating ? 'Processing...' : 'Run Simulation'}</span>
//               </button>
//             </div>
//           </div>
//           <div className="flex items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
//             <Clock className="w-3.5 h-3.5 mr-1.5" />
//             Last updated: {lastUpdate.toLocaleString()}
//           </div>
//         </div>

//         {/* Inventory Table */}
//         <div className="bg-white rounded-lg border border-slate-200 mb-8 overflow-hidden">
//           <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
//             <h2 className="text-lg font-bold text-slate-900 flex items-center">
//               <Activity className="w-5 h-5 mr-2 text-slate-600" />
//               Current Inventory
//             </h2>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-slate-50 border-b border-slate-200">
//                   <th className="text-left py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Product ID</th>
//                   <th className="text-left py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Product Name</th>
//                   <th className="text-right py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Quantity</th>
//                   <th className="text-right py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Cost</th>
//                   <th className="text-right py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Avg Cost/Unit</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {inventory.length === 0 ? (
//                   <tr>
//                     <td colSpan={5} className="text-center py-12 text-slate-500">
//                       <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
//                       <p className="font-medium">No inventory data available</p>
//                       <p className="text-sm mt-1">Use the simulator to generate sample events</p>
//                     </td>
//                   </tr>
//                 ) : (
//                   inventory.map((item, i) => (
//                     <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
//                       <td className="py-4 px-6 text-sm font-medium text-slate-900">{item.product_id}</td>
//                       <td className="py-4 px-6 text-sm text-slate-700">{item.name}</td>
//                       <td className="py-4 px-6 text-sm text-right font-medium text-slate-900">{item.current_quantity}</td>
//                       <td className="py-4 px-6 text-sm text-right text-slate-700">${parseFloat(item.total_cost).toFixed(2)}</td>
//                       <td className="py-4 px-6 text-sm text-right text-slate-700">${parseFloat(item.average_cost_per_unit).toFixed(2)}</td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Transaction Ledger */}
//         <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
//           <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
//             <h2 className="text-lg font-bold text-slate-900 flex items-center">
//               <BarChart3 className="w-5 h-5 mr-2 text-slate-600" />
//               Transaction Ledger
//             </h2>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-slate-50 border-b border-slate-200">
//                   <th className="text-left py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Timestamp</th>
//                   <th className="text-left py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Product</th>
//                   <th className="text-left py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
//                   <th className="text-right py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Quantity</th>
//                   <th className="text-right py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Unit Price</th>
//                   <th className="text-right py-3 px-6 text-xs font-semibold text-slate-700 uppercase tracking-wider">Total</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {transactions.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="text-center py-12 text-slate-500">
//                       <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
//                       <p className="font-medium">No transactions recorded</p>
//                       <p className="text-sm mt-1">Transaction history will appear here</p>
//                     </td>
//                   </tr>
//                 ) : (
//                   transactions.map((tx, i) => (
//                     <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
//                       <td className="py-4 px-6 text-xs text-slate-600">{new Date(tx.transaction_time).toLocaleString()}</td>
//                       <td className="py-4 px-6 text-sm font-medium text-slate-900">{tx.product_id}</td>
//                       <td className="py-4 px-6">
//                         <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
//                           tx.transaction_type === 'purchase' 
//                             ? 'bg-emerald-100 text-emerald-800' 
//                             : 'bg-blue-100 text-blue-800'
//                         }`}>
//                           {tx.transaction_type}
//                         </span>
//                       </td>
//                       <td className="py-4 px-6 text-sm text-right font-medium text-slate-900">{tx.quantity}</td>
//                       <td className="py-4 px-6 text-sm text-right text-slate-700">
//                         {tx.unit_price ? `$${tx.unit_price.toFixed(2)}` : '—'}
//                       </td>
//                       <td className="py-4 px-6 text-sm text-right font-medium text-slate-900">
//                         ${parseFloat(tx.total_cost).toFixed(2)}
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const StatCard = ({ title, value, icon, color, subtitle }) => {
//   const colorClasses = {
//     slate: 'bg-slate-100 text-slate-700',
//     emerald: 'bg-emerald-100 text-emerald-700',
//     blue: 'bg-blue-100 text-blue-700',
//     amber: 'bg-amber-100 text-amber-700'
//   };

//   return (
//     <div className="bg-white rounded-lg border border-slate-200 p-6">
//       <div className="flex items-start justify-between mb-3">
//         <div className="flex-1">
//           <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
//           <p className="text-3xl font-bold text-slate-900">{value}</p>
//           {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
//         </div>
//         <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
//           {icon}
//         </div>
//       </div>
//     </div>
//   );
// };

// const generateSampleEvents = () => {
//   const now = new Date();
//   return [
//     { product_id: 'PRD001', event_type: 'purchase', quantity: 100, unit_price: 50.0, timestamp: new Date(now.getTime() - 5000).toISOString() },
//     { product_id: 'PRD002', event_type: 'purchase', quantity: 200, unit_price: 30.0, timestamp: new Date(now.getTime() - 4000).toISOString() },
//     { product_id: 'PRD003', event_type: 'purchase', quantity: 150, unit_price: 75.0, timestamp: new Date(now.getTime() - 3000).toISOString() },
//     { product_id: 'PRD001', event_type: 'purchase', quantity: 50, unit_price: 55.0, timestamp: new Date(now.getTime() - 2000).toISOString() },
//     { product_id: 'PRD001', event_type: 'sale', quantity: 60, timestamp: new Date(now.getTime() - 1000).toISOString() },
//     { product_id: 'PRD002', event_type: 'sale', quantity: 80, timestamp: now.toISOString() },
//   ];
// };

// const Login = ({ onLogin }) => {
//   const [username, setUsername] = useState('admin');
//   const [password, setPassword] = useState('admin123');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async () => {
//     setError('');
//     setLoading(true);
//     try {
//       const result = await api.login(username, password);
//       if (result.success && result.token) {
//         onLogin(result.token, result.user);
//       } else {
//         setError(result.error || 'Login failed');
//       }
//     } catch (err) {
//       console.error('Login error:', err);
//       setError(err.message || 'Connection error. Check if backend is running.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       handleSubmit();
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
//       <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 w-full max-w-md">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-lg mb-4">
//             <Package className="w-9 h-9 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-slate-900 mb-2">FlowStock</h1>
//           <p className="text-slate-600">Real-Time FIFO Inventory Management</p>
//         </div>

//         <div className="space-y-5">
//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
//             <input
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               onKeyPress={handleKeyPress}
//               className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
//               placeholder="Enter username"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               onKeyPress={handleKeyPress}
//               className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
//               placeholder="Enter password"
//             />
//           </div>

//           {error && (
//             <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r">
//               <p className="text-sm text-red-800">{error}</p>
//             </div>
//           )}

//           <button
//             onClick={handleSubmit}
//             disabled={loading}
//             className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Signing in...' : 'Sign In'}
//           </button>

//           <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
//             <p className="mb-1">Default credentials</p>
//             <p className="font-mono text-xs bg-slate-50 py-2 px-3 rounded border border-slate-200">
//               admin / admin123
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function App() {
//   const [token, setToken] = useState(null);
//   const [user, setUser] = useState(null);

//   const handleLogin = (newToken, userData) => {
//     setToken(newToken);
//     setUser(userData);
//   };

//   const handleLogout = () => {
//     setToken(null);
//     setUser(null);
//   };

//   if (!token) return <Login onLogin={handleLogin} />;
//   return <Dashboard token={token} user={user} onLogout={handleLogout} />;
// }
//tailwind css
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Package, TrendingUp, Activity, LogOut, Play, RefreshCw,
  ShoppingCart, DollarSign, Clock, AlertCircle
} from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

const api = {
  login: async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  getInventory: async (token) => {
    const res = await fetch(`${API_BASE_URL}/inventory/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  getTransactions: async (token) => {
    const res = await fetch(`${API_BASE_URL}/inventory/transactions?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  simulateEvents: async (token, events) => {
    const res = await fetch(`${API_BASE_URL}/inventory/simulate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ events })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }
};

const Dashboard = ({ token, user, onLogout }) => {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setError('');
      const [invData, txData] = await Promise.all([
        api.getInventory(token),
        api.getTransactions(token)
      ]);
      if (invData.success) setInventory(invData.data);
      if (txData.success) setTransactions(txData.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      if (err.message.includes('401')) {
        setTimeout(() => onLogout(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleSimulate = async () => {
    setSimulating(true);
    setError('');
    try {
      const events = generateSampleEvents();
      await api.simulateEvents(token, events);
      setTimeout(fetchData, 2000);
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  const totalValue = inventory.reduce((sum, item) => sum + parseFloat(item.total_cost || 0), 0);
  const totalItems = inventory.reduce((sum, item) => sum + parseInt(item.current_quantity || 0), 0);
  const avgCost = totalItems > 0 ? totalValue / totalItems : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <RefreshCw className="loading-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-icon">
              <Package className="icon-xl" />
            </div>
            <div className="brand-text">
              <h1>FlowStock</h1>
              <p>Real-Time FIFO Inventory Management</p>
            </div>
          </div>
          <div className="header-user">
            <div className="user-info">
              <p>Logged in as</p>
              <p>{user.username}</p>
            </div>
            <button onClick={onLogout} className="btn btn-logout">
              <LogOut className="icon-sm" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        {error && (
          <div className="alert">
            <AlertCircle className="alert-icon icon-md" />
            <div className="alert-content">
              <h4>Error</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <StatCard 
            title="Total Products" 
            value={inventory.length} 
            icon={<Package className="icon-lg" />} 
            color="slate"
            subtitle="Unique SKUs"
          />
          <StatCard 
            title="Total Units" 
            value={totalItems.toLocaleString()} 
            icon={<ShoppingCart className="icon-lg" />} 
            color="emerald"
            subtitle="In stock"
          />
          <StatCard 
            title="Inventory Value" 
            value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="icon-lg" />} 
            color="blue"
            subtitle="Total worth"
          />
          <StatCard 
            title="Avg Unit Cost" 
            value={`$${avgCost.toFixed(2)}`}
            icon={<TrendingUp className="icon-lg" />} 
            color="amber"
            subtitle="Per item"
          />
        </div>

        <div className="control-panel">
          <div className="control-header">
            <div>
              <h3>Event Simulator</h3>
              <p>Generate sample purchase and sale transactions</p>
            </div>
            <div className="control-actions">
              <button onClick={fetchData} className="btn btn-secondary">
                <RefreshCw className="icon-sm" />
                <span>Refresh</span>
              </button>
              <button onClick={handleSimulate} disabled={simulating} className="btn btn-primary">
                <Play className="icon-sm" />
                <span>{simulating ? 'Processing...' : 'Run Simulation'}</span>
              </button>
            </div>
          </div>
          <div className="control-footer">
            <Clock className="icon-sm" />
            Last updated: {lastUpdate.toLocaleString()}
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <h2>
              <Activity className="icon-md" />
              Current Inventory
            </h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Total Cost</th>
                  <th className="text-right">Avg Cost/Unit</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <Package />
                        <p>No inventory data available</p>
                        <p>Use the simulator to generate sample events</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventory.map((item, i) => (
                    <tr key={i}>
                      <td className="font-medium">{item.product_id}</td>
                      <td>{item.name}</td>
                      <td className="text-right font-medium">{item.current_quantity}</td>
                      <td className="text-right">${parseFloat(item.total_cost).toFixed(2)}</td>
                      <td className="text-right">${parseFloat(item.average_cost_per_unit).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <h2>
              <BarChart3 className="icon-md" />
              Transaction Ledger
            </h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Clock />
                        <p>No transactions recorded</p>
                        <p>Transaction history will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.75rem' }}>{new Date(tx.transaction_time).toLocaleString()}</td>
                      <td className="font-medium">{tx.product_id}</td>
                      <td>
                        <span className={`badge ${tx.transaction_type}`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="text-right font-medium">{tx.quantity}</td>
                      <td className="text-right">
                        {tx.unit_price != null ? `${parseFloat(tx.unit_price).toFixed(2)}` : '—'}
                      </td>
                      <td className="text-right font-medium">
                        ${parseFloat(tx.total_cost).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <div>
        <p className="stat-card-title">{title}</p>
        <p className="stat-card-value">{value}</p>
        {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
      </div>
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const generateSampleEvents = () => {
  const now = new Date();
  return [
    { product_id: 'PRD001', event_type: 'purchase', quantity: 100, unit_price: 50.0, timestamp: new Date(now.getTime() - 5000).toISOString() },
    { product_id: 'PRD002', event_type: 'purchase', quantity: 200, unit_price: 30.0, timestamp: new Date(now.getTime() - 4000).toISOString() },
    { product_id: 'PRD003', event_type: 'purchase', quantity: 150, unit_price: 75.0, timestamp: new Date(now.getTime() - 3000).toISOString() },
    { product_id: 'PRD001', event_type: 'purchase', quantity: 50, unit_price: 55.0, timestamp: new Date(now.getTime() - 2000).toISOString() },
    { product_id: 'PRD001', event_type: 'sale', quantity: 60, timestamp: new Date(now.getTime() - 1000).toISOString() },
    { product_id: 'PRD002', event_type: 'sale', quantity: 80, timestamp: now.toISOString() },
  ];
};

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await api.login(username, password);
      if (result.success && result.token) {
        onLogin(result.token, result.user);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Connection error. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Package style={{ width: '36px', height: '36px' }} />
          </div>
          <h1>FlowStock</h1>
          <p>Real-Time FIFO Inventory Management</p>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="alert">
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="login-credentials">
            <p>Default credentials</p>
            <p>admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  if (!token) return <Login onLogin={handleLogin} />;
  return <Dashboard token={token} user={user} onLogout={handleLogout} />;
}