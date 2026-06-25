import React, { useState } from 'react';
import { api } from '../api';
import { Plus, Search, Edit2, Trash2, X, Package, DollarSign, Tag, Database } from 'lucide-react';

export default function Products({ products, loading, refreshData, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity: ''
  });
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', sku: '', price: '', quantity: '' });
    setErrors({});
    setApiError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity: product.quantity.toString()
    });
    setErrors({});
    setApiError(null);
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU code is required';
    
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum)) {
      newErrors.price = 'Price is required';
    } else if (priceNum <= 0) {
      newErrors.price = 'Price must be greater than $0.00';
    }
    
    const qtyNum = parseInt(formData.quantity);
    if (isNaN(qtyNum)) {
      newErrors.quantity = 'Quantity is required';
    } else if (qtyNum < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError(null);

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity)
    };

    try {
      if (modalMode === 'add') {
        await api.products.create(payload);
        showToast('Product added successfully', 'success');
      } else {
        await api.products.update(selectedProduct.id, payload);
        showToast('Product updated successfully', 'success');
      }
      setIsModalOpen(false);
      refreshData();
    } catch (err) {
      setApiError(err.message || 'An error occurred while saving the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await api.products.delete(id);
        showToast('Product deleted successfully', 'success');
        refreshData();
      } catch (err) {
        showToast(err.message || 'Could not delete product', 'error');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Products Catalog</h1>
          <p className="dashboard-subtitle">Manage catalog items, inventory levels, and prices.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="card">
        {/* Controls: Search */}
        <div className="controls-row">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {/* Products Table */}
        {loading && products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No products match your search.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU / Code</th>
                  <th>Unit Price</th>
                  <th>Stock Level</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{product.name}</div>
                    </td>
                    <td>
                      <span className="badge info" style={{ fontFamily: 'monospace' }}>{product.sku}</span>
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {formatCurrency(product.price)}
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{product.quantity}</span>
                    </td>
                    <td>
                      {product.quantity === 0 ? (
                        <span className="badge danger">Out of Stock</span>
                      ) : product.quantity < 5 ? (
                        <span className="badge warning">Low Stock</span>
                      ) : (
                        <span className="badge success">Available</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-icon-only"
                          title="Edit Details"
                          onClick={() => openEditModal(product)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon-only"
                          title="Delete Product"
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === 'add' ? 'Add New Product' : 'Edit Product Details'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
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

                <div className="form-group">
                  <label className="form-label">
                    <Package size={14} /> Product Name
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? 'invalid' : ''}`}
                    placeholder="e.g. Ergonomic Office Chair"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Tag size={14} /> SKU / Code
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.sku ? 'invalid' : ''}`}
                    placeholder="e.g. PROD-CHAIR-10"
                    disabled={modalMode === 'edit'} // Disable SKU editing in edit mode to preserve consistency
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                  {errors.sku && <div className="form-error">{errors.sku}</div>}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      <DollarSign size={14} /> Unit Price (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={`form-input ${errors.price ? 'invalid' : ''}`}
                      placeholder="99.99"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    {errors.price && <div className="form-error">{errors.price}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Database size={14} /> Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={`form-input ${errors.quantity ? 'invalid' : ''}`}
                      placeholder="10"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                    {errors.quantity && <div className="form-error">{errors.quantity}</div>}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
