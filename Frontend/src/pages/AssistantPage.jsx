import React from 'react';
import Card from '../components/common/Card';

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Career Assistant</h1>
        <p className="text-sm text-slate-500 mt-1">
          Chat with our multi-agent career intelligence orchestrator for guidance, resume analysis, and interview prep.
        </p>
      </div>

      <Card>
        <Card.Title>Conversation</Card.Title>
        <Card.Description>Interactive AI Chat session.</Card.Description>
      </Card>
    </div>
  );
}
