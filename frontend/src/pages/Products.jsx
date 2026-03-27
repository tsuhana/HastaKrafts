import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../api/axios';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import { Pagination } from '../components/SharedComponents';
import '../styles/Products.css';

const PRODUCTS_PER_PAGE = 12;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters]       = useState({
    categories: searchParams.get('category') ? [searchParams.get('category')] : [],
    search: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => { fetchCategories(); }, []);

  // Re-fetch from server whenever page or server-side filters change
  useEffect(() => { fetchProducts(); }, [filters.categories, filters.search, page]);

  // Reset to page 1 when filters change (not page itself)
  useEffect(() => { setPage(1); }, [filters.categories, filters.search, filters.minPrice, filters.maxPrice]);

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
      // Build server-side params — page and limit sent to backend
      const params = {
        status: 'approved',
        page,
        limit: PRODUCTS_PER_PAGE,
        ...(filters.search && { search: filters.search }),
      };
      if (filters.categories.length === 1) {
        params.category_id = filters.categories[0];
      }

      const res = await productAPI.getAllProducts(params);
      let fetchedProducts = res.data.data.products || [];
      const pagination    = res.data.data.pagination || {};

      // Multi-category filter still needs client-side (backend supports only one category_id)
      if (filters.categories.length > 1) {
        fetchedProducts = fetchedProducts.filter(p =>
          filters.categories.includes(p.category_id?.toString())
        );
      }

      // Price range filter — client-side since backend does not support min/max price params
      if (filters.minPrice) {
        fetchedProducts = fetchedProducts.filter(p => parseFloat(p.price) >= parseFloat(filters.minPrice));
      }
      if (filters.maxPrice) {
        fetchedProducts = fetchedProducts.filter(p => parseFloat(p.price) <= parseFloat(filters.maxPrice));
      }

      setProducts(fetchedProducts);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || fetchedProducts.length);
      setError('');
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Products already paginated by server — no client-side slicing needed
  const pagedProducts = products;

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
    setPage(1);
  };

  const getCountLabel = () => {
    const count = totalCount;
    const productWord = count === 1 ? t('products.product_in') : t('products.products_in');
    if (filters.categories.length === 0) return `${count} ${productWord} ${t('products.found')}`;
    if (filters.categories.length === 1) {
      const cat = categories.find(c => c.category_id.toString() === filters.categories[0]);
      return `${count} ${productWord} ${cat?.name || t('products.category')}`;
    }
    return `${count} ${productWord} ${filters.categories.length} ${t('products.categories_word')}`;
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.search || filters.minPrice || filters.maxPrice;

  return (
    <div className="products-page">
      <div className="products-container">

        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h2>{t('products.filters')}</h2>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters-btn">
                {t('products.clear_all')}
              </button>
            )}
          </div>

          {/* Search */}
          <div className="filter-section">
            <h3>{t('products.search')}</h3>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder={t('products.search_products')}
                className="filter-input"
              />
              <button type="submit" className="filter-btn full">
                {t('products.search')}
              </button>
            </form>
          </div>

          {/* Categories */}
          <div className="filter-section">
            <h3>
              {t('products.categories')}
              {filters.categories.length > 0 && (
                <span className="cat-selected-count">
                  {filters.categories.length} {t('products.selected')}
                </span>
              )}
            </h3>
            <div className="category-filters">
              {categories.map((cat) => {
                const checked = filters.categories.includes(cat.category_id.toString());
                return (
                  <label key={cat.category_id} className={`category-filter-item ${checked ? 'checked' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => handleCategoryToggle(cat.category_id)} />
                    <span className="cat-checkbox-box">
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
            <h3>{t('products.price_range')}</h3>
            <div className="price-row">
              <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder={t('products.min')} className="filter-input" />
              <span className="price-sep">—</span>
              <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder={t('products.max')} className="filter-input" />
            </div>
            <button type="button" onClick={fetchProducts} className="filter-btn full">
              {t('products.apply')}
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="products-main">
          <div className="products-header">
            <h1>{t('products.all_products')}</h1>
            <p className="products-count">
              {getCountLabel()}
              {totalPages > 1 && (
                <span style={{ marginLeft: 8, color: 'var(--text-3, #9a8268)', fontSize: '0.85em' }}>
                  · Page {page} of {totalPages}
                </span>
              )}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{t('products.loading')}</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {pagedProducts.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ marginTop: '2rem' }}>
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    theme="seller"
                  />
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9a8268', marginTop: '0.5rem' }}>
                    Showing {(page - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(page * PRODUCTS_PER_PAGE, totalCount)} of {totalCount} products
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>{t('products.no_products')}</h3>
              <p>{t('products.adjust_filters')}</p>
              <button onClick={clearFilters} className="btn-primary">
                {t('products.clear_all')}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;