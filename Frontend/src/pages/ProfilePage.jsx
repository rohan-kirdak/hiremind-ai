import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Layers,
  ArrowRight,
  FolderGit2,
  Award,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { parseResumeFile } from '../api/resume.api';
import { useProfile } from '../context/ProfileContext';

export default function ProfilePage() {
  const { profile, setProfile, clearProfile, hasProfile, conversationId } = useProfile();

  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setUploadError(null);
    setUploadSuccess(null);

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setUploadError('Please select a valid PDF or DOCX file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds the 5MB size limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const data = await parseResumeFile(selectedFile, conversationId);

      if (data && data.success && data.profile) {
        // Enrich profile with domain information if returned at top level
        const fullProfile = {
          ...data.profile,
          domain: data.domain || data.profile.domain || null,
          summary: data.summary || data.profile.summary || '',
          characterCount: data.characterCount || 0,
        };

        setProfile(fullProfile);
        setUploadSuccess('Resume parsed and candidate profile saved successfully!');
        setSelectedFile(null);
      } else {
        throw new Error(data?.message || 'Unable to parse resume details.');
      }
    } catch (err) {
      console.error('Resume parsing error:', err);
      setUploadError(err.message || 'Failed to parse resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your extracted profile?')) {
      clearProfile();
      setSelectedFile(null);
      setUploadSuccess(null);
      setUploadError(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Profile & Resume</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload your resume in PDF or DOCX format. HireMind AI automatically extracts your designation, skills, and domain taxonomy for deterministic matching.
        </p>
      </div>

      {/* Upload Box */}
      <Card className="border-2 border-dashed border-slate-200">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`p-6 sm:p-10 rounded-xl flex flex-col items-center justify-center text-center transition-colors ${
            dragActive ? 'bg-brand-50 border-brand-400' : 'bg-slate-50/50'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base font-semibold text-slate-900">
            {selectedFile ? selectedFile.name : 'Choose a file or drag & drop here'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Supported formats: <span className="font-semibold text-slate-700">PDF, DOCX</span> (Maximum 5MB)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Browse Files
            </Button>

            {selectedFile && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleUpload}
                isLoading={uploading}
                disabled={uploading}
              >
                Parse & Save Profile
              </Button>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="mt-4">
            <ErrorAlert title="Resume Upload Error" message={uploadError} />
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}
      </Card>

      {/* Extracted Profile Details View */}
      {hasProfile && profile ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Active Candidate Profile
              </h2>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={Trash2}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              Clear Profile
            </Button>
          </div>

          {/* Primary Profile Card */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Target Designation / Role
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {profile.designation || 'Identified Professional'}
                </h3>
                {profile.name && (
                  <p className="text-xs text-slate-500 mt-0.5">{profile.name}</p>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Professional Domain
                </span>
                <div className="mt-1">
                  <Badge variant="brand" size="md">
                    <Layers className="w-3.5 h-3.5 mr-1" />
                    {profile.domain?.categoryName || profile.domain?.category || 'General'}
                  </Badge>
                  {profile.domain?.role && (
                    <p className="text-xs text-slate-500 mt-1">
                      Matched Role: <span className="font-medium text-slate-700">{profile.domain.role}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Experience Level
                </span>
                <div className="flex items-center gap-1.5 mt-1 text-slate-800 font-semibold text-base">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                  <span>
                    {profile.experienceYears
                      ? `${profile.experienceYears} Years Estimated`
                      : 'Professional Experience'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {profile.summary && (
              <div className="py-5 border-b border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Professional Summary
                </span>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {profile.summary}
                </p>
              </div>
            )}

            {/* Extracted Skills List */}
            <div className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Normalized Skills ({profile.skills?.length || 0})
                </span>
                <span className="text-xs text-slate-400">
                  Used for deterministic skill overlap scoring
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-700/10 rounded-lg text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No skills extracted.</p>
                )}
              </div>
            </div>

            {/* Education & Certifications if present */}
            {(profile.education || profile.certifications?.length > 0 || profile.projects?.length > 0) && (
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {profile.education && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                      <GraduationCap className="w-4 h-4 text-slate-500" />
                      Education
                    </div>
                    <p className="text-slate-600">
                      {typeof profile.education === 'string'
                        ? profile.education
                        : JSON.stringify(profile.education)}
                    </p>
                  </div>
                )}

                {profile.certifications && profile.certifications.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                      <Award className="w-4 h-4 text-slate-500" />
                      Certifications
                    </div>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {profile.certifications.map((c, i) => (
                        <li key={i}>{typeof c === 'string' ? c : c.name || JSON.stringify(c)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Quick Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link to="/match-analysis" className="w-full sm:w-auto">
              <Button variant="primary" size="md" icon={Sparkles} className="w-full sm:w-auto">
                View Match Analysis
              </Button>
            </Link>

            <Link to="/assistant" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                Ask Career Guidance Agent
              </Button>
            </Link>

            <Link to="/jobs" className="w-full sm:w-auto">
              <Button variant="ghost" size="md" className="w-full sm:w-auto text-slate-600">
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <Card className="text-center py-10 bg-slate-50/50">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-700">No Resume Profile on Record</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Upload your resume above to extract your skills, designation, and experience. Your profile will be automatically saved in your browser and used across all platform features.
          </p>
        </Card>
      )}
    </div>
  );
}
