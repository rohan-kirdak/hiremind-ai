'use strict';

/**
 * HireMind AI — Multi-Domain Job Category & Role Taxonomy
 * Covers IT, Marketing, Sales, HR, Finance, Design, Support, Operations,
 * Healthcare, Education, Legal, Logistics, Engineering, and Hospitality.
 */

const JOB_CATEGORIES = [
  { id: 'it-software', name: 'Information Technology & Software' },
  { id: 'marketing', name: 'Marketing & Growth' },
  { id: 'sales', name: 'Sales & Business Development' },
  { id: 'hr', name: 'Human Resources & Recruiting' },
  { id: 'finance', name: 'Finance & Accounting' },
  { id: 'design', name: 'Design & Creative' },
  { id: 'support', name: 'Customer Support & Success' },
  { id: 'operations', name: 'Operations & Project Management' },
  { id: 'healthcare', name: 'Healthcare & Clinical' },
  { id: 'education', name: 'Education & Training' },
  { id: 'legal', name: 'Legal & Compliance' },
  { id: 'engineering', name: 'Engineering (Non-Software)' },
  { id: 'logistics', name: 'Logistics & Supply Chain' },
  { id: 'hospitality', name: 'Hospitality & Services' },
  { id: 'general', name: 'General & Unclassified' },
];

