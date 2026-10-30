export const JOB_CATEGORIES = [
  { id: '', name: 'All Domains' },
  { id: 'it-software', name: 'IT & Software' },
  { id: 'marketing', name: 'Marketing & Growth' },
  { id: 'sales', name: 'Sales & BD' },
  { id: 'hr', name: 'HR & Recruiting' },
  { id: 'finance', name: 'Finance & Accounting' },
  { id: 'design', name: 'Design & Creative' },
  { id: 'support', name: 'Customer Support' },
  { id: 'operations', name: 'Operations & Management' },
  { id: 'healthcare', name: 'Healthcare & Clinical' },
  { id: 'education', name: 'Education & Training' },
  { id: 'legal', name: 'Legal & Compliance' },
  { id: 'logistics', name: 'Logistics & Supply Chain' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'hospitality', name: 'Hospitality & Services' },
];

export const formatSalary = (salary) => {
  if (!salary) return 'Not disclosed';
  if (typeof salary === 'string') return salary;
  if (typeof salary === 'object') {
    const { min, max, currency = '$', period = 'year' } = salary;
    if (min && max) {
      return `${currency}${Number(min).toLocaleString()} - ${currency}${Number(max).toLocaleString()} / ${period}`;
    }
    if (min) {
      return `From ${currency}${Number(min).toLocaleString()} / ${period}`;
    }
    if (max) {
      return `Up to ${currency}${Number(max).toLocaleString()} / ${period}`;
    }
  }
  return 'Not disclosed';
};
