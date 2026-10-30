'use strict';

/**
 * HireMind AI — Multi-Domain Centralized Skill Catalog & Normalization Utility
 * Covers technical and non-technical professional domains:
 * IT, Marketing, Sales, HR, Finance, Design, Customer Support, Operations, Healthcare, and Legal.
 */

const SKILL_CATALOG = [
  // Technical / Software / IT
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', '.NET', 'SQL',
  'Node.js', 'Express.js', 'React.js', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS',
  'REST APIs', 'WebSockets', 'Socket.IO', 'JWT', 'MongoDB', 'MySQL',
  'PostgreSQL', 'Redis', 'OpenAI API', 'Prompt Engineering', 'Docker',
  'Git', 'GitHub Actions', 'Postman', 'Vitest', 'BullMQ', 'AWS', 'Azure',
  'GCP', 'Flutter', 'Dart', 'Angular', 'Vue.js', 'PHP', 'Kubernetes',
  'GraphQL', 'Salesforce', 'ServiceNow', 'Workday', 'SAP', 'Shopify',
  'Google Ads', 'Meta Ads', 'Android', 'Kotlin', 'Swift', 'iOS', 'React Native',
  'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Figma', 'Selenium',
  'Playwright', 'Cypress', 'Jest', 'Linux', 'Terraform', 'Jenkins', 'Kafka',
  'Power BI', 'Tableau', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch',
  'Golang', 'Ruby', 'Ruby on Rails', 'CI/CD', 'Machine Learning', 'Data Analysis',
  'MERN',

  // Finance & Accounting
  'Accounting', 'Financial Analysis', 'Bookkeeping', 'QuickBooks', 'Auditing',
  'Taxation', 'Financial Modeling', 'Payroll', 'Excel', 'Budgeting', 'GAAP',
  'Accounts Payable', 'Accounts Receivable',

  // Marketing & Growth
  'SEO', 'SEM', 'Content Marketing', 'Copywriting', 'Email Marketing',
  'Google Analytics', 'Social Media Marketing', 'PPC', 'HubSpot', 'Brand Strategy',

  // Human Resources & Recruiting
  'Recruiting', 'Talent Acquisition', 'Onboarding', 'Employee Relations',
  'HRIS', 'Performance Management', 'Sourcing', 'Applicant Tracking Systems',

  // Design & Creative
  'Graphic Design', 'UI/UX Design', 'Adobe Photoshop', 'Adobe Illustrator',
  'Wireframing', 'Prototyping', 'User Research',

  // Customer Support & Success
  'Customer Support', 'Customer Success', 'Zendesk', 'Intercom', 'Help Scout',
  'CRM',

  // Operations & Project Management
  'Project Management', 'Agile', 'Scrum', 'Jira', 'Asana',
  'Business Analysis', 'Risk Management', 'Process Improvement', 'Stakeholder Management',

  // Sales & Business Development
  'B2B Sales', 'Lead Generation', 'Cold Calling', 'Account Management',
  'Pipeline Management', 'Negotiation',

  // Healthcare & Clinical
  'Clinical Trials', 'Patient Care', 'Regulatory Compliance', 'Healthcare Administration',

  // Legal & Compliance
  'Contract Management', 'Legal Research',
];

