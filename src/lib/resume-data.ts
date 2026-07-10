export interface ResumeData {
  name: string
  location: string
  phone: string
  email: string
  linkedin: string
  github: string
  website?: string
  summary: string
  experience: { company: string; location: string; title: string; dates: string; bullets: string[] }[]
  certifications: { name: string; date: string }[]
  education: { school: string; location: string; degree: string; dates: string; gpa?: string }[]
  skills: string[]
  projects: { name: string; tech: string; bullets: string[] }[]
}

export const RESUME_DATA: ResumeData = {
  name: 'Roman Kucheryavyy',
  location: 'Auburn, WA 98092',
  phone: '(253) 802-6464',
  email: 'kucheryavyyroman@gmail.com',
  linkedin: 'https://www.linkedin.com/in/romakuch/',
  github: 'https://github.com/RomanKucheryavyy',
  website: 'https://romankucheryavyy.com',
  summary:
    'Senior Technical Support Engineer at Salesforce (Signature Success) supporting Fortune 500 and strategic enterprise customers. 8x Salesforce certified with a BS in Computer Science, and a builder of AI-powered products — multi-agent systems on the Claude API. Deep expertise in Apex, Sales Cloud, and the Agentforce agentic AI stack.',
  experience: [
    {
      company: 'Salesforce',
      location: 'Bellevue, WA',
      title: 'Senior Technical Support Engineer — Signature Success',
      dates: 'April 2026 – Present',
      bullets: [
        "Serve as the single point of technical accountability for Salesforce's most strategic Signature-tier enterprise customers, including Fortune 500 accounts.",
        'Resolve complex multi-org Sales Cloud issues — Apex, SOQL, API integrations, governor limits — and lead root cause analysis on SEV-1 production incidents.',
        'Partner directly with Salesforce R&D, Engineering, and Account Success teams to drive resolution of platform-level defects; manage escalations and recovery efforts for high-risk enterprise accounts.',
        'Champion adoption of Salesforce agentic AI (Agentforce), guiding strategic customers through mission-critical AI implementations.',
      ],
    },
    {
      company: 'Salesforce',
      location: 'Bellevue, WA',
      title: 'Premier Technical Support Engineer — Government Cloud',
      dates: 'November 2023 – April 2026',
      bullets: [
        'Delivered premier-level support for Salesforce Government Cloud customers within strict public-sector SLAs, covering 9 product areas including Security, Data Cloud, CRM Analytics, Developer Support, and Sales Engagement.',
        'Escalated and remediated high-priority (SEV-1) incidents in partnership with engineering, security, and product teams.',
        'Guided federal clients through platform best practices and compliance with federal data standards.',
      ],
    },
    {
      company: 'MindTree (supporting Microsoft service partners)',
      location: 'Bellevue, WA',
      title: 'Technical Support Engineer',
      dates: 'May 2021 – November 2023',
      bullets: [
        'Supported federal government agencies using Microsoft products, creating and resolving support tickets within defined SLAs.',
        'Partnered with internal Microsoft support and operations teams to identify and resolve systemic faults.',
        'Communicated case status and emerging-issue findings to customers, service managers, and leadership.',
      ],
    },
  ],
  certifications: [
    { name: 'Platform Developer I', date: 'Jul 2025' },
    { name: 'Data Cloud Consultant', date: 'Mar 2025' },
    { name: 'AI Specialist', date: 'Nov 2024' },
    { name: 'Sales Cloud Consultant', date: 'Aug 2024' },
    { name: 'Advanced Administrator', date: 'Apr 2024' },
    { name: 'AI Associate', date: 'Apr 2024' },
    { name: 'Platform App Builder', date: 'Jan 2024' },
    { name: 'Administrator', date: 'Dec 2023' },
  ],
  education: [
    {
      school: 'University of Washington',
      location: 'Tacoma, WA',
      degree: 'BS, Computer Science and Systems',
      dates: '2018 – 2020',
      gpa: '3.7',
    },
    {
      school: 'Highline College',
      location: 'Des Moines, WA',
      degree: 'AA, Computer Science',
      dates: '2016 – 2018',
      gpa: '3.58',
    },
  ],
  skills: [
    'Salesforce (Apex, LWC, SOQL, Flow)', 'Sales Cloud', 'Data Cloud', 'CRM Analytics', 'Agentforce',
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'Swift', 'SQL',
    'REST APIs', 'Claude API', 'Git', 'Firebase', 'Supabase',
  ],
  projects: [
    {
      name: 'Praxis — AI-Augmented Trading Platform',
      tech: 'Next.js, TypeScript, Claude API, Alpaca API',
      bullets: [
        'Built a multi-agent investing platform where 18 rule-based and LLM-driven investor personas debate every position and an AI portfolio manager synthesizes sized trade proposals; runs daily in paper trading via the Alpaca API.',
      ],
    },
    {
      name: 'Alongside Brain — Personal AI Knowledge System',
      tech: 'Python, Claude API, Slack API, Obsidian',
      bullets: [
        'Built an always-on AI system: a Slack bot captures natural-language notes, reminders, and expenses; Claude routes each capture into an Obsidian vault; runs 24/7 with scheduled digests, Gmail/Calendar sync, and pattern detection.',
      ],
    },
    {
      name: 'FUBC Coffee iOS App',
      tech: 'Swift, SwiftUI, Firebase, Supabase',
      bullets: [
        'Published a native ordering app with real-time orders, push notifications, and digital loyalty cards — 5.0-star App Store rating across 11 reviews.',
      ],
    },
    {
      name: 'Alongside Events — Event Operations Platform',
      tech: 'Next.js, TypeScript, Tailwind CSS',
      bullets: [
        'Designed a multi-tenant platform covering quotes, invoices, contracts, and client CRM for mobile event vendors, running a family espresso cart operation end to end.',
      ],
    },
  ],
}
