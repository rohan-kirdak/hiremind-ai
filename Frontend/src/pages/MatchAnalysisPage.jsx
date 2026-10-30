import React from 'react';
import Card from '../components/common/Card';

export default function MatchAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Match Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">
          Deep dive into deterministic match scores, skill gaps, and role eligibility.
        </p>
      </div>

      <Card>
        <Card.Title>Match Intelligence</Card.Title>
        <Card.Description>Select a recommended job to analyze breakdown.</Card.Description>
      </Card>
    </div>
  );
}
