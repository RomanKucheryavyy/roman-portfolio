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
    "Senior Technical Support Engineer at Salesforce on the Signature Success team, supporting the platform's most strategic Fortune 500 and enterprise customers. 8x Salesforce certified with a BS in Computer Science and a passion for building full-stack web and iOS applications. Combines deep technical expertise in Apex, Sales Cloud, and Salesforce's agentic AI stack with strong stakeholder collaboration to resolve complex, mission-critical issues and deliver measurable customer value.",
  experience: [
    {
      company: 'Salesforce',
      location: 'Bellevue, WA',
      title: 'Senior Technical Support Engineer — Signature Success',
      dates: 'April 2026 – Present',
      bullets: [
        "Serve as the single point of technical accountability for Salesforce's most complex, strategic Signature-tier enterprise customers.",
        'Resolve highly sophisticated, multi-org technical issues across the Sales Cloud platform, involving deep expertise in Apex, SOQL, API integrations, and platform governor limits.',
        'Perform deep-dive root cause analysis on critical production issues, including Salesforce infrastructure, metadata configuration, and cross-cloud dependencies.',
        'Align and collaborate with Business and Technical stakeholders, Account Success teams, and R&D/Engineering to drive resolution of platform-level defects and ensure customer value delivery.',
        'Drive Customer Success Score metrics, manage escalations, and lead recovery efforts for high-risk enterprise accounts.',
        'Partner directly with Salesforce R&D and Engineering to escalate and resolve platform-level defects impacting Fortune 500 and global enterprise environments.',
        "Champion the adoption of Salesforce's agentic AI capabilities, including Agentforce, by demonstrating real-world value to strategic enterprise customers and guiding them through complex, mission-critical AI implementations.",
      ],
    },
    {
      company: 'Salesforce',
      location: 'Bellevue, WA',
      title: 'Premier Technical Support Engineer — Government Cloud',
      dates: 'November 2023 – April 2026',
      bullets: [
        'Delivered premier-level technical support and troubleshooting for Salesforce Government Cloud customers, ensuring critical case resolution within strict public sector SLAs.',
        'Investigated and resolved complex technical issues related to CRM platform functionality, user access, data security, and system integrations. Products and topics included: Security, FA, CRMA, Networking, Developer Support, Mobile Apps, Sales Engagement, Digital Engagement, and Data Cloud.',
        'Collaborated closely with internal engineering, security, and product teams to escalate and remediate high-priority (SEV 1) issues.',
        'Guided government clients through technical best practices, optimizing their Salesforce utilization and ensuring compliance with federal data standards.',
      ],
    },
    {
      company: 'MindTree (Supporting Microsoft service partners)',
      location: 'Bellevue, WA',
      title: 'Technical Support Engineer',
      dates: 'May 2021 – November 2023',
      bullets: [
        'Gathered information via phone and email and assisted Federal Government Agencies in the public sector in creating support tickets for Microsoft products and delivering requests within defined SLA.',
        'Engaged with internal Microsoft support and operations teams to resolve systemic faults.',
        'Investigated emerging issues and provided concise, effective communication with partner teams to remediate.',
        'Created, updated, and reported case status to customers, customer service managers, and leadership.',
        'Used tools including Softphone, Service Desk, DFM (Dynamics), Rave and Microsoft Office.',
      ],
    },
  ],
  certifications: [
    { name: 'Salesforce Certified Platform Developer I', date: 'July 2025' },
    { name: 'Salesforce Certified Data Cloud Consultant', date: 'March 2025' },
    { name: 'Salesforce Certified AI Specialist', date: 'November 2024' },
    { name: 'Salesforce Certified Sales Cloud Consultant', date: 'August 2024' },
    { name: 'Salesforce Certified Advanced Administrator (SCAA)', date: 'April 2024' },
    { name: 'Salesforce Certified AI Associate', date: 'April 2024' },
    { name: 'Salesforce Certified Platform App Builder', date: 'January 2024' },
    { name: 'Salesforce Certified Administrator (SCA)', date: 'December 2023' },
  ],
  education: [
    {
      school: 'University of Washington',
      location: 'Tacoma, WA',
      degree: 'BS, Computer Science and Systems',
      dates: 'September 2018 - June 2020',
      gpa: '3.7',
    },
    {
      school: 'Highline College',
      location: 'Des Moines, WA',
      degree: 'AA, Computer Science',
      dates: 'September 2016 - June 2018',
      gpa: '3.58',
    },
  ],
  skills: [
    'Java', 'C', 'Python', 'MySQL', 'Erlang', 'JavaScript', 'TypeScript',
    'Cryptography', 'R', 'Swift', 'React', 'Next.js', 'OOP',
    'Salesforce Administration', 'Cloud Computing', 'AI', 'Apex', 'LWC',
    'Node.js', 'Firebase', 'Supabase', 'Git', 'Data Cloud', 'CRMA',
  ],
  projects: [
    {
      name: 'FUBC Coffee iOS App',
      tech: 'Swift, SwiftUI, Firebase, Supabase',
      bullets: [
        'Built and published a native iOS application for a coffee ordering platform with real-time ordering, push notifications, and digital card system.',
        'Available on the App Store with a 5.0 rating from 11 reviews.',
      ],
    },
    {
      name: 'Alongside Coffee',
      tech: 'React, Next.js, Tailwind, Netlify',
      bullets: [
        'Designed and developed a full-stack e-commerce website for a premium coffee brand with custom branding, responsive design, and Stripe integration.',
      ],
    },
    {
      name: 'FUBC Band Website',
      tech: 'React, Vite, Supabase, Netlify',
      bullets: [
        'Built the official website for the FUBC Band featuring event listings, media gallery, and live performance showcase with CMS integration.',
      ],
    },
    {
      name: 'Overlift App',
      tech: 'Android Studio, Java, SQL, Firebase, Heroku',
      bullets: [
        'Created a workout/health tracking app that included a personalized portfolio with messaging, diet management and workout management.',
      ],
    },
    {
      name: 'Cryptography Suite cShake/KMAXOF256',
      tech: 'Java, C, Git',
      bullets: [
        'Implemented a security application derived from cShake256 in Java to provide various functionalities such as hashing, decryption, generating signatures and creating key pairs.',
      ],
    },
  ],
}
