import React from 'react';
import Card from '../components/common/Card';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile & Resume</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload and review your extracted skills, domain classification, and professional background.
        </p>
      </div>

      <Card>
        <Card.Title>Resume Profile</Card.Title>
        <Card.Description>Upload PDF or DOCX file.</Card.Description>
      </Card>
    </div>
  );
}
