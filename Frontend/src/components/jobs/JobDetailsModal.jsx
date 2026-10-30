import React, { useEffect } from 'react';
import { X, MapPin, Briefcase, DollarSign, ExternalLink, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatSalary } from '../../utils/categories';

export default function JobDetailsModal({ job, onClose, matchAnalysis = null }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!job) return null;

  const {
    title,
    company,
    location,
    workMode,
    salary,
    description,
    skills = [],
    domain,
    sourceLink,
    applicationUrl,
  } = job;

  const applyUrl = sourceLink || applicationUrl;
  const domainName = domain?.categoryName || domain?.category || (typeof domain === 'string' ? domain : 'General');
  const roleName = domain?.matchedRole || domain?.role || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="brand" size="sm">
                {domainName}
              </Badge>
              {roleName && (
                <Badge variant="slate" size="sm">
                  {roleName}
                </Badge>
              )}
              {matchAnalysis?.matchScore && (
                <Badge variant="success" size="sm">
                  {matchAnalysis.matchScore}% Match
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{title}</h2>
            <p className="text-sm font-semibold text-slate-600 mt-1">{company || 'Confidential'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-slate-400 font-medium">Location</span>
                <span className="font-semibold text-slate-800">{location || 'Remote / Worldwide'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-slate-400 font-medium">Work Mode</span>
                <span className="font-semibold text-slate-800">{workMode || 'Full-time'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-slate-400 font-medium">Compensation</span>
                <span className="font-semibold text-slate-800">{formatSalary(salary)}</span>
              </div>
            </div>
          </div>

          {/* Match Analysis Details (if provided) */}
          {matchAnalysis && (
            <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-brand-900 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  Deterministic Match Breakdown
                </div>
                <span className="text-base font-bold text-brand-700">
                  {matchAnalysis.matchScore}/100
                </span>
              </div>

              {matchAnalysis.scoreBreakdown && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3 text-center">
                  <div className="bg-white p-2 rounded-lg border border-brand-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Title</span>
                    <span className="font-bold text-slate-800">{matchAnalysis.scoreBreakdown.title}%</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-brand-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Skills</span>
                    <span className="font-bold text-slate-800">{matchAnalysis.scoreBreakdown.skills}%</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-brand-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Experience</span>
                    <span className="font-bold text-slate-800">{matchAnalysis.scoreBreakdown.experience}%</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-brand-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Location</span>
                    <span className="font-bold text-slate-800">{matchAnalysis.scoreBreakdown.location}%</span>
                  </div>
                </div>
              )}

              {matchAnalysis.matchedSkills?.length > 0 && (
                <div className="text-xs mb-2">
                  <span className="font-semibold text-emerald-800 block mb-1">Matched Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {matchAnalysis.matchedSkills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchAnalysis.missingSkills?.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold text-amber-800 block mb-1">Missing / Gap Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {matchAnalysis.missingSkills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-medium">
                        ! {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Required Skills */}
          {Array.isArray(skills) && skills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
                Identified Job Skills ({skills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-700 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
              Job Description
            </h4>
            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {description || 'No detailed description provided.'}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {applyUrl && applyUrl !== 'Not specified' ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
            >
              Apply on Company Site
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <span className="text-xs text-slate-400">Application link not available</span>
          )}
        </div>
      </div>
    </div>
  );
}
