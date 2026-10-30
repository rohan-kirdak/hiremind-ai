import React from 'react';
import { MapPin, Briefcase, DollarSign, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatSalary } from '../../utils/categories';

export default function JobCard({
  job,
  onSelect,
  matchScore,
  matchedSkills,
  missingSkills,
}) {
  const {
    jobId,
    title,
    company,
    location,
    workMode,
    salary,
    skills = [],
    domain,
    sourceLink,
    applicationUrl,
  } = job;

  const applyUrl = sourceLink || applicationUrl;
  const domainName = domain?.categoryName || domain?.category || (typeof domain === 'string' ? domain : 'General');
  const roleName = domain?.matchedRole || domain?.role || null;

  // Match score color formatting
  const getScoreVariant = (score) => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'brand';
    if (score >= 30) return 'warning';
    return 'slate';
  };

  return (
    <Card hover className="flex flex-col justify-between h-full transition-all border-slate-200 hover:border-brand-300">
      <div>
        {/* Top bar: Domain & Optional Match Score */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="brand" size="sm">
            {domainName}
          </Badge>

          {typeof matchScore === 'number' && (
            <Badge variant={getScoreVariant(matchScore)} size="md" className="font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {matchScore}% Match
            </Badge>
          )}
        </div>

        {/* Title & Company */}
        <h3
          onClick={() => onSelect && onSelect(job)}
          className="text-base font-semibold text-slate-900 hover:text-brand-600 transition-colors cursor-pointer line-clamp-1"
          title={title}
        >
          {title}
        </h3>
        <p className="text-sm font-medium text-slate-600 mb-3">{company || 'Confidential'}</p>

        {/* Key Job Metadata: Location, Work Mode, Salary */}
        <div className="space-y-1.5 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{location || 'Worldwide / Remote'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{workMode || 'Remote'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">{formatSalary(salary)}</span>
            </div>
          </div>
        </div>

        {/* Skills Tags */}
        {Array.isArray(skills) && skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skills.slice(0, 4).map((skill, idx) => {
              const isMatched = Array.isArray(matchedSkills) && matchedSkills.includes(skill);
              return (
                <span
                  key={idx}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                    isMatched
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {skill}
                </span>
              );
            })}
            {skills.length > 4 && (
              <span className="text-[11px] px-1.5 py-0.5 text-slate-400 font-medium self-center">
                +{skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect && onSelect(job)}
          className="text-slate-600 hover:text-brand-600 px-2 text-xs"
        >
          View Details
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>

        {applyUrl && applyUrl !== 'Not specified' ? (
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
          >
            Apply
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : null}
      </div>
    </Card>
  );
}
