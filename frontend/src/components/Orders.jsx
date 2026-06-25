import React, { useState } from 'react';
import { api } from '../api';
import { Plus, Search, Trash2, Eye, X, User, ShoppingBag, Calendar, DollarSign, PlusCircle, MinusCircle } from 'lucide-react';

export default function Orders({ orders, products, customers, loading, refreshData, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create Order States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [addedItems, setAddedItems] = useState([]); // Array of { product, quantity }
  
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter orders by customer name or order ID
  const filteredOrders = orders.filter(order => {
    const orderCustomer = customers.find(c => c.id === order.customer_id) || order.customer;
    const customerName = orderCustomer ? orderCustomer.name.toLowerCase() : '';
    const orderIdStr = order.id.toString();
    const query = searchTerm.toLowerCase();
    return customerName.includes(query) || orderIdStr.includes(query);
  });

  const openCreateModal = () => {
    setSelectedCustomerId('');
    setSelectedProductId('');
    setItemQuantity(1);
    setAddedItems([]);
    setApiError(null);
    setIsCreateOpen(true);
  };

  const openDetailsModal = (order) => {
    // Populate the full customer and products info onto the order items for the UI
    const orderCustomer = customers.find(c => c.id === order.customer_id) || order.customer;
    const enrichedItems = order.items.map(item => {
      const p = products.find(prod => prod.id === item.product_id) || item.product;
      return { ...item, product: p };
    });
    
    setSelectedOrder({
      ...order,
      customer: orderCustomer,
      items: enrichedItems
    });
    setIsDetailsOpen(true);
  };

  // Add item to the local order builder list
  const handleAddItem = () => {
    if (!selectedProductId) return;
    
    const product = products.find(p => p.id === parseInt(selectedProductId));
    if (!product) return;

    if (itemQuantity <= 0) {
      alert('Quantity must be greater than zero');
      return;
    }

    // Check if product has enough stock
    const existingItem = addedItems.find(item => item.product.id === product.id);
    const existingQty = existingItem ? existingItem.quantity : 0;
    const totalRequestedQty = existingQty + itemQuantity;

    if (product.quantity < totalRequestedQty) {
      alert(`Insufficient stock. Only ${product.quantity} units of "${product.name}" are available.`);
      return;
    }

    if (existingItem) {
      // Update quantity
      setAddedItems(addedItems.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: totalRequestedQty }
          : item
      ));
    } else {
      // Add new item
      setAddedItems([...addedItems, { product, quantity: itemQuantity }]);
    }

    // Reset item inputs
    setSelectedProductId('');
    setItemQuantity(1);
  };

  // Remove item from local order builder list
  const handleRemoveItem = (productId) => {
    setAddedItems(addedItems.filter(item => item.product.id !== productId));
  };

  // Calculate local total for preview
  const localPreviewTotal = addedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setApiError('Please select a customer');
      return;
    }
    if (addedItems.length === 0) {
      setApiError('Please add at least one product to the order');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    const payload = {
      customer_id: parseInt(selectedCustomerId),
      items: addedItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      await api.orders.create(payload);
      showToast('Order created successfully', 'success');
      setIsCreateOpen(false);
      refreshData();
    } catch (err) {
      setApiError(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(`Are you sure you want to cancel Order #ORD-${orderId}?\nThis will delete the order and restore the product stock levels.`)) {
      try {
        await api.orders.delete(orderId);
        showToast('Order cancelled and stock restored', 'success');
        setIsDetailsOpen(false);
        refreshData();
      } catch (err) {
        showToast(err.message || 'Failed to cancel order', 'error');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get product currently chosen to show its stock
  const currentProduct = products.find(p => p.id === parseInt(selectedProductId));

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Orders Control</h1>
          <p className="dashboard-subtitle">Build new invoices, track purchases, and manage shipments.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Create Order
        </button>
      </div>

      <div className="card">
        {/* Controls: Search */}
        <div className="controls-row">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer or order ID..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>

        {/* Orders Table */}
        {loading && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No orders found.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Items Count</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const orderCustomer = customers.find(c => c.id === order.customer_id) || order.customer;
                  const date = new Date(order.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const totalItems = order.items ? order.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
                  
                  return (
                    <tr key={order.id}>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--primary)' }}>#ORD-{order.id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{orderCustomer ? orderCustomer.name : `Customer ID ${order.customer_id}`}</div>
                      </td>
                      <td>{date}</td>
                      <td style={{ fontWeight: '600' }}>
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td>
                        <span className="badge info">{totalItems} units</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-icon-only"
                            title="View Details"
                            onClick={() => openDetailsModal(order)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon-only"
                            title="Cancel/Delete Order"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Order</h2>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitOrder}>
              <div className="modal-body">
                {apiError && (
                  <div 
                    style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      padding: '1rem',
                      borderRadius: '10px',
                      marginBottom: '1.5rem',
                      color: 'var(--danger)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {apiError}
                  </div>
                )}

                <div className="order-builder-layout">
                  {/* Left builder column */}
                  <div className="builder-column">
                    <h3>Order Configuration</h3>

                    {/* Customer Select */}
                    <div className="form-group">
                      <label className="form-label">
                        <User size={14} /> Customer Reference
                      </label>
                      <select
                        className="form-select"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                      >
                        <option value="">-- Select Customer --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                        ))}
                      </select>
                    </div>

                    {/* Product Select Section */}
                    <div 
                      style={{
                        padding: '1.25rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}
                    >
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Add Products</h4>
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Select Product</label>
                        <select
                          className="form-select"
                          value={selectedProductId}
                          onChange={(e) => {
                            setSelectedProductId(e.target.value);
                            setItemQuantity(1);
                          }}
                        >
                          <option value="">-- Select Catalog Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                              {p.name} - {formatCurrency(p.price)} {p.quantity === 0 ? '(OUT OF STOCK)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {currentProduct && (
                        <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Stock Available:</span>
                          <span 
                            style={{ 
                              fontWeight: '600', 
                              color: currentProduct.quantity < 5 ? 'var(--warning)' : 'var(--success)' 
                            }}
                          >
                            {currentProduct.quantity} units
                          </span>
                        </div>
                      )}

                      <div className="item-selection-row">
                        <div className="form-group" style={{ marginBottom: 0, flexGrow: 1 }}>
                          <label className="form-label">Quantity</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-icon-only"
                              onClick={() => setItemQuantity(q => Math.max(1, q - 1))}
                            >
                              <MinusCircle size={16} />
                            </button>
                            <input
                              type="number"
                              className="form-input"
                              style={{ textAlign: 'center' }}
                              value={itemQuantity}
                              min="1"
                              onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary btn-icon-only"
                              onClick={() => setItemQuantity(q => q + 1)}
                            >
                              <PlusCircle size={16} />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleAddItem}
                          disabled={!selectedProductId}
                        >
                          Add Item
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right builder column (Cart Summary) */}
                  <div className="builder-column">
                    <h3>Order Items Summary</h3>

                    {addedItems.length === 0 ? (
                      <div 
                        style={{
                          flexGrow: 1,
                          border: '1px dashed var(--border-color)',
                          borderRadius: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3rem',
                          color: 'var(--text-muted)',
                          textAlign: 'center'
                        }}
                      >
                        No items added to order yet. Select products on the left.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="order-items-list">
                          {addedItems.map((item) => (
                            <div key={item.product.id} className="order-item-row">
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.product.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Qty: {item.quantity} × {formatCurrency(item.product.price)}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                  {formatCurrency(item.product.price * item.quantity)}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-icon-only"
                                  style={{ padding: '0.25rem' }}
                                  onClick={() => handleRemoveItem(item.product.id)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="order-summary-box">
                          <div className="summary-row">
                            <span>Subtotal Items</span>
                            <span>{addedItems.reduce((sum, i) => sum + i.quantity, 0)} units</span>
                          </div>
                          <div className="summary-row total">
                            <span>Total Amount</span>
                            <span>{formatCurrency(localPreviewTotal)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting || addedItems.length === 0}
                >
                  {isSubmitting ? 'Processing Order...' : 'Submit Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {isDetailsOpen && selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Order Invoicing Details</h2>
              <button className="modal-close" onClick={() => setIsDetailsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Info Header */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem', 
                  marginBottom: '1.5rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Customer Profile
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '1rem', marginTop: '0.25rem' }}>
                    {selectedOrder.customer ? selectedOrder.customer.name : 'Unknown Customer'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {selectedOrder.customer ? selectedOrder.customer.email : ''}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {selectedOrder.customer ? selectedOrder.customer.phone : ''}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Purchase Metadata
                  </div>
                  <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '1rem', marginTop: '0.25rem' }}>
                    #ORD-{selectedOrder.id}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} /> 
                    {new Date(selectedOrder.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div 
                  style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.8rem', 
                    textTransform: 'uppercase', 
                    marginBottom: '0.75rem' 
                  }}
                >
                  Purchased Items
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.items.map((item) => (
                    <div 
                      key={item.id} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {item.product ? item.product.name : `Product ID ${item.product_id}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Quantity: {item.quantity} × {formatCurrency(item.price)}
                        </div>
                      </div>
                      <span style={{ fontWeight: '600' }}>
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div 
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  padding: '1.25rem',
                  borderRadius: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <ShoppingBag size={18} />
                  <span>Grand Total (USD)</span>
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {formatCurrency(selectedOrder.total_amount)}
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => handleDeleteOrder(selectedOrder.id)}
              >
                Cancel / Delete Order
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsDetailsOpen(false)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