const JOB_ROLES = [
  // 1. IT & Software
  { role: 'Frontend Developer', categoryId: 'it-software', patterns: [/\b(front[- ]?end|react|vue|angular)\s*(developer|engineer)\b/i] },
  { role: 'Backend Developer', categoryId: 'it-software', patterns: [/\b(back[- ]?end|node|python|java|php|golang|ruby|\.net)\s*(developer|engineer)\b/i] },
  { role: 'Full Stack Developer', categoryId: 'it-software', patterns: [/\b(full[- ]?stack|web)\s*(developer|engineer)\b/i] },
  { role: 'Mobile Developer', categoryId: 'it-software', patterns: [/\b(ios|android|mobile|flutter|react native)\s*(developer|engineer)\b/i] },
  { role: 'DevOps / Cloud Engineer', categoryId: 'it-software', patterns: [/\b(devops|site reliability|sre|cloud|platform|infrastructure)\s*(engineer|architect)\b/i] },
  { role: 'Data Engineer / Scientist', categoryId: 'it-software', patterns: [/\b(data engineer|data scientist|machine learning|ai engineer|analytics engineer)\b/i] },
  { role: 'QA / Test Engineer', categoryId: 'it-software', patterns: [/\b(qa|quality assurance|software test|automation test)\s*(engineer|analyst|tester)\b/i] },
  { role: 'Cybersecurity Specialist', categoryId: 'it-software', patterns: [/\b(security engineer|cybersecurity|infosec|soc analyst|penetration tester)\b/i] },
  { role: 'Solutions Architect', categoryId: 'it-software', patterns: [/\b(solutions?|enterprise|software|cloud|systems?)\s*architect\b/i] },

  // 2. Marketing
  { role: 'SEO Executive', categoryId: 'marketing', patterns: [/\b(seo|search engine optimization)\s*(executive|specialist|strategist|manager|analyst)\b/i, /\bseo\b/i] },
  { role: 'Performance Marketer', categoryId: 'marketing', patterns: [/\b(performance marketing|paid media|paid ads|growth marketer|growth hacker|ppc|sem)\b/i] },
  { role: 'Content Strategist / Copywriter', categoryId: 'marketing', patterns: [/\b(content (marketing|strategist|writer|creator)|copywriter|editorial)\b/i] },
  { role: 'Social Media Specialist', categoryId: 'marketing', patterns: [/\b(social media|community manager|influencer marketing)\b/i] },
  { role: 'Marketing Manager / Director', categoryId: 'marketing', patterns: [/\bmarketing\s*(manager|director|lead|head|vp|coordinator)\b/i] },

  // 3. Sales
  { role: 'Account Executive', categoryId: 'sales', patterns: [/\b(account executive|ae|enterprise account executive)\b/i] },
  { role: 'Business Development Representative', categoryId: 'sales', patterns: [/\b(business development|bdr|sdr|sales development)\b/i] },
  { role: 'Sales Manager / Director', categoryId: 'sales', patterns: [/\bsales\s*(manager|director|lead|vp|head)\b/i] },
  { role: 'Account Manager', categoryId: 'sales', patterns: [/\baccount manager\b/i] },
  { role: 'Sales Representative', categoryId: 'sales', patterns: [/\bsales (representative|rep|specialist|associate)\b/i] },

  // 4. Human Resources & Recruiting
  { role: 'HR Recruiter', categoryId: 'hr', patterns: [/\b(recruiter|recruiting|talent acquisition|technical recruiter|sourcer)\b/i] },
  { role: 'HR Generalist / Manager', categoryId: 'hr', patterns: [/\b(human resources|hr)\s*(generalist|manager|director|business partner|hrbp|coordinator|associate)\b/i] },
  { role: 'People Operations Specialist', categoryId: 'hr', patterns: [/\b(people operations|people partner|onboarding|total rewards|compensation|benefits specialist)\b/i] },

  // 5. Finance & Accounting
  { role: 'Accountant', categoryId: 'finance', patterns: [/\b(accountant|staff accountant|senior accountant|junior accountant|accounting specialist)\b/i] },
  { role: 'Financial Analyst', categoryId: 'finance', patterns: [/\b(financial analyst|finance analyst|fp&a|financial modeling)\b/i] },
  { role: 'Bookkeeper / Billing Specialist', categoryId: 'finance', patterns: [/\b(bookkeeper|billing specialist|billing coordinator|accounts payable|accounts receivable)\b/i] },
  { role: 'Auditor / Controller / Finance Manager', categoryId: 'finance', patterns: [/\b(auditor|financial controller|finance director|finance manager|treasury|tax (manager|specialist|analyst))\b/i] },

  // 6. Design & Creative
  { role: 'Graphic Designer', categoryId: 'design', patterns: [/\b(graphic designer|visual designer|brand designer|illustrator|animator)\b/i] },
  { role: 'UI/UX Designer', categoryId: 'design', patterns: [/\b(ui\/ux|ux\/ui|product designer|user experience|user interface|interaction designer)\b/i] },
  { role: 'Creative Director / Art Director', categoryId: 'design', patterns: [/\b(art director|creative director)\b/i] },

  // 7. Customer Support & Success
  { role: 'Customer Support Executive', categoryId: 'support', patterns: [/\b(customer support|customer service|client support|help desk|support specialist|technical support)\b/i] },
  { role: 'Customer Success Manager', categoryId: 'support', patterns: [/\b(customer success|csm|client success)\b/i] },

  // 8. Operations & Project Management
  { role: 'Project Manager', categoryId: 'operations', patterns: [/\b(project manager|project coordinator|project lead|project scheduler)\b/i] },
  { role: 'Program Manager', categoryId: 'operations', patterns: [/\b(program manager|portfolio manager)\b/i] },
  { role: 'Business Analyst', categoryId: 'operations', patterns: [/\b(business analyst|operations analyst|process improvement)\b/i] },
  { role: 'Operations Manager', categoryId: 'operations', patterns: [/\boperations (manager|director|lead|coordinator)\b/i] },
  { role: 'Scrum Master / Agile Coach', categoryId: 'operations', patterns: [/\b(scrum master|agile coach)\b/i] },

  // 9. Healthcare & Clinical
  { role: 'Clinical Trial Specialist', categoryId: 'healthcare', patterns: [/\b(clinical trial|clinical research|cra|clinical program|clinical data)\b/i] },
  { role: 'Nurse / Clinical Practitioner', categoryId: 'healthcare', patterns: [/\b(nurse|registered nurse|clinical liaison|physician|radiologist|pharmacist|medical officer)\b/i] },
  { role: 'Healthcare Administrator', categoryId: 'healthcare', patterns: [/\b(healthcare administrator|health systems coordinator|medical practice manager)\b/i] },

  // 10. Education & Training
  { role: 'Teacher / Instructor', categoryId: 'education', patterns: [/\b(teacher|tutor|instructor|faculty|professor|lecturer|educator)\b/i] },
  { role: 'Instructional Designer / Curriculum Developer', categoryId: 'education', patterns: [/\b(instructional designer|curriculum developer|education specialist)\b/i] },

  // 11. Legal & Compliance
  { role: 'Legal Counsel / Attorney', categoryId: 'legal', patterns: [/\b(legal counsel|attorney|lawyer|corporate counsel|legal advisor)\b/i] },
  { role: 'Compliance Officer / Paralegal', categoryId: 'legal', patterns: [/\b(compliance officer|regulatory specialist|paralegal|contracts manager)\b/i] },

  // 12. Engineering (Non-Software)
  { role: 'Mechanical / Civil / Electrical Engineer', categoryId: 'engineering', patterns: [/\b(mechanical|civil|electrical|hvac|structural|chemical|hardware)\s*engineer\b/i] },

  // 13. Logistics & Supply Chain
  { role: 'Supply Chain / Logistics Specialist', categoryId: 'logistics', patterns: [/\b(supply chain|logistics|procurement|inventory|freight|warehouse)\b/i] },

  // 14. Hospitality & Services
  { role: 'Hospitality & Services Professional', categoryId: 'hospitality', patterns: [/\b(pilot|aviation|flight attendant|hotel|hospitality|concierge|travel consultant)\b/i] },
];

