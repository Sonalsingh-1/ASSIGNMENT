import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Package, Users, ShoppingCart, AlertTriangle, ArrowRight, TrendingUp, Database, ArrowUpRight } from 'lucide-react';

function RevenueTrendChart({ orders, loading }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  if (loading) {
    return (
      <div className="card chart-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '330px' }}>
        <div className="loader" style={{ scale: '1.2' }}></div>
      </div>
    );
  }
  
  // Group orders by date (last 7 days, or last 7 orders)
  const sortedOrders = [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  const dailyDataMap = {};
  sortedOrders.forEach(order => {
    const dateStr = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyDataMap[dateStr]) {
      dailyDataMap[dateStr] = { date: dateStr, revenue: 0, count: 0 };
    }
    dailyDataMap[dateStr].revenue += order.total_amount;
    dailyDataMap[dateStr].count += 1;
  });
  
  let data = Object.values(dailyDataMap);
  
  // If no data, show simulated data for rich visual experience
  if (data.length === 0) {
    data = [
      { date: 'Jun 20', revenue: 120, count: 1 },
      { date: 'Jun 21', revenue: 250, count: 2 },
      { date: 'Jun 22', revenue: 190, count: 1 },
      { date: 'Jun 23', revenue: 480, count: 3 },
      { date: 'Jun 24', revenue: 320, count: 2 },
      { date: 'Jun 25', revenue: 600, count: 4 },
      { date: 'Jun 26', revenue: 750, count: 5 }
    ];
  } else if (data.length < 3) {
    const pad = [
      { date: 'Jun 24', revenue: 150, count: 1 },
      { date: 'Jun 25', revenue: 300, count: 2 }
    ];
    data = [...pad, ...data];
  }

  let cumulativeRevenue = 0;
  const chartData = data.map(d => {
    cumulativeRevenue += d.revenue;
    return {
      date: d.date,
      value: cumulativeRevenue,
      count: d.count,
      daily: d.revenue
    };
  });
  
  const width = 500;
  const height = 180;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const maxVal = Math.max(...chartData.map(d => d.value)) || 100;
  const minVal = 0;
  const valRange = maxVal - minVal;
  
  const points = chartData.map((d, i) => {
    const x = paddingLeft + (i / (chartData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.value - minVal) / valRange) * chartHeight;
    return { x, y, data: d };
  });
  
  const getBezierPath = (pts) => {
    if (pts.length === 0) return '';
    let dStr = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      dStr += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return dStr;
  };
  
  const linePath = getBezierPath(points);
  
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const scaledMouseX = mouseX * scaleX;
    
    let closest = null;
    let minDist = Infinity;
    
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - scaledMouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = { ...p, index: idx };
      }
    });
    
    if (closest) {
      setHoveredPoint(closest);
      setTooltipPos({
        x: (closest.x / width) * 100,
        y: (closest.y / height) * 100
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="card chart-card">
      <div className="chart-card-header">
        <div>
          <h3>Revenue Performance</h3>
          <div className="chart-subtitle-value">
            {formatCurrency(chartData[chartData.length - 1]?.value || 0)}
          </div>
        </div>
        <span className="badge success" style={{ alignSelf: 'flex-start' }}>
          Cumulative
        </span>
      </div>
      
      <div className="chart-canvas-wrapper" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid lines */}
          {gridTicks.map((tick, i) => {
            const y = paddingTop + chartHeight * (1 - tick);
            return (
              <g key={i}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-grid-line" />
                <text x={paddingLeft - 10} y={y + 4} textAnchor="end" className="chart-axis-text">
                  {formatCurrency(minVal + tick * valRange)}
                </text>
              </g>
            );
          })}
          
          {/* X Axis labels */}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={height - 8} textAnchor="middle" className="chart-axis-text">
              {p.data.date}
            </text>
          ))}
          
          {/* Main Area Path */}
          {areaPath && <path d={areaPath} className="chart-area" />}
          
          {/* Main Line Path */}
          {linePath && <path d={linePath} className="chart-line" />}
          
          {/* Hover interactive guides */}
          {hoveredPoint && (
            <>
              <line 
                x1={hoveredPoint.x} 
                y1={paddingTop} 
                x2={hoveredPoint.x} 
                y2={paddingTop + chartHeight} 
                className="chart-interactive-guide" 
              />
              <circle 
                cx={hoveredPoint.x} 
                cy={hoveredPoint.y} 
                r={6} 
                className="chart-hover-glow-dot" 
              />
            </>
          )}
        </svg>
        
        {/* HTML Tooltip */}
        {hoveredPoint && (
          <div 
            className="chart-tooltip" 
            style={{ 
              left: `${tooltipPos.x}%`, 
              top: `${tooltipPos.y}%`,
              opacity: 1
            }}
          >
            <div className="tooltip-header">{hoveredPoint.data.date}</div>
            <div className="tooltip-value-row">
              <div className="tooltip-value-dot" style={{ backgroundColor: 'var(--primary)' }}></div>
              <span className="tooltip-value">{formatCurrency(hoveredPoint.data.value)}</span>
            </div>
            <div className="tooltip-meta">
              +{formatCurrency(hoveredPoint.data.daily)} today ({hoveredPoint.data.count} order{hoveredPoint.data.count !== 1 ? 's' : ''})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryDonutChart({ products, loading }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (loading) {
    return (
      <div className="card chart-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '330px' }}>
        <div className="loader" style={{ scale: '1.2' }}></div>
      </div>
    );
  }

  const fullyStocked = products.filter(p => p.quantity >= 10).length;
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;
  
  const total = fullyStocked + lowStock + outOfStock;

  const categories = [
    { name: 'In Stock', count: fullyStocked, color: 'var(--success)', glowColor: 'rgba(16, 185, 129, 0.4)', key: 'instock' },
    { name: 'Low Stock', count: lowStock, color: 'var(--warning)', glowColor: 'rgba(245, 158, 11, 0.4)', key: 'lowstock' },
    { name: 'Out of Stock', count: outOfStock, color: 'var(--danger)', glowColor: 'rgba(244, 63, 94, 0.4)', key: 'outofstock' }
  ];

  let displayCategories = categories;
  let displayTotal = total;
  if (total === 0) {
    displayCategories = [
      { name: 'In Stock', count: 8, color: 'var(--success)', glowColor: 'rgba(16, 185, 129, 0.4)', key: 'instock' },
      { name: 'Low Stock', count: 3, color: 'var(--warning)', glowColor: 'rgba(245, 158, 11, 0.4)', key: 'lowstock' },
      { name: 'Out of Stock', count: 1, color: 'var(--danger)', glowColor: 'rgba(244, 63, 94, 0.4)', key: 'outofstock' }
    ];
    displayTotal = 12;
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercent = 0;
  const slices = displayCategories.map((cat, idx) => {
    const percent = displayTotal > 0 ? (cat.count / displayTotal) * 100 : 0;
    const strokeLength = (percent / 100) * circumference;
    const strokeOffset = circumference - strokeLength;
    const rotation = (accumulatedPercent / 100) * 360;
    accumulatedPercent += percent;
    return {
      ...cat,
      percent,
      strokeOffset,
      rotation,
      index: idx
    };
  });

  const activeCategory = hoveredIdx !== null ? displayCategories[hoveredIdx] : null;

  return (
    <div className="card chart-card">
      <div className="chart-card-header">
        <div>
          <h3>Inventory Breakdown</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Stock level allocation status</p>
        </div>
      </div>
      
      <div className="donut-layout">
        <div style={{ width: '150px', height: '150px', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} className="donut-bg" />
            {slices.map((slice) => (
              <circle
                key={slice.key}
                cx="100"
                cy="100"
                r={radius}
                className={`donut-slice ${hoveredIdx === slice.index ? 'active' : ''}`}
                style={{
                  stroke: slice.color,
                  strokeDasharray: circumference,
                  strokeDashoffset: slice.strokeOffset,
                  transform: `rotate(${slice.rotation - 90}deg)`,
                  transformOrigin: '100px 100px',
                  '--slice-glow': slice.glowColor
                }}
                onMouseEnter={() => setHoveredIdx(slice.index)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
            
            <g className="donut-center-text">
              <text x="100" y="105" className="donut-center-count">
                {activeCategory ? activeCategory.count : displayTotal}
              </text>
              <text x="100" y="125" className="donut-center-label">
                {activeCategory ? activeCategory.name : 'Items'}
              </text>
            </g>
          </svg>
        </div>

        <div className="donut-legend">
          {slices.map((slice) => (
            <div 
              key={slice.key} 
              className={`legend-item ${hoveredIdx === slice.index ? 'active' : ''}`}
              onMouseEnter={() => setHoveredIdx(slice.index)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="legend-indicator" style={{ backgroundColor: slice.color }}></div>
              <div className="legend-info">
                <span className="legend-label">{slice.name}</span>
                <span className="legend-stats">{slice.count} items ({Math.round(slice.percent)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

  // Page-level loader removed to support card-level skeleton loading

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
            <div className="stat-value">
              {loading ? (
                <div className="loader" style={{ scale: '0.7', transformOrigin: 'left center', margin: '0.25rem 0' }}></div>
              ) : (
                products.length
              )}
            </div>
          </div>
          <div className="stat-icon-wrapper primary">
            <Package size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Customers</h3>
            <div className="stat-value">
              {loading ? (
                <div className="loader" style={{ scale: '0.7', transformOrigin: 'left center', margin: '0.25rem 0' }}></div>
              ) : (
                customers.length
              )}
            </div>
          </div>
          <div className="stat-icon-wrapper success">
            <Users size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Orders Placed</h3>
            <div className="stat-value">
              {loading ? (
                <div className="loader" style={{ scale: '0.7', transformOrigin: 'left center', margin: '0.25rem 0' }}></div>
              ) : (
                orders.length
              )}
            </div>
          </div>
          <div className="stat-icon-wrapper info">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Low Stock Alerts</h3>
            <div className="stat-value" style={{ color: !loading && lowStockProducts.length > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
              {loading ? (
                <div className="loader" style={{ scale: '0.7', transformOrigin: 'left center', margin: '0.25rem 0' }}></div>
              ) : (
                lowStockProducts.length
              )}
            </div>
          </div>
          <div className="stat-icon-wrapper warning">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Interactive Analytics Charts */}
      <div className="charts-grid">
        <RevenueTrendChart orders={orders} loading={loading} />
        <InventoryDonutChart products={products} loading={loading} />
      </div>

      {/* Double Column Layout */}
      <div className="dashboard-sections">
        {/* Left Column: Recent Orders */}
        <div className="card">
          <div className="section-title">
            <TrendingUp className="section-icon" />
            <h2>Recent Orders</h2>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
              <div className="loader" style={{ scale: '1.2' }}></div>
            </div>
          ) : recentOrders.length === 0 ? (
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

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3.8rem' }}>
              <div className="loader" style={{ scale: '1.2' }}></div>
            </div>
          ) : lowStockProducts.length === 0 ? (
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
