import React, { useState } from 'react';
import { api } from '../api';
import { Plus, Search, Trash2, X, User, Mail, Phone } from 'lucide-react';

export default function Customers({ customers, loading, refreshData, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setFormData({ name: '', email: '', phone: '' });
    setErrors({});
    setApiError(null);
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    
    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      newErrors.email = 'Email address is required';
    } else if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.trim().length < 5) {
      newErrors.phone = 'Phone number is too short';
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
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim()
    };

    try {
      await api.customers.create(payload);
      showToast('Customer added successfully', 'success');
      setIsModalOpen(false);
      refreshData();
    } catch (err) {
      setApiError(err.message || 'An error occurred while saving the customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"?\nWARNING: Deleting a customer will cancel/delete all their associated orders!`)) {
      try {
        await api.customers.delete(id);
        showToast('Customer deleted successfully', 'success');
        refreshData();
      } catch (err) {
        showToast(err.message || 'Could not delete customer', 'error');
      }
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Customers Directory</h1>
          <p className="dashboard-subtitle">Maintain client records, contacts, and account profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="card">
        {/* Controls: Search */}
        <div className="controls-row">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>

        {/* Customers Table */}
        {loading && customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading directory...</div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No customers match your search.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{customer.name}</div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{customer.email}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace' }}>{customer.phone}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-icon-only"
                        title="Delete Customer"
                        onClick={() => handleDelete(customer.id, customer.name)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Customer</h2>
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
                    <User size={14} /> Full Name
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? 'invalid' : ''}`}
                    placeholder="e.g. Jane Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Mail size={14} /> Email Address
                  </label>
                  <input
                    type="email"
                    className={`form-input ${errors.email ? 'invalid' : ''}`}
                    placeholder="e.g. jane.smith@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone size={14} /> Phone Number
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.phone ? 'invalid' : ''}`}
                    placeholder="e.g. +1 (555) 0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  {errors.phone && <div className="form-error">{errors.phone}</div>}
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
                  {isSubmitting ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
