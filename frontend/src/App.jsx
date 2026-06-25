import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

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
    refreshData();
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
  );
}
