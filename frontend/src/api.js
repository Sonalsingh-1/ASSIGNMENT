const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP error! Status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // If not JSON, ignore and use default
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  products: {
    getAll: () => 
      fetch(`${API_BASE_URL}/products`).then(handleResponse),
    
    getById: (id) => 
      fetch(`${API_BASE_URL}/products/${id}`).then(handleResponse),
    
    create: (data) => 
      fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(handleResponse),
    
    update: (id, data) => 
      fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(handleResponse),
    
    delete: (id) => 
      fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE'
      }).then(handleResponse),
  },

  customers: {
    getAll: () => 
      fetch(`${API_BASE_URL}/customers`).then(handleResponse),
    
    getById: (id) => 
      fetch(`${API_BASE_URL}/customers/${id}`).then(handleResponse),
    
    create: (data) => 
      fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(handleResponse),
    
    delete: (id) => 
      fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE'
      }).then(handleResponse),
  },

  orders: {
    getAll: () => 
      fetch(`${API_BASE_URL}/orders`).then(handleResponse),
    
    getById: (id) => 
      fetch(`${API_BASE_URL}/orders/${id}`).then(handleResponse),
    
    create: (data) => 
      fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(handleResponse),
    
    delete: (id) => 
      fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'DELETE'
      }).then(handleResponse),
  }
};
