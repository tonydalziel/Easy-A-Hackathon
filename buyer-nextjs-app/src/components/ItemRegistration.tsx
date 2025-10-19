'use client';

import { useState, useEffect } from 'react';

export default function ItemRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sellerId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [registeredItems, setRegisteredItems] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    console.log('🔄 Attempting to register item:', {
      name: formData.name,
      price: formData.price,
      sellerId: formData.sellerId
    });

    try {
      console.log('📡 Sending POST request to http://localhost:3000/agents/items');
      const response = await fetch('http://localhost:3000/agents/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          sellerId: formData.sellerId,
        }),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Item registered successfully:', data);
      setMessage({ type: 'success', text: `Item "${data.name}" registered successfully!` });
      setFormData({ name: '', description: '', price: '', sellerId: '' });
      fetchItems();
    } catch (error) {
      console.error('❌ --- Failed to register item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('fetch')) {
        setMessage({
          type: 'error',
          text: 'Failed to connect to server. Is the express-server running on port 3000?'
        });
      } else {
        setMessage({ type: 'error', text: `Failed to register item: ${errorMessage}` });
      }
    }
  };

  const fetchItems = async () => {
    try {
      console.log('📡 Fetching items from http://localhost:3000/agents/items');
      const response = await fetch('http://localhost:3000/agents/items');
      console.log('📥 Fetch response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch items:', errorText);
        throw new Error(`Failed to fetch items: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Fetched items:', data);
      setRegisteredItems(data.items || []);
    } catch (error) {
      console.error('❌ Error fetching items:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('fetch')) {
        console.error('💡 Server may not be running. Start with: cd express-server && npm start');
      }
    }
  }; const handleDelete = async (itemId: string) => {
    try {
      console.log('🗑️ Deleting item:', itemId);
      const response = await fetch(`http://localhost:3000/agents/items/${itemId}`, {
        method: 'DELETE',
      });

      console.log('📥 Delete response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to delete item:', errorText);
        throw new Error(`Failed to delete item: ${response.status}`);
      }

      console.log('✅ Item deleted successfully');
      setMessage({ type: 'success', text: 'Item deleted successfully!' });
      fetchItems();
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Failed to delete item: ${errorMessage}` });
    }
  };

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-cyan-500/30 bg-gradient-to-r from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <span className="text-2xl">🏪</span>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Item Marketplace
            </h2>
            <p className="text-xs text-gray-400">Register items for your AI agents to discover</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto p-6 space-y-6">
        {/* Registration Form */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-2xl shadow-cyan-500/10">
          <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <span className="text-xl">✨</span>
            Register New Item
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Name */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Item Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Wireless Mouse, Pokemon Card..."
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none text-white placeholder-gray-500"
              />
            </div>

            {/* Description */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the item..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none text-white placeholder-gray-500 resize-none"
              />
            </div>

            {/* Price */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Price (ALGO) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Seller ID */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Seller ID <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.sellerId}
                onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                placeholder="Leave empty for default seller"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none text-white placeholder-gray-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 shadow-lg shadow-purple-500/30 hover:shadow-cyan-500/40 disabled:shadow-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  Registering...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  Register Item
                </span>
              )}
            </button>
          </form>

          {/* Status Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg border ${message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
              } animate-slideIn`}>
              <p className="flex items-center gap-2">
                <span>{message.type === 'success' ? '✅' : '❌'}</span>
                {message.text}
              </p>
            </div>
          )}
        </div>

        {/* Registered Items List */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
          <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              Marketplace Items ({registeredItems.length})
            </span>
            <button
              onClick={fetchItems}
              className="text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {registeredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-2">🛍️</p>
                <p>No items registered yet</p>
                <p className="text-xs mt-1">Register your first item above!</p>
              </div>
            ) : (
              registeredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 hover:border-purple-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-lg font-bold text-green-400">${item.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">ID: {item.id.slice(0, 16)}...</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors"
                      title="Delete item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
