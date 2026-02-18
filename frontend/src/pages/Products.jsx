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
    category: searchParams.get('category') || '',
    search: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters.category]);

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
        ...(filters.category && { category_id: filters.category }),
        ...(filters.search && { search: filters.search }),
      };

      const res = await productAPI.getAllProducts(params);
      let fetchedProducts = res.data.data.products || [];

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

  const handleCategoryChange = (categoryId) => {
    setFilters(prev => ({ ...prev, category: categoryId }));
    if (categoryId) {
      setSearchParams({ category: categoryId });
    } else {
      setSearchParams({});
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setFilters({ category: '', search: '', minPrice: '', maxPrice: '' });
    setSearchParams({});
    fetchProducts();
  };

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h2>Filters</h2>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All
            </button>
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
            <button type="submit" className="filter-btn">
            Search
          </button>
          </form>
        </div>

          {/* Categories */}
          <div className="filter-section">
            <h3>Categories</h3>
            <div className="category-filters">
              <label className="category-filter-item">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === ''}
                  onChange={() => handleCategoryChange('')}
                />
                <span>All Categories</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.category_id} className="category-filter-item">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === cat.category_id.toString()}
                    onChange={() => handleCategoryChange(cat.category_id.toString())}
                  />
                  <span>
                    <span className="cat-icon">{cat.icon}</span>
                    {cat.name}
                  </span>
                </label>
              ))}
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
            <p className="products-count">
              {products.length} {products.length === 1 ? 'product' : 'products'} found
            </p>
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