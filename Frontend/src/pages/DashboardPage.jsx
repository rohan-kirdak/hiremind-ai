import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Briefcase,
  UserCheck,
  TrendingUp,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Layers,
  Search,
  MessageSquare,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import JobCard from '../components/jobs/JobCard';
import JobDetailsModal from '../components/jobs/JobDetailsModal';
import { useProfile } from '../context/ProfileContext';
import { fetchRecommendations } from '../api/recommendations.api';
import { fetchJobs } from '../api/jobs.api';

export default function DashboardPage() {
  const { hasProfile, profile } = useProfile();

  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardJobs() {
      setLoading(true);
      setError(null);
      try {
        if (hasProfile && Array.isArray(profile.skills) && profile.skills.length > 0) {
          // Fetch real deterministic recommendations based on profile
          const res = await fetchRecommendations({
            candidateProfile: profile,
            limit: 3,
          });
          if (isMounted) {
            if (res?.success) {
              setRecommendedJobs(res.recommendations || []);
            } else {
              setRecommendedJobs([]);
            }
          }
        } else {
          // No profile yet: load featured jobs
          const res = await fetchJobs({ limit: 3 });
          if (isMounted) {
            if (res?.success) {
              setRecommendedJobs(res.jobs || []);
            } else {
              setRecommendedJobs([]);
            }
          }
        }
      } catch (err) {
        console.error('Dashboard jobs loading error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load recommendations.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardJobs();

    return () => {
      isMounted = false;
    };
  }, [hasProfile, profile]);

  return (
    <div className="space-y-8">
      {/* 1. Welcome Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="brand" size="sm" className="mb-3 bg-brand-500/20 text-brand-300 ring-brand-400/30">
            Intelligent Multi-Domain Career Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {hasProfile && profile.name
              ? `Welcome back, ${profile.name}!`
              : hasProfile && profile.designation
              ? `Welcome back, ${profile.designation}!`
              : 'Welcome to HireMind AI'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            {hasProfile
              ? `Your resume is active with ${profile.skills?.length || 0} recognized skills in ${profile.domain?.categoryName || 'your professional domain'}. Explore deterministic job matches and career advice below.`
              : 'Discover transparent job opportunities, analyze skill gaps, and explore AI career guidance tailored to your professional background.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/jobs">
              <Button variant="primary" size="md" icon={Search}>
                Browse 1,700+ Jobs
              </Button>
            </Link>
            <Link to="/assistant">
              <Button variant="outline" size="md" icon={MessageSquare} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Ask AI Assistant
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Platform Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">1,700+</div>
            <div className="text-xs text-slate-500 font-medium">Active Jobs in Dataset</div>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">15 Domains</div>
            <div className="text-xs text-slate-500 font-medium">Tech & Non-Tech Covered</div>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">Deterministic</div>
            <div className="text-xs text-slate-500 font-medium">Transparent V4.1 Engine</div>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            hasProfile ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {hasProfile ? profile.designation || 'Active Profile' : 'No Resume'}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {hasProfile ? `${profile.skills?.length || 0} Skills Extracted` : 'Upload to Unlock Matching'}
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Profile Completion Card (if not uploaded) */}
      {!hasProfile && (
        <Card className="bg-gradient-to-r from-brand-50/50 to-indigo-50/30 border-brand-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Complete Your Candidate Profile
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                  Upload your PDF or DOCX resume to extract your skills, experience, and domain. Our deterministic engine will calculate transparent match scores for every job listing.
                </p>
              </div>
            </div>

            <Link to="/profile" className="shrink-0">
              <Button variant="primary" size="sm">
                Upload Resume Now
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 4. Top Recommended Jobs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {hasProfile ? 'Top Matches for Your Profile' : 'Featured Job Listings'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {hasProfile
                ? 'Deterministic recommendations ranked by role title, skill overlap, and experience.'
                : 'Showing active listings from the dataset. Upload a resume to see custom match percentages.'}
            </p>
          </div>

          <Link
            to="/jobs"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View all jobs
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Calculating job recommendations..." />
        ) : error ? (
          <ErrorAlert title="Error loading recommendations" message={error} />
        ) : recommendedJobs.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-slate-500">No recommendations available at this time.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedJobs.map((job) => (
              <JobCard
                key={job.jobId}
                job={job}
                matchScore={job.matchScore}
                matchedSkills={job.matchedSkills}
                missingSkills={job.missingSkills}
                onSelect={(selected) => setSelectedJob(selected)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <Link to="/jobs" className="group">
          <Card hover className="h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                Search & Filter
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              Filter across 15 domains including IT, Marketing, HR, Finance, and Operations.
            </p>
          </Card>
        </Link>

        <Link to="/assistant" className="group">
          <Card hover className="h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                AI Career Guidance
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              Ask about skill gaps, interview preparation, and career transition pathways.
            </p>
          </Card>
        </Link>

        <Link to="/match-analysis" className="group">
          <Card hover className="h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                Match Intelligence
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              Inspect transparent scoring breakdowns across title, skills, and experience.
            </p>
          </Card>
        </Link>
      </div>

      {/* Detail Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          matchAnalysis={
            selectedJob.matchScore
              ? {
                  matchScore: selectedJob.matchScore,
                  scoreBreakdown: selectedJob.scoreBreakdown,
                  matchedSkills: selectedJob.matchedSkills,
                  missingSkills: selectedJob.missingSkills,
                }
              : null
          }
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
