import React from 'react';

/**
 * Lightweight, safe Markdown renderer for HireMind AI chat messages.
 * Handles headings (###, ##, #), bold (**), italic (*), code blocks (```),
 * inline code (`), unordered lists (- or *), numbered lists (1.), and paragraph breaks.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = null;
  let listType = null; // 'ul' | 'ol'

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 text-slate-700">
            {currentList.map((item, i) => (
              <li key={i}>{formatInline(item)}</li>
            ))}
          </ul>
        );
      } else if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-2 text-slate-700">
            {currentList.map((item, i) => (
              <li key={i}>{formatInline(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
      listType = null;
    }
  };

  const formatInline = (text) => {
    // Split by inline code: `code`
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-slate-100 text-brand-700 font-mono text-[12px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Format bold: **text**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
          return (
            <strong key={`${index}-${bIdx}`} className="font-semibold text-slate-900">
              {bPart.slice(2, -2)}
            </strong>
          );
        }
        return bPart;
      });
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      return;
    }

    // Heading 3: ### Heading
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h3-${idx}`} className="text-sm font-bold text-slate-900 mt-3 mb-1.5">
          {formatInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      return;
    }

    // Heading 2: ## Heading
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h2-${idx}`} className="text-base font-bold text-slate-900 mt-4 mb-2">
          {formatInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      );
      return;
    }

    // Heading 1: # Heading
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h1-${idx}`} className="text-lg font-bold text-slate-900 mt-4 mb-2">
          {formatInline(trimmed.replace(/^#\s+/, ''))}
        </h2>
      );
      return;
    }

    // Unordered List: - item or * item
    if (/^[-*]\s+/.test(trimmed)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
        currentList = [];
      }
      currentList.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }

    // Ordered List: 1. item
    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
        currentList = [];
      }
      currentList.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }

    // Standard paragraph line
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed my-1.5 text-slate-700">
        {formatInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