/**
 * Classifies a job or candidate profile into a primary category and specific role.
 *
 * @param {string} title Job title or candidate designation
 * @param {string} [description=''] Job description or profile summary
 * @param {Array<string>} [categories=[]] Source categories (e.g. from Himalayas)
 * @returns {{ categoryId: string, categoryName: string, roleName: string, confidence: string }}
 */
function classifyJobDomain(title = '', description = '', categories = []) {
  const cleanTitle = String(title ?? '').trim();
  const catsArray = Array.isArray(categories) ? categories : [];
  const fullText = [cleanTitle, catsArray.join(' '), String(description ?? '').slice(0, 1000)].join(' ');

  // 1. First priority: Check exact role patterns against Title
  for (const roleDef of JOB_ROLES) {
    if (roleDef.patterns.some((p) => p.test(cleanTitle))) {
      const cat = JOB_CATEGORIES.find((c) => c.id === roleDef.categoryId);
      return {
        categoryId: roleDef.categoryId,
        categoryName: cat ? cat.name : 'General & Unclassified',
        roleName: roleDef.role,
        confidence: 'high',
      };
    }
  }

  // 2. Second priority: Check categories array provided by dataset
  if (catsArray.length > 0) {
    const catText = catsArray.join(' ');
    for (const roleDef of JOB_ROLES) {
      if (roleDef.patterns.some((p) => p.test(catText))) {
        const cat = JOB_CATEGORIES.find((c) => c.id === roleDef.categoryId);
        return {
          categoryId: roleDef.categoryId,
          categoryName: cat ? cat.name : 'General & Unclassified',
          roleName: roleDef.role,
          confidence: 'medium',
        };
      }
    }
  }

  // 3. Third priority: Check broader category patterns against Title & Description
  const broadCategoryRules = [
    { id: 'it-software', patterns: [/\b(software|developer|frontend|backend|fullstack|devops|data engineer|cloud|cybersecurity|architect|programmer)\b/i] },
    { id: 'marketing', patterns: [/\b(marketing|seo|growth|copywriter|content|paid media|ppc|social media)\b/i] },
    { id: 'sales', patterns: [/\b(sales|account executive|bdr|sdr|business development|account manager)\b/i] },
    { id: 'hr', patterns: [/\b(human resources|hr\b|recruiter|recruiting|talent acquisition|people ops)\b/i] },
    { id: 'finance', patterns: [/\b(accountant|accounting|finance|financial|bookkeeper|payroll|billing|tax\b|auditor)\b/i] },
    { id: 'design', patterns: [/\b(designer|ui\/ux|graphic design|creative director|art director)\b/i] },
    { id: 'support', patterns: [/\b(customer support|customer success|customer service|help desk|client support)\b/i] },
    { id: 'operations', patterns: [/\b(operations|project manager|program manager|business analyst|scrum master)\b/i] },
    { id: 'healthcare', patterns: [/\b(clinical|nurse|medical|health|pharmacology|radiologist)\b/i] },
    { id: 'education', patterns: [/\b(teacher|tutor|faculty|professor|instructor|education)\b/i] },
    { id: 'legal', patterns: [/\b(legal|counsel|attorney|lawyer|compliance|regulatory)\b/i] },
    { id: 'logistics', patterns: [/\b(supply chain|logistics|procurement|inventory)\b/i] },
    { id: 'engineering', patterns: [/\b(mechanical|civil|electrical|hvac|structural)\b/i] },
    { id: 'hospitality', patterns: [/\b(pilot|aviation|flight|hotel|hospitality|travel)\b/i] },
  ];

  for (const rule of broadCategoryRules) {
    if (rule.patterns.some((p) => p.test(cleanTitle))) {
      const cat = JOB_CATEGORIES.find((c) => c.id === rule.id);
      return {
        categoryId: rule.id,
        categoryName: cat ? cat.name : 'General & Unclassified',
        roleName: cleanTitle || 'Specialist',
        confidence: 'medium',
      };
    }
  }

  // Fallback to description
  for (const rule of broadCategoryRules) {
    if (rule.patterns.some((p) => p.test(fullText))) {
      const cat = JOB_CATEGORIES.find((c) => c.id === rule.id);
      return {
        categoryId: rule.id,
        categoryName: cat ? cat.name : 'General & Unclassified',
        roleName: cleanTitle || 'Professional',
        confidence: 'low',
      };
    }
  }

  return {
    categoryId: 'general',
    categoryName: 'General & Unclassified',
    roleName: cleanTitle || 'General Professional',
    confidence: 'none',
  };
}

module.exports = {
  JOB_CATEGORIES,
  JOB_ROLES,
  classifyJobDomain,
};

