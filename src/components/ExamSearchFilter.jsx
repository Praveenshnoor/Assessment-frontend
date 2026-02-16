import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

const ExamSearchFilter = ({ 
  onSearchChange, 
  onFilterChange, 
  onSortChange,
  sortOptions = [],
  showPublishedFilter = false,
  showAttemptedFilter = false,
  resultCount = 0
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    published: 'all',
    attempted: 'all',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('latest');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    onSortChange(value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      published: 'all',
      attempted: 'all',
      dateRange: 'all'
    });
    setSortBy('latest');
    onSearchChange('');
    onFilterChange({
      published: 'all',
      attempted: 'all',
      dateRange: 'all'
    });
    onSortChange('latest');
  };

  const hasActiveFilters = searchTerm || filters.published !== 'all' || filters.attempted !== 'all' || filters.dateRange !== 'all' || sortBy !== 'latest';

  const getActiveFilterBadges = () => {
    const badges = [];
    if (searchTerm) badges.push({ label: `Search: "${searchTerm}"`, key: 'search' });
    if (filters.published !== 'all') badges.push({ label: `Status: ${filters.published}`, key: 'published' });
    if (filters.attempted !== 'all') badges.push({ label: `Attempt: ${filters.attempted}`, key: 'attempted' });
    if (filters.dateRange !== 'all') badges.push({ label: `Date: ${filters.dateRange}`, key: 'dateRange' });
    if (sortBy !== 'latest') {
      const sortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || sortBy;
      badges.push({ label: `Sort: ${sortLabel}`, key: 'sort' });
    }
    return badges;
  };

  const activeFilterBadges = getActiveFilterBadges();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 shadow-sm">
      {/* Main Controls Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Bar */}
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-sm"
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px] cursor-pointer hover:border-blue-400 transition-all shadow-sm font-medium"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition-all whitespace-nowrap shadow-sm ${
              showFilters 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterBadges.length > 0 && !showFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full font-bold">
                {activeFilterBadges.length}
              </span>
            )}
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium bg-white text-red-600 hover:bg-red-50 transition-all border border-red-300 shadow-sm"
              title="Clear all filters"
            >
              <X size={16} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFilterBadges.length > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200">
          {activeFilterBadges.map((badge) => (
            <span
              key={badge.key}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium"
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
          {/* Published/Draft Filter */}
          {showPublishedFilter && (
            <div className="relative">
              <select
                value={filters.published}
                onChange={(e) => handleFilterChange('published', e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer hover:border-blue-400 transition-all shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          )}

          {/* Attempted Filter */}
          {showAttemptedFilter && (
            <div className="relative">
              <select
                value={filters.attempted}
                onChange={(e) => handleFilterChange('attempted', e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer hover:border-blue-400 transition-all shadow-sm"
              >
                <option value="all">All Attempts</option>
                <option value="attempted">Attempted</option>
                <option value="not-attempted">Not Attempted</option>
                <option value="in-progress">In Progress</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          )}

          {/* Date Filter */}
          <div className="relative">
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="appearance-none px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer hover:border-blue-400 transition-all shadow-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>
      )}

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 font-medium">
            Showing <span className="text-blue-600 font-bold">{resultCount}</span> {resultCount === 1 ? 'exam' : 'exams'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamSearchFilter;
