import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import InputField from './InputField';

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
    <div className="bg-white rounded-xl border border-shnoor-mist p-3 mb-4 shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
      {/* Main Controls Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Bar */}
        <div className="flex-1 relative group">
          <div className="absolute left-3 top-4 text-shnoor-navy group-focus-within:text-shnoor-indigo transition-colors z-10 w-5 h-5 pointer-events-none">
            <Search size={18} />
          </div>
          <InputField
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Sort Dropdown */}
          <div className="relative flex items-center w-full sm:w-auto flex-1 sm:flex-none">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none px-3 py-2 pr-8 w-full text-sm border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo bg-white min-w-[140px] cursor-pointer hover:border-shnoor-indigo transition-all shadow-sm font-bold text-shnoor-navy"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-shnoor-indigoMedium pointer-events-none" size={16} />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-bold transition-all whitespace-nowrap shadow-sm ${showFilters
              ? 'bg-shnoor-indigo text-white shadow-md'
              : 'bg-white text-shnoor-navy hover:bg-shnoor-lavender border border-shnoor-mist hover:border-shnoor-indigo'
              }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterBadges.length > 0 && !showFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-shnoor-lavender text-shnoor-indigo text-xs rounded-full font-bold">
                {activeFilterBadges.length}
              </span>
            )}
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium bg-white text-shnoor-danger hover:bg-shnoor-dangerLight transition-all border border-shnoor-dangerLight shadow-sm"
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
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-shnoor-mist">
          {activeFilterBadges.map((badge) => (
            <span
              key={badge.key}
              className="inline-flex items-center gap-1 px-2 py-1 bg-shnoor-lavender text-shnoor-indigo text-xs rounded-md font-bold"
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-shnoor-mist animate-in slide-in-from-top-2 duration-200">
          {/* Published/Draft Filter */}
          {showPublishedFilter && (
            <div className="relative flex items-center w-full sm:w-auto flex-1 sm:flex-none">
              <select
                value={filters.published}
                onChange={(e) => handleFilterChange('published', e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 w-full text-sm border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo bg-white cursor-pointer hover:border-shnoor-indigo transition-all shadow-sm font-bold text-shnoor-navy"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-shnoor-indigoMedium pointer-events-none" size={14} />
            </div>
          )}

          {/* Attempted Filter */}
          {showAttemptedFilter && (
            <div className="relative flex items-center w-full sm:w-auto flex-1 sm:flex-none">
              <select
                value={filters.attempted}
                onChange={(e) => handleFilterChange('attempted', e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 w-full text-sm border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo bg-white cursor-pointer hover:border-shnoor-indigo transition-all shadow-sm font-bold text-shnoor-navy"
              >
                <option value="all">All Attempts</option>
                <option value="attempted">Attempted</option>
                <option value="not-attempted">Not Attempted</option>
                <option value="in-progress">In Progress</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-shnoor-indigoMedium pointer-events-none" size={14} />
            </div>
          )}

          {/* Date Filter */}
          <div className="relative flex items-center w-full sm:w-auto flex-1 sm:flex-none">
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="appearance-none px-3 py-1.5 pr-8 w-full text-sm border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo bg-white cursor-pointer hover:border-shnoor-indigo transition-all shadow-sm font-bold text-shnoor-navy"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-shnoor-indigoMedium pointer-events-none" size={14} />
          </div>
        </div>
      )}

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="mt-2 pt-2 border-t border-shnoor-mist">
          <p className="text-xs text-shnoor-indigoMedium font-bold">
            Showing <span className="text-shnoor-indigo font-bold">{resultCount}</span> {resultCount === 1 ? 'exam' : 'exams'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamSearchFilter;