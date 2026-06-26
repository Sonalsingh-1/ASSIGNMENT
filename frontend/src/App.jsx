import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, WifiOff, RotateCcw, Database } from 'lucide-react';

function ConnectionGate({ status, error, onRetry }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (status !== 'connecting') return;
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'active') return null;

  return (
    <div className={`connection-gate-overlay ${status === 'connected' ? 'fade-out' : ''}`}>
      <div className="connection-card">
        {status === 'connecting' && (
          <>
            <div className="connection-logo">📦</div>
            <h2 className="connection-title">Stellar Inventory</h2>
            <div className="cyber-scanner">
              <div className="cyber-scanner-core">
                <Database size={28} />
              </div>
            </div>
            <div className="connection-status-text">
              Establishing connection to Control Center{dots}
            </div>
          </>
        )}

        {status === 'connected' && (
          <>
            <div className="connection-logo">🚀</div>
            <h2 className="connection-title">Access Granted</h2>
            <div className="cyber-scanner" style={{ borderColor: 'var(--success)' }}>
              <div className="success-checkmark">
                <svg className="checkmark-svg" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="25" fill="none" />
                  <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
            </div>
            <div className="connection-status-text" style={{ color: 'var(--success)' }}>
              Secure handshake successful. Syncing assets...
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="connection-logo">⚠️</div>
            <h2 className="connection-title" style={{ color: 'var(--danger)' }}>Connection Offline</h2>
            <div className="error-icon-wrapper">
              <WifiOff size={32} />
            </div>
            <div className="connection-status-text">
              Unable to sync with Stellar Control Center.
            </div>
            
            <button className="btn btn-primary" onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto 1.5rem' }}>
              <RotateCcw size={16} /> Retry Connection
            </button>

            <div className="troubleshoot-drawer">
              <div className="troubleshoot-title">Troubleshooting Checklist:</div>
              <ul className="troubleshoot-list">
                <li>Verify your backend service is active and running</li>
                <li>Check if your API is hosting on port 8000</li>
                <li>Ensure network requests are not blocked by local firewalls</li>
              </ul>
              {error && (
                <div className="connection-error-log">
                  Error Details: {error}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'failed', 'active'
  const [connectionError, setConnectionError] = useState(null);

  const checkConnection = async () => {
    setConnectionStatus('connecting');
    setConnectionError(null);
    
    // Minimum wait of 1.5 seconds for satisfying cyber-loader visualization
    const minWait = new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      await api.health.check();
      
      const [prodRes, custRes, ordRes] = await Promise.all([
        api.products.getAll(),
        api.customers.getAll(),
        api.orders.getAll()
      ]);
      setProducts(prodRes);
      setCustomers(custRes);
      setOrders(ordRes);
      
      await minWait;
      setConnectionStatus('connected');
      
      setTimeout(() => {
        setConnectionStatus('active');
        setLoading(false);
      }, 1400);
      
    } catch (err) {
      await minWait;
      setConnectionError(err.message || 'Network Timeout or CORS failure');
      setConnectionStatus('failed');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [prodRes, custRes, ordRes] = await Promise.all([
        api.products.getAll(),
        api.customers.getAll(),
        api.orders.getAll()
      ]);
      setProducts(prodRes);
      setCustomers(custRes);
      setOrders(ordRes);
    } catch (err) {
      showToast(`Network Error: ${err.message || 'Could not connect to API'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  const renderToastIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} style={{ color: 'var(--success)' }} />;
      case 'error': return <AlertCircle size={18} style={{ color: 'var(--danger)' }} />;
      case 'warning': return <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />;
      default: return <Info size={18} style={{ color: 'var(--primary)' }} />;
    }
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <Products 
            products={products} 
            loading={loading} 
            refreshData={refreshData} 
            showToast={showToast} 
          />
        );
      case 'customers':
        return (
          <Customers 
            customers={customers} 
            loading={loading} 
            refreshData={refreshData} 
            showToast={showToast} 
          />
        );
      case 'orders':
        return (
          <Orders 
            orders={orders} 
            products={products} 
            customers={customers} 
            loading={loading} 
            refreshData={refreshData} 
            showToast={showToast} 
          />
        );
      default:
        return (
          <Dashboard 
            products={products} 
            customers={customers} 
            orders={orders} 
            loading={loading} 
            refreshData={refreshData} 
            setActiveTab={setActiveTab} 
          />
        );
    }
  };

  return (
    <>
      <ConnectionGate 
        status={connectionStatus} 
        error={connectionError} 
        onRetry={checkConnection} 
      />
      <div className="app-container">
        {/* Navigation Sidebar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Content Pane */}
        <main className="main-content">
          {renderActiveComponent()}
        </main>

        {/* Floating Toast Notification Center */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              {renderToastIcon(toast.type)}
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