const SKILL_ALIASES = {
  // HTML / CSS variations
  'html': 'html',
  'html5': 'html',
  'html 5': 'html',
  'css': 'css',
  'css3': 'css',
  'css 3': 'css',
  'tailwind': 'tailwind css',
  'tailwindcss': 'tailwind css',
  'tailwind css': 'tailwind css',

  // JavaScript / TypeScript frameworks & runtimes
  'javascript': 'javascript',
  'js': 'javascript',
  'es6': 'javascript',
  'typescript': 'typescript',
  'react': 'react.js',
  'reactjs': 'react.js',
  'react.js': 'react.js',
  'react js': 'react.js',
  'node': 'node.js',
  'nodejs': 'node.js',
  'node.js': 'node.js',
  'node js': 'node.js',
  'express': 'express.js',
  'expressjs': 'express.js',
  'express.js': 'express.js',
  'nextjs': 'next.js',
  'next.js': 'next.js',
  'vue': 'vue.js',
  'vuejs': 'vue.js',
  'vue.js': 'vue.js',
  'angular': 'angular',
  'angularjs': 'angular',
  'angular.js': 'angular',
  'react native': 'react native',
  'react-native': 'react native',

  // Backend & APIs
  'rest api': 'rest apis',
  'rest apis': 'rest apis',
  'restful api': 'rest apis',
  'restful apis': 'rest apis',
  'restful': 'rest apis',
  'socket io': 'socket.io',
  'socketio': 'socket.io',
  'socket.io': 'socket.io',
  'websocket': 'websockets',
  'websockets': 'websockets',
  'jwt': 'jwt',
  'json web token': 'jwt',
  'json web tokens': 'jwt',
  'spring boot': 'spring boot',
  'springboot': 'spring boot',
  'asp.net': '.net',
  'dotnet': '.net',
  'dot net': '.net',
  '.net': '.net',
  'c sharp': 'c#',
  'csharp': 'c#',
  'c#': 'c#',
  'c plus plus': 'c++',
  'cpp': 'c++',
  'c++': 'c++',
  'rails': 'ruby on rails',
  'ruby on rails': 'ruby on rails',
  'golang': 'golang',
  'go lang': 'golang',

  // Databases
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'postgre sql': 'postgresql',
  'postgressql': 'postgresql',
  'mongo': 'mongodb',
  'mongodb': 'mongodb',
  'sql': 'sql',
  'mysql': 'mysql',
  'redis': 'redis',

  // Cloud & DevOps
  'aws': 'aws',
  'amazon web services': 'aws',
  'amazon aws': 'aws',
  'gcp': 'gcp',
  'google cloud': 'gcp',
  'google cloud platform': 'gcp',
  'azure': 'azure',
  'microsoft azure': 'azure',
  'k8s': 'kubernetes',
  'kubernetes': 'kubernetes',
  'ci cd': 'ci/cd',
  'ci/cd': 'ci/cd',
  'continuous integration': 'ci/cd',
  'github actions': 'github actions',
  'github action': 'github actions',

  // Data / AI
  'power bi': 'power bi',
  'powerbi': 'power bi',
  'openai': 'openai api',
  'openai api': 'openai api',
  'prompt engineering': 'prompt engineering',

  // Enterprise & Marketing Platforms
  'servicenow': 'servicenow',
  'service-now': 'servicenow',
  'google ads': 'google ads',
  'adwords': 'google ads',
  'meta ads': 'meta ads',
  'facebook ads': 'meta ads',

  // Finance & Accounting Aliases
  'accounting': 'accounting',
  'financial analysis': 'financial analysis',
  'bookkeeping': 'bookkeeping',
  'quickbooks': 'quickbooks',
  'quick books': 'quickbooks',
  'auditing': 'auditing',
  'taxation': 'taxation',
  'tax preparation': 'taxation',
  'financial modeling': 'financial modeling',
  'payroll': 'payroll',
  'excel': 'excel',
  'ms excel': 'excel',
  'microsoft excel': 'excel',
  'advanced excel': 'excel',
  'budgeting': 'budgeting',
  'gaap': 'gaap',
  'us gaap': 'gaap',
  'accounts payable': 'accounts payable',
  'accounts receivable': 'accounts receivable',

  // Marketing Aliases
  'seo': 'seo',
  'search engine optimization': 'seo',
  'sem': 'sem',
  'search engine marketing': 'sem',
  'content marketing': 'content marketing',
  'copywriting': 'copywriting',
  'email marketing': 'email marketing',
  'google analytics': 'google analytics',
  'ga4': 'google analytics',
  'social media marketing': 'social media marketing',
  'ppc': 'ppc',
  'hubspot': 'hubspot',
  'brand strategy': 'brand strategy',

  // HR Aliases
  'recruiting': 'recruiting',
  'recruitment': 'recruiting',
  'talent acquisition': 'talent acquisition',
  'onboarding': 'onboarding',
  'employee relations': 'employee relations',
  'hris': 'hris',
  'performance management': 'performance management',
  'sourcing': 'sourcing',
  'ats': 'applicant tracking systems',
  'applicant tracking systems': 'applicant tracking systems',

  // Design Aliases
  'graphic design': 'graphic design',
  'ui/ux design': 'ui/ux design',
  'ui/ux': 'ui/ux design',
  'ux/ui': 'ui/ux design',
  'photoshop': 'adobe photoshop',
  'adobe photoshop': 'adobe photoshop',
  'illustrator': 'adobe illustrator',
  'adobe illustrator': 'adobe illustrator',
  'wireframing': 'wireframing',
  'prototyping': 'prototyping',
  'user research': 'user research',

  // Customer Support Aliases
  'customer support': 'customer support',
  'customer service': 'customer support',
  'client support': 'customer support',
  'customer success': 'customer success',
  'client success': 'customer success',
  'zendesk': 'zendesk',
  'intercom': 'intercom',
  'help scout': 'help scout',
  'helpscout': 'help scout',
  'crm': 'crm',

  // Operations Aliases
  'project management': 'project management',
  'agile': 'agile',
  'scrum': 'scrum',
  'jira': 'jira',
  'asana': 'asana',
  'business analysis': 'business analysis',
  'risk management': 'risk management',
  'process improvement': 'process improvement',
  'stakeholder management': 'stakeholder management',

  // Sales Aliases
  'b2b sales': 'b2b sales',
  'lead generation': 'lead generation',
  'lead gen': 'lead generation',
  'cold calling': 'cold calling',
  'account management': 'account management',
  'pipeline management': 'pipeline management',
  'negotiation': 'negotiation',

  // Healthcare Aliases
  'clinical trials': 'clinical trials',
  'clinical research': 'clinical trials',
  'patient care': 'patient care',
  'regulatory compliance': 'regulatory compliance',
  'healthcare administration': 'healthcare administration',

  // Legal Aliases
  'contract management': 'contract management',
  'legal research': 'legal research',
};

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, ' and ')
    .replace(/[^a-z0-9+#.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalSkill(skill) {
  const value = normalizeText(skill);
  return SKILL_ALIASES[value] || value;
}

const SKILL_LABELS = new Map(SKILL_CATALOG.map((s) => [normalizeText(s), s]));

// Explicit display overrides
SKILL_LABELS.set('c#', 'C#');
SKILL_LABELS.set('c++', 'C++');
SKILL_LABELS.set('.net', '.NET');
SKILL_LABELS.set('ci/cd', 'CI/CD');
SKILL_LABELS.set('sql', 'SQL');
SKILL_LABELS.set('aws', 'AWS');
SKILL_LABELS.set('gcp', 'GCP');
SKILL_LABELS.set('jwt', 'JWT');
SKILL_LABELS.set('html', 'HTML');
SKILL_LABELS.set('css', 'CSS');
SKILL_LABELS.set('php', 'PHP');
SKILL_LABELS.set('sap', 'SAP');
SKILL_LABELS.set('ios', 'iOS');
SKILL_LABELS.set('mern', 'MERN');
SKILL_LABELS.set('seo', 'SEO');
SKILL_LABELS.set('sem', 'SEM');
SKILL_LABELS.set('ppc', 'PPC');
SKILL_LABELS.set('gaap', 'GAAP');
SKILL_LABELS.set('hris', 'HRIS');
SKILL_LABELS.set('crm', 'CRM');
SKILL_LABELS.set('ui/ux design', 'UI/UX Design');
SKILL_LABELS.set('b2b sales', 'B2B Sales');

function displaySkill(skill) {
  const canon = canonicalSkill(skill);
  return SKILL_LABELS.get(canon) || SKILL_LABELS.get(normalizeText(skill)) || skill;
}

function uniqueSkills(skills = []) {
  if (!Array.isArray(skills)) return [];
  return [...new Set(skills.filter((s) => typeof s === 'string' && s.trim()).map(canonicalSkill).filter(Boolean))];
}

/**
 * High-precision extraction rules across all domains.
 */
const EXTRACTION_RULES = [
  // --- IT & Software ---
  { name: 'JavaScript', canon: 'javascript', patterns: [/\bjavascript\b/i, /\bes6\b/i] },
  { name: 'TypeScript', canon: 'typescript', patterns: [/\btypescript\b/i] },
  { name: 'Python', canon: 'python', patterns: [/\bpython3?\b/i] },
  { name: 'Java', canon: 'java', patterns: [/\bjava\b(?!script)/i] },
  { name: 'C++', canon: 'c++', patterns: [/\bc\+\+\b/i, /\bcpp\b/i] },
  { name: 'C#', canon: 'c#', patterns: [/\bc#\b/i, /\bc sharp\b/i, /\bcsharp\b/i] },
  { name: 'PHP', canon: 'php', custom: (title, text) => {
    if (/\bphp\s*[\d,]+(\.\d+)?/i.test(text) && !/\b(php\s*(developer|engineer|backend|7\.|8\.|laravel|symfony|wordpress)|laravel|symfony)\b/i.test(text)) {
      return false;
    }
    return /\bphp\b/i.test(text);
  }},
  { name: 'Ruby', canon: 'ruby', patterns: [/\bruby\b(?! on rails)/i] },
  { name: 'Ruby on Rails', canon: 'ruby on rails', patterns: [/\bruby on rails\b/i, /\brails\b/i] },
  { name: 'Golang', canon: 'golang', patterns: [/\bgolang\b/i, /\bgo\s+(language|programming|developer|engineer)\b/i] },
  { name: 'Swift', canon: 'swift', patterns: [/\bswift\b/i] },
  { name: 'Kotlin', canon: 'kotlin', patterns: [/\bkotlin\b/i] },
  { name: 'Dart', canon: 'dart', patterns: [/\bdart\b/i] },
  { name: 'React.js', canon: 'react.js', patterns: [/\breact(\.js|js)?\b(?! native)/i] },
  { name: 'React Native', canon: 'react native', patterns: [/\breact[- ]native\b/i] },
  { name: 'Next.js', canon: 'next.js', patterns: [/\bnext(\.js|js)\b/i] },
  { name: 'Vue.js', canon: 'vue.js', patterns: [/\bvue(\.js|js)?\b/i] },
  { name: 'Angular', canon: 'angular', patterns: [/\bangular(\.js|js)?\b/i] },
  { name: 'HTML', canon: 'html', patterns: [/\bhtml5?\b/i] },
  { name: 'CSS', canon: 'css', patterns: [/\bcss3?\b/i] },
  { name: 'Tailwind CSS', canon: 'tailwind css', patterns: [/\btailwind(\s*css)?\b/i] },
  { name: 'Node.js', canon: 'node.js', patterns: [/\bnode(\.js|js)?\b/i] },
  { name: 'Express.js', canon: 'express.js', patterns: [/\bexpress(\.js|js)\b/i, /\bexpress framework\b/i, /\bnode\/express\b/i] },
  { name: 'Spring Boot', canon: 'spring boot', patterns: [/\bspring[- ]boot\b/i] },
  { name: 'Django', canon: 'django', patterns: [/\bdjango\b/i] },
  { name: 'Flask', canon: 'flask', patterns: [/\bflask\b/i] },
  { name: 'FastAPI', canon: 'fastapi', patterns: [/\bfastapi\b/i] },
  { name: '.NET', canon: '.net', custom: (title, text) => {
    if (/\bdotnet\b/i.test(text) || /\bdot net\b/i.test(text) || /\basp\.net\b/i.test(text)) return true;
    if (/(?:^|[\s,;:(])\.net\s*(core|framework|\d+|developer|engineer|backend|c#|solution|platform|architecture)/i.test(text)) return true;
    if (/(?:^|[\s,;:(])\.net(?:[\s,;:)Active]|$)/i.test(text) && /\b(c#|visual studio|azure|microsoft|backend)\b/i.test(text)) return true;
    return false;
  }},
  { name: 'GraphQL', canon: 'graphql', patterns: [/\bgraphql\b/i] },
  { name: 'REST APIs', canon: 'rest apis', patterns: [/\brest(ful)?(\s+apis?|\s+web services?)\b/i, /\brest api\b/i] },
  { name: 'WebSockets', canon: 'websockets', patterns: [/\bwebsockets?\b/i] },
  { name: 'Socket.IO', canon: 'socket.io', patterns: [/\bsocket\.io\b/i, /\bsocket io\b/i] },
  { name: 'JWT', canon: 'jwt', patterns: [/\bjwt\b/i, /\bjson web tokens?\b/i] },
  { name: 'SQL', canon: 'sql', patterns: [/\bsql\b/i] },
  { name: 'MySQL', canon: 'mysql', patterns: [/\bmysql\b/i] },
  { name: 'PostgreSQL', canon: 'postgresql', patterns: [/\bpostgres(ql)?\b/i] },
  { name: 'MongoDB', canon: 'mongodb', patterns: [/\bmongo(db)?\b/i] },
  { name: 'Redis', canon: 'redis', patterns: [/\bredis\b/i] },
  { name: 'AWS', canon: 'aws', patterns: [/\baws\b/i, /\bamazon web services\b/i] },
  { name: 'Azure', canon: 'azure', patterns: [/\bazure\b/i, /\bmicrosoft azure\b/i] },
  { name: 'GCP', canon: 'gcp', custom: (title, text) => {
    if (/\bgoogle cloud( platform)?\b/i.test(text)) return true;
    if (/\bgcp\b/i.test(text)) {
      if (/(ich[-/ ]?gcp|protocol\/gcp|good clinical practice|gcp[- ](regulated|audit|complian)|glp\s+(and|&)\s+gcp)/i.test(text)) return false;
      if (/\b(cloud|aws|azure|kubernetes|bigquery|vertex|terraform|devops|hyperscaler)\b/i.test(text)) return true;
    }
    return false;
  }},
  { name: 'Docker', canon: 'docker', patterns: [/\bdocker\b/i] },
  { name: 'Kubernetes', canon: 'kubernetes', patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { name: 'Terraform', canon: 'terraform', patterns: [/\bterraform\b/i] },
  { name: 'CI/CD', canon: 'ci/cd', patterns: [/\bci\s*\/\s*cd\b/i, /\bcontinuous integration\b/i] },
  { name: 'Jenkins', canon: 'jenkins', patterns: [/\bjenkins\b/i] },
  { name: 'Linux', canon: 'linux', custom: (title, text) => {
    if (/\b(no|not|without|exclude|cannot use)\s+linux\b/i.test(text) && !/\blinux\s+(kernel|server|admin|engineer|developer|system|distribution|ubuntu|debian|rhel|centos|redhat)\b/i.test(text)) {
      return false;
    }
    return /\blinux\b/i.test(text);
  }},
  { name: 'Git', canon: 'git', patterns: [/\bgit\b(?!hub actions?)/i] },
  { name: 'GitHub Actions', canon: 'github actions', patterns: [/\bgithub actions?\b/i] },
  { name: 'Android', canon: 'android', patterns: [/\bandroid\b/i] },
  { name: 'iOS', canon: 'ios', custom: (title, text) => {
    if (/\bios\s*(developer|engineer|sdk|development|app|apps|platform|native|framework|ecosystem)\b/i.test(text)) return true;
    if (/\b(ios\b.{0,25}(android|swift|objective-c|flutter|react native)|(android|swift|objective-c|flutter|react native).{0,25}\bios)\b/i.test(text)) return true;
    if (/\bios\b/i.test(title)) return true;
    return false;
  }},
  { name: 'Flutter', canon: 'flutter', patterns: [/\bflutter\b/i] },
  { name: 'Machine Learning', canon: 'machine learning', patterns: [/\bmachine learning\b/i] },
  { name: 'Data Analysis', canon: 'data analysis', patterns: [/\bdata analysis\b/i, /\bdata analytics\b/i] },
  { name: 'Pandas', canon: 'pandas', patterns: [/\bpandas\b/i] },
  { name: 'NumPy', canon: 'numpy', patterns: [/\bnumpy\b/i] },
  { name: 'TensorFlow', canon: 'tensorflow', patterns: [/\btensorflow\b/i] },
  { name: 'PyTorch', canon: 'pytorch', patterns: [/\bpytorch\b/i] },
  { name: 'Kafka', canon: 'kafka', patterns: [/\b(apache )?kafka\b/i] },
  { name: 'OpenAI API', canon: 'openai api', custom: (title, text) => {
    if (/\bopenai\s*(api|apis|sdk|models?|integration|gpt)\b/i.test(text)) return true;
    if (/\b(llm|chatgpt|anthropic|bedrock|generative ai|prompt engineering)\b/i.test(text) && /\bopenai\b/i.test(text)) {
      if (/\b(teams?|products?|clients?|customers?|backed by|behind|investors? in)\s+[^.\n]{0,60}openai\b/i.test(text)) return false;
      return true;
    }
    return false;
  }},
  { name: 'Prompt Engineering', canon: 'prompt engineering', patterns: [/\bprompt engineering\b/i] },
  { name: 'Power BI', canon: 'power bi', patterns: [/\bpower\s*bi\b/i] },
  { name: 'Tableau', canon: 'tableau', patterns: [/\btableau\b/i] },
  { name: 'Vitest', canon: 'vitest', patterns: [/\bvitest\b/i] },
  { name: 'Jest', canon: 'jest', patterns: [/\bjest\b/i] },
  { name: 'Cypress', canon: 'cypress', patterns: [/\bcypress\b/i] },
  { name: 'Playwright', canon: 'playwright', patterns: [/\bplaywright\b/i] },
  { name: 'Selenium', canon: 'selenium', patterns: [/\bselenium\b/i] },
  { name: 'Postman', canon: 'postman', patterns: [/\bpostman\b/i] },
  { name: 'Salesforce', canon: 'salesforce', patterns: [/\bsalesforce\b/i] },
  { name: 'ServiceNow', canon: 'servicenow', patterns: [/\bservicenow\b/i, /\bservice-now\b/i] },
  { name: 'Workday', canon: 'workday', custom: (title, text) => {
    if (/\bworkday\b/i.test(title)) return true;
    const cleaned = text
      .replace(/(during|each|every|per|entire|consecutive|typical|normal|the|a|\d+)\s+workdays?\b/gi, ' ')
      .replace(/\bworkdays?\s*:\s*(monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri)/gi, ' ')
      .replace(/\blog\s+(in|on)\s+to\s+workday\b/gi, ' ')
      .replace(/\bcareer\s+worklet\s+on\s+your\s+workday\b/gi, ' ');
    if (/\bworkday\s+(hcm|financials|integration|studio|raas|prism|extend|security|payroll|birt|eib|developer|analyst|administrator|consultant|architect|architecture|systems?|software|platform|solution)\b/i.test(cleaned)) return true;
    if (/\b(experience with|knowledge of|proficien\w+ in|hands-on with|skills in|using)\s+workday\b/i.test(cleaned)) return true;
    if (/\b(adp|paycom|gusto|rippling|peoplesoft|sap|salesforce|oracle|netsuite)[^.\n]{0,60}workday\b/i.test(cleaned)) return true;
    if (/\bworkday[^.\n]{0,60}(adp|paycom|gusto|rippling|peoplesoft|sap|salesforce|oracle|netsuite)\b/i.test(cleaned)) return true;
    return false;
  }},
  { name: 'SAP', canon: 'sap', patterns: [/\bsap\b/i] },
  { name: 'Shopify', canon: 'shopify', patterns: [/\bshopify\b/i] },
  { name: 'Google Ads', canon: 'google ads', patterns: [/\bgoogle ads\b/i, /\badwords\b/i] },
  { name: 'Meta Ads', canon: 'meta ads', patterns: [/\bmeta ads\b/i, /\bfacebook ads\b/i] },
  { name: 'Figma', canon: 'figma', patterns: [/\bfigma\b/i] },
  { name: 'BullMQ', canon: 'bullmq', patterns: [/\bbullmq\b/i] },
  { name: 'MERN', canon: 'mern', patterns: [/\bmern\b/i] },

  // --- Finance & Accounting ---
  { name: 'Accounting', canon: 'accounting', patterns: [/\baccounting\b/i, /\bgeneral ledger\b/i] },
  { name: 'Financial Analysis', canon: 'financial analysis', patterns: [/\bfinancial analysis\b/i, /\bfinance analysis\b/i, /\bfp&a\b/i] },
  { name: 'Bookkeeping', canon: 'bookkeeping', patterns: [/\bbookkeeping\b/i, /\bbookkeeper\b/i] },
  { name: 'QuickBooks', canon: 'quickbooks', patterns: [/\bquickbooks\b/i, /\bquick books\b/i] },
  { name: 'Auditing', canon: 'auditing', patterns: [/\bauditing\b/i, /\bfinancial audit(s)?\b/i, /\binternal audit\b/i] },
  { name: 'Taxation', canon: 'taxation', patterns: [/\b(taxation|tax preparation|tax compliance|corporate tax)\b/i] },
  { name: 'Financial Modeling', canon: 'financial modeling', patterns: [/\bfinancial model(ing)?\b/i] },
  { name: 'Payroll', canon: 'payroll', patterns: [/\bpayroll\b/i] },
  { name: 'Excel', canon: 'excel', patterns: [/\b(ms |microsoft )?excel\b/i, /\badvanced excel\b/i, /\bspreadsheets?\b/i] },
  { name: 'Budgeting', canon: 'budgeting', patterns: [/\b(budgeting|budget forecast(ing)?|budget management)\b/i] },
  { name: 'GAAP', canon: 'gaap', patterns: [/\b(us )?gaap\b/i] },
  { name: 'Accounts Payable', canon: 'accounts payable', patterns: [/\baccounts payable\b/i] },
  { name: 'Accounts Receivable', canon: 'accounts receivable', patterns: [/\baccounts receivable\b/i] },

  // --- Marketing & Growth ---
  { name: 'SEO', canon: 'seo', patterns: [/\bseo\b/i, /\bsearch engine optimization\b/i] },
  { name: 'SEM', canon: 'sem', patterns: [/\bsem\b/i, /\bsearch engine marketing\b/i] },
  { name: 'Content Marketing', canon: 'content marketing', patterns: [/\bcontent marketing\b/i, /\bcontent strategy\b/i] },
  { name: 'Copywriting', canon: 'copywriting', patterns: [/\bcopywriting\b/i, /\bcopy writer\b/i] },
  { name: 'Email Marketing', canon: 'email marketing', patterns: [/\bemail marketing\b/i, /\bklaviyo\b/i, /\bmailchimp\b/i] },
  { name: 'Google Analytics', canon: 'google analytics', patterns: [/\bgoogle analytics\b/i, /\bga4\b/i] },
  { name: 'Social Media Marketing', canon: 'social media marketing', patterns: [/\bsocial media (marketing|management)\b/i] },
  { name: 'PPC', canon: 'ppc', patterns: [/\bppc\b/i, /\bpay[- ]per[- ]click\b/i] },
  { name: 'HubSpot', canon: 'hubspot', patterns: [/\bhubspot\b/i] },
  { name: 'Brand Strategy', canon: 'brand strategy', patterns: [/\bbrand strategy\b/i, /\bbrand management\b/i] },

  // --- Human Resources & Recruiting ---
  { name: 'Recruiting', canon: 'recruiting', custom: (title, text) => {
    if (/\b(recruiter|recruiting|talent acquisition|sourcer|headhunter)\b/i.test(title)) return true;
    const cleaned = text
      .replace(/\brecruiting\s+(agenc(y|ies)|partners?|firms?)\b/gi, ' ')
      .replace(/\b(our|the|a|internal|corporate)\s+recruiting\s+(team|department|function|coordinator)\b/gi, ' ')
      .replace(/\b(throughout|during|in)\s+(the|our)\s+recruiting\s+process(es)?\b/gi, ' ')
      .replace(/\b(tools?|ai)\s+in\s+its\s+recruiting\s+process(es)?\b/gi, ' ')
      .replace(/\brecruiting\s+process(es)?\b/gi, ' ');
    if (/\b(technical recruiting|campus recruiting|executive recruiting|full[- ]cycle recruiting|candidate recruiting|sourcing and recruiting|recruiting talent|responsible for recruiting|experience (with|in) recruiting)\b/i.test(cleaned)) return true;
    if (/\b(recruitment|headhunting)\b/i.test(cleaned)) return true;
    if (/\brecruiting\b/i.test(cleaned) && /\b(hr|human resources|talent|hiring|staffing)\b/i.test(cleaned)) return true;
    return false;
  }},
  { name: 'Talent Acquisition', canon: 'talent acquisition', patterns: [/\btalent acquisition\b/i] },
  { name: 'Onboarding', canon: 'onboarding', patterns: [/\b(employee onboarding|new hire onboarding)\b/i] },
  { name: 'Employee Relations', canon: 'employee relations', patterns: [/\bemployee relations\b/i] },
  { name: 'HRIS', canon: 'hris', patterns: [/\bhris\b/i, /\bhuman resources information\b/i] },
  { name: 'Performance Management', canon: 'performance management', patterns: [/\bperformance management\b/i, /\bperformance appraisal\b/i] },
  { name: 'Sourcing', canon: 'sourcing', patterns: [/\b(candidate sourcing|talent sourcing)\b/i] },
  { name: 'Applicant Tracking Systems', canon: 'applicant tracking systems', patterns: [/\b(ats|applicant tracking systems?)\b/i] },

  // --- Design & Creative ---
  { name: 'Graphic Design', canon: 'graphic design', patterns: [/\bgraphic design\b/i, /\bvisual design\b/i] },
  { name: 'UI/UX Design', canon: 'ui/ux design', patterns: [/\b(ui\/ux|ux\/ui)(\s+design)?\b/i, /\buser experience design\b/i, /\buser interface design\b/i] },
  { name: 'Adobe Photoshop', canon: 'adobe photoshop', patterns: [/\b(adobe )?photoshop\b/i] },
  { name: 'Adobe Illustrator', canon: 'adobe illustrator', patterns: [/\b(adobe )?illustrator\b/i] },
  { name: 'Wireframing', canon: 'wireframing', patterns: [/\bwirefram(ing|es)\b/i] },
  { name: 'Prototyping', canon: 'prototyping', patterns: [/\bprototyp(ing|es)\b/i] },
  { name: 'User Research', canon: 'user research', patterns: [/\b(user research|ux research)\b/i] },

  // --- Customer Support & Success ---
  { name: 'Customer Support', canon: 'customer support', patterns: [/\bcustomer (support|service)\b/i, /\bclient support\b/i] },
  { name: 'Customer Success', canon: 'customer success', patterns: [/\bcustomer success\b/i, /\bclient success\b/i] },
  { name: 'Zendesk', canon: 'zendesk', patterns: [/\bzendesk\b/i] },
  { name: 'Intercom', canon: 'intercom', patterns: [/\bintercom\b/i] },
  { name: 'Help Scout', canon: 'help scout', patterns: [/\bhelp\s*scout\b/i] },
  { name: 'CRM', canon: 'crm', patterns: [/\bcrm\b/i, /\bcustomer relationship management\b/i] },

  // --- Operations & Project Management ---
  { name: 'Project Management', canon: 'project management', patterns: [/\bproject management\b/i] },
  { name: 'Agile', canon: 'agile', patterns: [/\bagile( methodology)?\b/i] },
  { name: 'Scrum', canon: 'scrum', patterns: [/\bscrum\b/i] },
  { name: 'Jira', canon: 'jira', patterns: [/\bjira\b/i] },
  { name: 'Asana', canon: 'asana', patterns: [/\basana\b/i] },
  { name: 'Business Analysis', canon: 'business analysis', patterns: [/\bbusiness analysis\b/i] },
  { name: 'Risk Management', canon: 'risk management', patterns: [/\brisk management\b/i, /\brisk assessment\b/i] },
  { name: 'Process Improvement', canon: 'process improvement', patterns: [/\bprocess improvement\b/i, /\boperational efficiency\b/i] },
  { name: 'Stakeholder Management', canon: 'stakeholder management', patterns: [/\bstakeholder management\b/i] },

  // --- Sales & Business Development ---
  { name: 'B2B Sales', canon: 'b2b sales', patterns: [/\bb2b sales\b/i, /\bbusiness[- ]to[- ]business sales\b/i] },
  { name: 'Lead Generation', canon: 'lead generation', patterns: [/\blead generation\b/i, /\blead gen\b/i] },
  { name: 'Cold Calling', canon: 'cold calling', patterns: [/\bcold calling\b/i, /\boutbound sales\b/i] },
  { name: 'Account Management', canon: 'account management', patterns: [/\baccount management\b/i, /\bkey accounts?\b/i] },
  { name: 'Pipeline Management', canon: 'pipeline management', patterns: [/\b(sales )?pipeline management\b/i] },
  { name: 'Negotiation', canon: 'negotiation', patterns: [/\bnegotiat(ion|ing)\b/i, /\bcontract negotiation\b/i] },

  // --- Healthcare & Clinical ---
  { name: 'Clinical Trials', canon: 'clinical trials', patterns: [/\bclinical (trials?|research|studies|study)\b/i] },
  { name: 'Patient Care', canon: 'patient care', patterns: [/\bpatient care\b/i, /\bdirect patient care\b/i] },
  { name: 'Regulatory Compliance', canon: 'regulatory compliance', patterns: [/\bregulatory compliance\b/i] },
  { name: 'Healthcare Administration', canon: 'healthcare administration', patterns: [/\bhealthcare administration\b/i, /\bhealth systems administration\b/i] },

  // --- Legal & Compliance ---
  { name: 'Contract Management', canon: 'contract management', patterns: [/\bcontract (management|drafting|review)\b/i] },
  { name: 'Legal Research', canon: 'legal research', patterns: [/\blegal research\b/i] },
];

/**
 * Extracts skills from text and optional title with high precision.
 * Returns display-formatted skill strings.
 */
function extractSkills(text = '', title = '') {
  const cleanDesc = String(text ?? '').replace(/<[^>]*>/g, ' ');
  const cleanTitle = String(title ?? '');
  const combined = `${cleanTitle} ${cleanDesc}`;

  const found = new Set();
  for (const rule of EXTRACTION_RULES) {
    if (rule.custom) {
      if (rule.custom(cleanTitle, combined)) {
        found.add(rule.name);
      }
    } else if (rule.patterns && rule.patterns.some((p) => p.test(combined))) {
      found.add(rule.name);
    }
  }

  return [...found];
}

module.exports = {
  SKILL_CATALOG,
  SKILL_ALIASES,
  normalizeText,
  canonicalSkill,
  displaySkill,
  uniqueSkills,
  extractSkills,
};
