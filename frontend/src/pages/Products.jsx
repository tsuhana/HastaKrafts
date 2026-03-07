import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../api/axios';
import ProductCard from '../components/ProductCard';
import '../styles/Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    categories: searchParams.get('category') ? [searchParams.get('category')] : [],
    search: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [filters.categories]);

  const fetchCategories = async () => {
    try {
      const res = await productAPI.getCategories();
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        status: 'approved',
        ...(filters.search && { search: filters.search }),
      };

      // If exactly one category selected, pass it as category_id
      // If multiple, fetch all and filter client-side
      if (filters.categories.length === 1) {
        params.category_id = filters.categories[0];
      }

      const res = await productAPI.getAllProducts(params);
      let fetchedProducts = res.data.data.products || [];

      // Client-side multi-category filter
      if (filters.categories.length > 1) {
        fetchedProducts = fetchedProducts.filter(p =>
          filters.categories.includes(p.category_id?.toString())
        );
      }

      // Client-side price filtering
      if (filters.minPrice) {
        fetchedProducts = fetchedProducts.filter(p => parseFloat(p.price) >= parseFloat(filters.minPrice));
      }
      if (filters.maxPrice) {
        fetchedProducts = fetchedProducts.filter(p => parseFloat(p.price) <= parseFloat(filters.maxPrice));
      }

      setProducts(fetchedProducts);
      setError('');
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (categoryId) => {
    const id = categoryId.toString();
    setFilters(prev => {
      const already = prev.categories.includes(id);
      const updated = already
        ? prev.categories.filter(c => c !== id)
        : [...prev.categories, id];

      // Sync URL — only set if single selection for shareability
      if (updated.length === 1) setSearchParams({ category: updated[0] });
      else setSearchParams({});

      return { ...prev, categories: updated };
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setFilters({ categories: [], search: '', minPrice: '', maxPrice: '' });
    setSearchParams({});
  };

  // Build result count label
  const getCountLabel = () => {
    if (filters.categories.length === 0) {
      return `${products.length} ${products.length === 1 ? 'product' : 'products'} found`;
    }
    if (filters.categories.length === 1) {
      const cat = categories.find(c => c.category_id.toString() === filters.categories[0]);
      return `${products.length} ${products.length === 1 ? 'product' : 'products'} in ${cat?.name || 'category'}`;
    }
    return `${products.length} ${products.length === 1 ? 'product' : 'products'} in ${filters.categories.length} categories`;
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.search || filters.minPrice || filters.maxPrice;

  return (
    <div className="products-page">
      <div className="products-container">

        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h2>Filters</h2>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear All
              </button>
            )}
          </div>

          {/* Search */}
          <div className="filter-section">
            <h3>Search</h3>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search products..."
                className="filter-input"
              />
              <button type="submit" className="filter-btn full">
                Search
              </button>
            </form>
          </div>

          {/* Categories — checkboxes, multi-select */}
          <div className="filter-section">
            <h3>
              Categories
              {filters.categories.length > 0 && (
                <span className="cat-selected-count">{filters.categories.length} selected</span>
              )}
            </h3>
            <div className="category-filters">
              {categories.map((cat) => {
                const checked = filters.categories.includes(cat.category_id.toString());
                return (
                  <label
                    key={cat.category_id}
                    className={`category-filter-item ${checked ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCategoryToggle(cat.category_id)}
                    />
                    <span className="cat-checkbox-box">
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className="cat-label">
                      <span className="cat-icon">{cat.icon}</span>
                      {cat.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <h3>Price Range</h3>
            <div className="price-row">
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min"
                className="filter-input"
              />
              <span className="price-sep">—</span>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max"
                className="filter-input"
              />
            </div>
            <button type="button" onClick={fetchProducts} className="filter-btn full">
              Apply
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="products-main">
          <div className="products-header">
            <h1>All Products</h1>
            <p className="products-count">{getCountLabel()}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="btn-primary">
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;