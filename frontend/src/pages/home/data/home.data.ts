export interface CuratedCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  lessonsCount: number;
  chaptersCount: number;
  price: string;
  originalPrice?: string;
  instructorName: string;
  instructorRole: string;
  instructorAvatar?: string;
  rating: number;
  studentsCount: number;
  thumbnail: string;
}

export const CURATED_COURSES: CuratedCourse[] = [
  {
    id: 'c1',
    title: 'Modern Web Architecture: Node.js & React 19',
    slug: 'modern-web-architecture-node-react-19',
    description:
      'Master modular vertical-slice design, PostgreSQL with Prisma ORM, JWT security pipelines, and Ant Design 6 design system integration.',
    category: 'Fullstack',
    level: 'Advanced',
    duration: '32 hours',
    lessonsCount: 48,
    chaptersCount: 8,
    price: '$49',
    originalPrice: '$99',
    instructorName: 'Prof. Alan Turing',
    instructorRole: 'Principal Architect & Ph.D.',
    rating: 4.9,
    studentsCount: 1420,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'c2',
    title: 'Cloudflare R2 & AWS S3 Media Pipelines',
    slug: 'cloudflare-r2-aws-s3-media-pipelines',
    description:
      'Direct client-to-bucket presigned upload architecture, on-demand video stream transcoding, and low-latency asset delivery networks.',
    category: 'DevOps & Cloud',
    level: 'Intermediate',
    duration: '22 hours',
    lessonsCount: 36,
    chaptersCount: 6,
    price: '$39',
    originalPrice: '$79',
    instructorName: 'Elena Rostova',
    instructorRole: 'Cloud Infrastructure Lead',
    rating: 4.8,
    studentsCount: 890,
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'c3',
    title: 'Algorithmic Problem Solving for Senior Interviews',
    slug: 'algorithmic-problem-solving-senior-interviews',
    description:
      'Master essential patterns: sliding window, topological sort, dynamic programming heuristics, and graphs with clean TypeScript implementations.',
    category: 'Algorithms',
    level: 'Advanced',
    duration: '28 hours',
    lessonsCount: 52,
    chaptersCount: 10,
    price: 'Free',
    instructorName: 'Marcus Vance',
    instructorRole: 'Staff Software Engineer',
    rating: 5.0,
    studentsCount: 2150,
    thumbnail: 'https://images.unsplash.com/photo-1516116211227-bbc13c74a367?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'c4',
    title: 'Distributed Event-Driven Systems with Kafka',
    slug: 'distributed-event-driven-systems-kafka',
    description:
      'Design fault-tolerant event streams, partition strategies, consumer group rebalancing, and idempotent transactional messaging.',
    category: 'Backend',
    level: 'Advanced',
    duration: '26 hours',
    lessonsCount: 40,
    chaptersCount: 7,
    price: '$59',
    originalPrice: '$120',
    instructorName: 'Sarah Jenkins',
    instructorRole: 'Systems Architect',
    rating: 4.9,
    studentsCount: 760,
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'c5',
    title: 'Hands-on Web Security & Penetration Defense',
    slug: 'hands-on-web-security-penetration-defense',
    description:
      'Audit OWASP Top 10 vulnerabilities, configure rigid Content Security Policies, protect session cookies, and defend against SSRF vectors.',
    category: 'Security',
    level: 'Intermediate',
    duration: '18 hours',
    lessonsCount: 30,
    chaptersCount: 5,
    price: '$35',
    instructorName: 'David Chen',
    instructorRole: 'Security Researcher',
    rating: 4.8,
    studentsCount: 940,
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'c6',
    title: 'LLM Application Engineering & Vector Databases',
    slug: 'llm-application-engineering-vector-databases',
    description:
      'Build robust Retrieval-Augmented Generation (RAG) pipelines, semantic cache layers, prompt orchestration, and PGVector embeddings.',
    category: 'AI & Data',
    level: 'Intermediate',
    duration: '24 hours',
    lessonsCount: 38,
    chaptersCount: 6,
    price: '$45',
    originalPrice: '$89',
    instructorName: 'Dr. Aris Thorne',
    instructorRole: 'AI Research Director',
    rating: 4.9,
    studentsCount: 1680,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  },
];

