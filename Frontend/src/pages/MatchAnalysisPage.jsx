import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Briefcase,
  DollarSign,
  TrendingUp,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Target,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import { useProfile } from '../context/ProfileContext';
import { fetchRecommendations } from '../api/recommendations.api';
import { formatSalary, JOB_CATEGORIES } from '../utils/categories';

export default function MatchAnalysisPage() {
  const { hasProfile, profile } = useProfile();

  const [recommendations, setRecommendations] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [limit, setLimit] = useState(10);

  const loadMatchData = async () => {
    if (!hasProfile || !profile) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetchRecommendations({
        candidateProfile: profile,
        limit,
        category: categoryFilter || null,
      });

      if (res && res.success) {
        const recs = res.recommendations || [];
        setRecommendations(recs);
        if (recs.length > 0) {
          setSelectedJob(recs[0]);
        } else {
          setSelectedJob(null);
        }
      } else {
        throw new Error(res?.message || 'Failed to calculate match recommendations.');
      }
    } catch (err) {
      console.error('Match analysis loading error:', err);
      setError(err.message || 'Unable to retrieve match analysis from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchData();
  }, [hasProfile, profile, categoryFilter, limit]);

  const getScoreVariant = (score) => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'brand';
    if (score >= 30) return 'warning';
    return 'slate';
  };

  if (!hasProfile) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Match Intelligence & Analysis</h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic scoring, skill overlap calculations, and gap analysis for your career.
          </p>
        </div>

        <EmptyState
          icon={BarChart3}
          title="Resume Profile Required"
          description="Deterministic match analysis requires an active candidate profile with extracted skills. Please upload your resume first."
          actionLabel="Upload Resume to Continue"
          onAction={() => (window.location.href = '/profile')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Match Intelligence & Analysis</h1>
            <Badge variant="brand" size="sm">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Engine V4.1
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Analyzing matches for <span className="font-semibold text-slate-800">{profile.designation || 'Your Profile'}</span> ({profile.skills?.length || 0} skills)
          </p>
        </div>

        {/* Category Domain & Limit Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value={5}>Top 5 Matches</option>
            <option value={10}>Top 10 Matches</option>
            <option value={20}>Top 20 Matches</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Computing deterministic match scores..." />
      ) : error ? (
        <ErrorAlert title="Analysis Error" message={error} onRetry={loadMatchData} />
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No job matches in this category"
          description="Try switching the domain filter to 'All Domains' to view matches across the entire dataset."
          actionLabel="View All Domains"
          onAction={() => setCategoryFilter('')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Ranked Jobs List */}
          <div className="lg:col-span-5 space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 px-1">
              Ranked Matches ({recommendations.length})
            </div>

            {recommendations.map((job, idx) => {
              const isSelected = selectedJob?.jobId === job.jobId;
              return (
                <div
                  key={job.jobId}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <Badge variant={getScoreVariant(job.matchScore)} size="sm">
                      {job.matchScore}% Match
                    </Badge>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{job.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-2">{job.company || 'Confidential'}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span className="truncate">{job.location || 'Remote'}</span>
                    <span className="font-medium text-slate-600">{formatSalary(job.salary)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep-Dive Match Breakdown */}
          {selectedJob && (
            <div className="lg:col-span-7 space-y-6 sticky top-20">
              <Card className="border-slate-200">
                {/* Header Banner */}
                <div className="pb-6 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <Badge variant="brand" size="sm">
                      {selectedJob.domain?.category || 'General'}
                    </Badge>

                    <Badge variant={getScoreVariant(selectedJob.matchScore)} size="md" className="text-sm font-bold">
                      {selectedJob.matchScore}/100 Overall Score
                    </Badge>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">{selectedJob.title}</h2>
                  <p className="text-sm font-semibold text-slate-600 mt-0.5">{selectedJob.company || 'Confidential'}</p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedJob.location || 'Worldwide'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedJob.workMode || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{formatSalary(selectedJob.salary)}</span>
                    </div>
                  </div>
                </div>

                {/* Score Component Breakdown Grid */}
                {selectedJob.scoreBreakdown && (
                  <div className="py-6 border-b border-slate-100">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Transparent Component Breakdown
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500 block font-medium">Skills Overlap (50%)</span>
                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                          {selectedJob.scoreBreakdown.skills !== null ? `${selectedJob.scoreBreakdown.skills}%` : 'N/A'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500 block font-medium">Role Title (25%)</span>
                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                          {selectedJob.scoreBreakdown.title !== null ? `${selectedJob.scoreBreakdown.title}%` : 'N/A'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500 block font-medium">Experience (15%)</span>
                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                          {selectedJob.scoreBreakdown.experience !== null ? `${selectedJob.scoreBreakdown.experience}%` : 'N/A'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500 block font-medium">Location (10%)</span>
                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                          {selectedJob.scoreBreakdown.location !== null ? `${selectedJob.scoreBreakdown.location}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Matched Skills Chips */}
                <div className="py-5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Matched Skills ({selectedJob.matchedSkills?.length || 0})
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.matchedSkills && selectedJob.matchedSkills.length > 0 ? (
                      selectedJob.matchedSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-800 font-semibold ring-1 ring-inset ring-emerald-600/20"
                        >
                          ✓ {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No direct skill overlaps identified.</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills Chips */}
                <div className="py-5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Verified Missing Skills ({selectedJob.missingSkills?.length || 0})
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.missingSkills && selectedJob.missingSkills.length > 0 ? (
                      selectedJob.missingSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs rounded-lg bg-amber-50 text-amber-800 font-medium ring-1 ring-inset ring-amber-600/20"
                        >
                          ! {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">All identified skills covered!</span>
                    )}
                  </div>
                </div>

                {/* Key Reasoning Explanations */}
                {selectedJob.reasons && selectedJob.reasons.length > 0 && (
                  <div className="py-5 border-b border-slate-100">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Deterministic Reasoning
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {selectedJob.reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-brand-600 font-bold">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Link to="/assistant">
                    <Button variant="outline" size="sm" icon={Sparkles}>
                      Ask Career Agent About This Match
                    </Button>
                  </Link>

                  {selectedJob.sourceLink || selectedJob.applicationUrl ? (
                    <a
                      href={selectedJob.sourceLink || selectedJob.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors w-full sm:w-auto justify-center"
                    >
                      Apply Now
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Application link not available</span>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
