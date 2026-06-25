import React from 'react';
import { LayoutDashboard, Package, Users, ShoppingCart } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingCart }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-logo">📦</span>
        <span className="brand-name">Stellar Inventory</span>
      </div>
      <nav>
        <ul className="nav-links">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  style={{ background: 'none', width: '100%', border: 'none', textAlign: 'left' }}
                >
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
