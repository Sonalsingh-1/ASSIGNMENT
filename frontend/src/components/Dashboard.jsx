import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Package, Users, ShoppingCart, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';

export default function Dashboard({ products, customers, orders, loading, refreshData, setActiveTab }) {
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    // Define low stock as quantity < 5
    const lowStock = products.filter(p => p.quantity < 5);
    setLowStockProducts(lowStock);
  }, [products]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get total revenue
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

  // Get recent 4 orders
  const recentOrders = orders.slice(0, 4);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loader">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Control Center</h1>
          <p className="dashboard-subtitle">Real-time business intelligence and inventory analytics.</p>
        </div>
        <button className="btn btn-secondary" onClick={refreshData}>
          Refresh Analytics
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-info">
            <h3>Total Products</h3>
            <div className="stat-value">{products.length}</div>
          </div>
          <div className="stat-icon-wrapper primary">
            <Package size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Customers</h3>
            <div className="stat-value">{customers.length}</div>
          </div>
          <div className="stat-icon-wrapper success">
            <Users size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Orders Placed</h3>
            <div className="stat-value">{orders.length}</div>
          </div>
          <div className="stat-icon-wrapper info">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Low Stock Alerts</h3>
            <div className="stat-value" style={{ color: lowStockProducts.length > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
              {lowStockProducts.length}
            </div>
          </div>
          <div className="stat-icon-wrapper warning">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Double Column Layout */}
      <div className="dashboard-sections">
        {/* Left Column: Recent Orders */}
        <div className="card">
          <div className="section-title">
            <TrendingUp className="section-icon" />
            <h2>Recent Orders</h2>
          </div>
          
          {recentOrders.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No orders placed yet. 
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem', display: 'block', margin: '1rem auto' }}
                onClick={() => setActiveTab('orders')}
              >
                Create First Order
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const orderCustomer = customers.find(c => c.id === order.customer_id) || order.customer;
                    const date = new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const itemCount = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                    
                    return (
                      <tr key={order.id}>
                        <td><span style={{ fontWeight: '600', color: 'var(--primary)' }}>#ORD-{order.id}</span></td>
                        <td>{orderCustomer ? orderCustomer.name : `Customer ID ${order.customer_id}`}</td>
                        <td>{date}</td>
                        <td style={{ fontWeight: '600' }}>{formatCurrency(order.total_amount)}</td>
                        <td>
                          <span className="badge info">{itemCount} units</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  onClick={() => setActiveTab('orders')}
                >
                  Manage All Orders <ArrowRight size={14} style={{ marginLeft: '0.25rem' }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Low Stock Panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="section-title">
            <AlertTriangle className="section-icon" style={{ color: 'var(--warning)' }} />
            <h2>Critical Inventory</h2>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--success)' }}>
              All products are fully stocked! Good job.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {lowStockProducts.map((product) => (
                <div 
                  key={product.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{product.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {product.sku}</div>
                  </div>
                  <div>
                    {product.quantity === 0 ? (
                      <span className="badge danger">Out of Stock</span>
                    ) : (
                      <span className="badge warning">{product.quantity} left</span>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  onClick={() => setActiveTab('products')}
                >
                  Restock Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
