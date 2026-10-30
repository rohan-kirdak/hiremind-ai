import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, RotateCcw, Briefcase } from 'lucide-react';
import { fetchJobs, fetchJobById } from '../api/jobs.api';
import JobCard from '../components/jobs/JobCard';
import JobDetailsModal from '../components/jobs/JobDetailsModal';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { JOB_CATEGORIES } from '../utils/categories';
import { useProfile } from '../context/ProfileContext';

export default function JobSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasProfile, profile } = useProfile();

  // Search filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const limit = 12;

  // Data fetching states
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected job for detail view
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs({
        search: search.trim(),
        location: location.trim(),
        category,
        page,
        limit,
      });

      if (data && data.success) {
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      } else {
        throw new Error(data?.message || 'Failed to load jobs.');
      }
    } catch (err) {
      console.error('JobSearchPage error:', err);
      setError(err.message || 'Unable to fetch job listings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [page, category]);

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setLocation('');
    setCategory('');
    setPage(1);
  };

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    if (!job.description || job.description.length < 50) {
      try {
        setModalLoading(true);
        const res = await fetchJobById(job.jobId);
        if (res?.success && res.job) {
          setSelectedJob(res.job);
        }
      } catch (e) {
        console.warn('Could not fetch complete job details:', e);
      } finally {
        setModalLoading(false);
      }
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Explore Job Opportunities</h1>
        <p className="text-sm text-slate-500 mt-1">
          Search over 1,700 positions across multi-domain roles with transparent skills and compensation.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, skills, or company..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Location Search */}
          <div className="md:col-span-4 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g. Remote, US, Worldwide)..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Search Button */}
          <div className="md:col-span-3 flex items-center gap-2">
            <Button type="submit" variant="primary" size="md" className="w-full">
              Search Jobs
            </Button>
            {(search || location || category) && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleResetFilters}
                title="Reset filters"
                className="px-2.5"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
              </Button>
            )}
          </div>
        </form>

        {/* Domain Category Filter Badges */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-400 shrink-0 uppercase tracking-wider mr-1">
            Category:
          </span>
          {JOB_CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setPage(1);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Showing {total > 0 ? (page - 1) * limit + 1 : 0} -{' '}
          {Math.min(page * limit, total)} of {total.toLocaleString()} listings
        </span>
        {category && (
          <span className="text-brand-600">
            Filtered by: {JOB_CATEGORIES.find((c) => c.id === category)?.name}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner fullPage text="Loading job listings..." />
      ) : error ? (
        <ErrorAlert
          title="Could not retrieve job listings"
          message={error}
          onRetry={loadJobs}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs match your criteria"
          description="Try broadening your search keyword, clearing location filters, or switching category domains."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.jobId}
                job={job}
                onSelect={handleSelectJob}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              <span className="text-xs font-semibold text-slate-600">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
