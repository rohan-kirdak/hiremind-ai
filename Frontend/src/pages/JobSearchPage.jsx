import React from 'react';
import Card from '../components/common/Card';

export default function JobSearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Search</h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore over 1,700 real job opportunities across IT, Finance, Marketing, Operations, and more.
        </p>
      </div>

      <Card>
        <Card.Title>Search & Filters</Card.Title>
        <Card.Description>Filter by title, domain category, or location.</Card.Description>
      </Card>
    </div>
  );
}