export interface QuizOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionData {
  prompt: string;
  options: QuizOption[];
  explanation: string;
}

export const QUIZ_DEMO_DATA: QuizQuestionData = {
  prompt:
    'In a high-throughput video streaming platform, why is direct presigned URL upload preferred over routing large video files through your primary API server?',
  options: [
    {
      id: 0,
      text: 'It completely eliminates application server memory & bandwidth bottlenecks by offloading ingestion directly to cloud storage.',
      isCorrect: true,
    },
    {
      id: 1,
      text: 'It automatically encrypts the developer workstation using local hardware security keys.',
      isCorrect: false,
    },
    {
      id: 2,
      text: 'It converts video frames into JPEG thumbnails directly inside the PostgreSQL database engine.',
      isCorrect: false,
    },
    {
      id: 3,
      text: 'It prevents web browsers from establishing any HTTPS connections with the server.',
      isCorrect: false,
    },
  ],
  explanation:
    'Correct! Presigned URLs grant time-limited upload permissions directly to cloud object storage (S3/R2), preventing the Node.js API server from suffering memory exhaustion or thread saturation while transferring gigabytes of media.',
};

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    quote:
      'The vertical-slice approach completely dismantled how I design microservices. The focus on real PostgreSQL indexes and JWT pipelines gave me direct leverage in my production sprint.',
    author: 'Vikram Mehta',
    role: 'Senior Backend Engineer',
    company: 'Stripe Ecosystem Partner',
  },
  {
    quote:
      'No superficial 5-minute video tutorials. Edutech forces you to think through architectural tradeoffs and validates each chapter with non-trivial diagnostic quizzes.',
    author: 'Chloe Dupont',
    role: 'Platform Systems Lead',
    company: 'CloudNative France',
  },
  {
    quote:
      'As an educator, having my credentials verified by platform admins immediately established trust with students. The curriculum authoring studio is the cleanest tool in the market.',
    author: 'Prof. Alan Turing',
    role: 'Adjunct Lecturer & Consultant',
    company: 'Institute of Computing',
  },
];

export interface FaqItem {
  key: string;
  question: string;
  answer: string;
}

export const FAQ_DATA: FaqItem[] = [
  {
    key: '1',
    question: 'How does Edutech differ from general online video libraries?',
    answer:
      'Traditional video platforms focus on superficial copy-along coding without architectural context. Edutech organizes curricula around full vertical slices, where each lesson connects directly to schema design, error handling, security validations, and chapter-by-chapter automated diagnostic testing.',
  },
  {
    key: '2',
    question: 'Are course completion certificates accredited and verifiable?',
    answer:
      'Yes. Once you complete 100% of the lessons in a published curriculum and score at least 80% on all chapter quizzes, a cryptographically signed completion certificate is issued with a permanent public verification URL.',
  },
  {
    key: '3',
    question: 'What are the criteria for becoming an approved Lecturer?',
    answer:
      "Applicants must submit their academic qualifications (e.g. Bachelor's, Master's, Doctorate, or Industry Expert credentials) and a valid CV or portfolio. Our platform administrators review each application to ensure instructors possess authentic industry or teaching experience. If rejected, candidates can update their qualifications and re-apply from their profile.",
  },
  {
    key: '4',
    question: 'Can I access courses across desktop and mobile devices?',
    answer:
      'Yes. The entire platform is built with responsive Ant Design layout primitives and modern CSS, allowing you to watch lessons, review code samples, and take quizzes seamlessly across desktop browsers, tablets, and mobile screens.',
  },
];
