import React from 'react';
import Card from '../components/common/Card';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Welcome to HireMind AI — your intelligent multi-domain career portal.
        </p>
      </div>

      <Card>
        <Card.Title>Overview</Card.Title>
        <Card.Description>Dashboard metrics and quick actions.</Card.Description>
      </Card>
    </div>
  );
}
