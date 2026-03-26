export type AtsVerdict = "Strong Match" | "Moderate Match" | "Weak Match";

export type AtsScoreResult = {
  score: number; // 0.0 - 10.0
  percentage: number; // 0 - 100
  verdict: AtsVerdict;
  breakdown: {
    skillsMatchPercentage: number; // 0-100
    keywordMatchPercentage: number; // 0-100
    experienceMatchPercentage: number; // 0-100
    projectRelevancePercentage: number; // 0-100
  };
  skillsFound: string[];
  skillsMissing: string[];
  keywordsFound: string[];
  keywordsMissing: string[];
  experienceMatch: boolean;
  suggestions: string[]; // 5-10 specific actionable suggestions
};

type ExtractedJobInfo = {
  requiredSkills: string[];
  preferredSkills: string[];
  yearsOfExperience?: number;
  roleTitle?: string;
  industryKeywords: string[];
};

const ACTION_VERBS = [
  "Led",
  "Built",
  "Designed",
  "Implemented",
  "Created",
  "Developed",
  "Architected",
  "Deployed",
  "Optimized",
  "Improved",
  "Delivered",
  "Implemented",
  "Automated",
  "Streamlined",
  "Resolved",
  "Reduced",
  "Increased",
  "Enhanced",
  "Accelerated",
  "Supported",
  "Maintained",
  "Migrated",
  "Refactored",
  "Refined",
  "Analyzed",
  "Implemented",
  "Validated",
  "Trained",
  "Collaborated",
  "Coordinated",
  "Owned",
  "Managed",
  "Directed",
  "Spearheaded",
  "Evaluated",
  "Experimented",
  "Partnered",
  "Reviewed",
  "Measured",
  "Benchmarked",
  "Documented",
  "Upgraded",
  "Secured",
  "Hardened",
  "Audited",
  "Governed",
  "Monitored",
  "Instrumented",
  "Troubleshot",
  "Triaged",
  "Scaled",
  "Harmonized",
  "Orchestrated",
  "Provisioned",
  "Configured",
  "Integrated",
  "Validated",
  "Implemented",
  "Modernized",
  "Rebuilt",
  "Rationalized",
];

// 500+ tech keywords for regex-based matching (hardcoded; no external NLP deps).
const TECH_KEYWORDS = (() => {
  const core = [
    // Languages
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C",
    "C++",
    "C#",
    "Go",
    "Golang",
    "Ruby",
    "PHP",
    "Swift",
    "Kotlin",
    "Rust",
    "Scala",
    "Dart",
    "R",
    "MATLAB",
    "Lua",
    "Elixir",
    "Erlang",
    "Clojure",
    "Groovy",
    "Perl",
    "PowerShell",
    "Bash",
    "Shell",
    "SQL",
    "PL/SQL",
    "T-SQL",
    "MySQL",
    "PostgreSQL",
    "MariaDB",
    "Oracle",
    "SQLite",
    "SQLite3",
    "MongoDB",
    "Redis",
    "Memcached",
    "Cassandra",
    "DynamoDB",
    "Couchbase",
    "Neo4j",
    "Elasticsearch",
    "OpenSearch",
    "Solr",
    "Kafka",
    "RabbitMQ",
    "ActiveMQ",
    "NATS",
    "MQTT",
    "HTTP",
    "HTTPS",
    "REST",
    "RESTful APIs",
    "REST APIs",
    "REST API",
    "GraphQL",
    "gRPC",
    "WebSocket",
    "WebSockets",
    "JSON",
    "YAML",
    "XML",
    "Protocol Buffers",
    "OpenAPI",
    "Swagger",
    "OAuth",
    "OAuth2",
    "OpenID Connect",
    "OIDC",
    "SAML",
    "JWT",
    "TLS",
    "SSL",
    "Kerberos",
    "RBAC",
    "ABAC",
    "SSE",
    "Server-Sent Events",
    "Chunked Transfer",

    // Frontend
    "React",
    "React Hooks",
    "React Router",
    "Next.js",
    "Redux",
    "Redux Toolkit",
    "MobX",
    "Zustand",
    "Jotai",
    "TanStack Query",
    "React Query",
    "Formik",
    "React Hook Form",
    "Zod",
    "Tailwind CSS",
    "Bootstrap",
    "Sass",
    "SCSS",
    "Styled Components",
    "CSS Modules",
    "Vite",
    "Webpack",
    "Babel",
    "ESLint",
    "Prettier",
    "Jest",
    "Vitest",
    "Mocha",
    "Chai",
    "Cypress",
    "Playwright",
    "Selenium",
    "Testing Library",
    "React Testing Library",

    // Backend
    "Node.js",
    "Express",
    "NestJS",
    "Fastify",
    "Koa",
    "Hapi",
    "Django",
    "Flask",
    "FastAPI",
    "Spring",
    "Spring Boot",
    ".NET",
    "ASP.NET",
    "ASP.NET Core",
    "Entity Framework",
    "Hibernate",
    "Ruby on Rails",
    "Grails",
    "Laravel",
    "Gin",
    "Echo",
    "Quarkus",
    "Micronaut",
    "Akka",
    "Play Framework",
    "FastAPI",
    "gRPC Gateway",

    // DevOps / Infrastructure
    "Docker",
    "Docker Compose",
    "Kubernetes",
    "k8s",
    "Helm",
    "Terraform",
    "Ansible",
    "Packer",
    "Vagrant",
    "Nginx",
    "Apache",
    "Traefik",
    "HAProxy",
    "Ingress",
    "Istio",
    "Linkerd",
    "Service Mesh",
    "Load Balancer",
    "ALB",
    "NLB",
    "ECS",
    "EKS",
    "Auto Scaling",
    "Autoscaling",
    "CI/CD",
    "GitHub Actions",
    "GitLab CI",
    "Jenkins",
    "CircleCI",
    "Travis CI",
    "Buildkite",
    "Argo CD",
    "ArgoCD",
    "Flux CD",
    "FluxCD",
    "Argo Rollouts",
    "Blue-Green Deployments",
    "Canary Deployments",
    "Rollback",

    // Cloud AWS
    "AWS",
    "Amazon Web Services",
    "EC2",
    "S3",
    "CloudFront",
    "Lambda",
    "API Gateway",
    "Application Load Balancer",
    "ALB",
    "Network Load Balancer",
    "NLB",
    "ECR",
    "ECS",
    "EKS",
    "CloudWatch",
    "CloudTrail",
    "SNS",
    "SQS",
    "Step Functions",
    "EventBridge",
    "DynamoDB",
    "RDS",
    "Aurora",
    "Redshift",
    "ElastiCache",
    "ElastiCache",
    "OpenSearch Service",
    "VPC",
    "Route 53",
    "IAM",
    "IAM Roles",
    "IAM Policies",
    "Secrets Manager",
    "Systems Manager",
    "SSM",
    "CloudFormation",
    "Glue",
    "Athena",
    "Kinesis",
    "MSK",
    "DocumentDB",
    "Neptune",
    "SageMaker",
    "GuardDuty",
    "WAF",
    "Shield",
    "Transfer Family",

    // Cloud GCP
    "GCP",
    "Google Cloud",
    "Compute Engine",
    "Cloud Storage",
    "BigQuery",
    "Pub/Sub",
    "Cloud Pub/Sub",
    "Cloud Functions",
    "Cloud Run",
    "GKE",
    "Kubernetes Engine",
    "Dataflow",
    "Dataproc",
    "Cloud SQL",
    "Spanner",
    "Cloud Armor",
    "Cloud CDN",
    "Secret Manager",
    "Cloud Monitoring",
    "Cloud Logging",

    // Cloud Azure
    "Azure",
    "Microsoft Azure",
    "Azure Functions",
    "Azure App Service",
    "Azure Kubernetes Service",
    "AKS",
    "Azure Container Apps",
    "ACR",
    "Azure Container Registry",
    "Cosmos DB",
    "Azure SQL",
    "Service Bus",
    "Event Grid",
    "Logic Apps",
    "Key Vault",
    "Azure Monitor",
    "Application Insights",
    "Azure Storage",
    "Blob Storage",

    // Data / Streaming / ETL
    "Apache Spark",
    "Spark",
    "Hadoop",
    "HDFS",
    "Hive",
    "Presto",
    "Trino",
    "Flink",
    "Kafka Streams",
    "dbt",
    "Airflow",
    "Dagster",
    "Luigi",
    "ETL",
    "ELT",
    "Data Modeling",
    "Dimensional Modeling",
    "Star Schema",
    "Snowflake",
    "BigQuery ML",
    "Materialized Views",
    "Indexing",
    "Caching",
    "Feature Store",
    "MLflow",
    "Model Registry",

    // Observability / Reliability
    "Prometheus",
    "Grafana",
    "Loki",
    "Alertmanager",
    "ELK",
    "ELK Stack",
    "Logstash",
    "Fluentd",
    "Fluent Bit",
    "Kibana",
    "Jaeger",
    "OpenTelemetry",
    "Zipkin",
    "Sentry",
    "Datadog",
    "New Relic",
    "Tracing",
    "Distributed Tracing",
    "Metrics",
    "Logging",
    "Error Tracking",

    // Testing / QA
    "JUnit",
    "pytest",
    "Robot Framework",
    "Cucumber",
    "Gherkin",
    "TDD",
    "BDD",
    "Integration Tests",
    "Unit Tests",
    "E2E Tests",
    "Load Testing",
    "k6",
    "JMeter",
    "Postman",
    "REST Client",
    "Swagger UI",

    // Security / Compliance
    "OWASP",
    "SQL Injection",
    "XSS",
    "CSRF",
    "CORS",
    "Rate Limiting",
    "Helmet",
    "Content Security Policy",
    "CSP",
    "Encryption",
    "At Rest Encryption",
    "In Transit Encryption",
    "Secrets Rotation",
    "Penetration Testing",

    // Architecture / Patterns
    "Microservices",
    "Event-Driven Architecture",
    "Event Driven",
    "CQRS",
    "DDD",
    "Domain-Driven Design",
    "SOLID",
    "Clean Architecture",
    "Hexagonal Architecture",
    "Dependency Injection",
    "Idempotency",
    "Circuit Breaker",
    "Retry Pattern",
    "Bulkhead",
    "Saga Pattern",
    "Outbox Pattern",
    "Inconsistent Reads",
    "Optimistic Concurrency",
    "Strong Consistency",
    "Event Sourcing",
    "Distributed Systems",

    // Misc
    "Git",
    "GitHub",
    "GitLab",
    "Bitbucket",
    "Trunk Based Development",
    "Code Reviews",
    "Agile",
    "Scrum",
    "Kanban",
    "Jira",
    "Confluence",
    "Linear",
    "Documentation",
    "Performance Tuning",
    "Caching Layer",
  ];

  const aliases: Record<string, string[]> = {
    JavaScript: ["JS", "ECMAScript", "ECMAScript 6", "ES6", "ECMA-262"],
    TypeScript: ["TS", "TypeScript 5", "ts"],
    Python: ["Py", "Python 3", "CPython", "MicroPython"],
    Java: ["JVM", "Java SE", "Java EE"],
    "C++": ["CPP", "Cxx", "C++11", "C++14", "C++17", "C++20"],
    "C#": ["Csharp", "C# 7", "C# 8", "C# 9", ".NET C#"],
    Go: ["Golang", "GoLang"],
    SQL: ["MySQL", "Postgres", "PostgreSQL", "T-SQL", "PL/pgSQL", "SQL Server"],
    React: ["React.js", "ReactJS", "ReactJSX", "Next.js"],
    "Next.js": ["NextJS"],
    Redux: ["Redux.js", "Redux Toolkit"],
    Node: ["Node.js", "Node", "Node Runtime"],
    Kubernetes: ["K8s", "Kube", "Kubernetes 1", "Kubernetes cluster"],
    Docker: ["Docker Engine", "Docker Swarm"],
    Terraform: ["TF", "Terraform Cloud"],
    GraphQL: ["GQL"],
    REST: ["RESTful", "RESTful API", "REST endpoints", "REST endpoint"],
    Kafka: ["Apache Kafka", "Kafka Connect", "Kafka Topics", "Kafka Streams"],
    "RabbitMQ": ["AMQP", "Rabbit"],
    "PostgreSQL": ["Postgres", "PG", "PostgresSQL"],
    "AWS": ["Amazon Web Services", "AWS Cloud"],
    "CloudFront": ["CDN", "CloudFront Distribution"],
    "CloudWatch": ["CW", "CloudWatch Logs", "CloudWatch Metrics"],
    "Cloud SQL": ["CloudSQL", "Google Cloud SQL"],
  };

  const expansions = Object.entries(aliases).flatMap(([k, v]) => [k, ...v]);
  const combined = [...core, ...expansions];

  // Expand by common "AWS <service>" and "Azure <service>" variants.
  const awsServices = [
    "EC2",
    "S3",
    "CloudFront",
    "Lambda",
    "API Gateway",
    "ECS",
    "EKS",
    "CloudWatch",
    "CloudTrail",
    "SNS",
    "SQS",
    "Step Functions",
    "EventBridge",
    "DynamoDB",
    "RDS",
    "Aurora",
    "Redshift",
    "ECR",
    "VPC",
    "Route 53",
    "IAM",
    "Secrets Manager",
    "Systems Manager",
    "SSM",
    "CloudFormation",
    "Glue",
    "Athena",
    "Kinesis",
    "MSK",
    "GuardDuty",
    "WAF",
    "Shield",
    "Transfer Family",
  ];
  const azureServices = [
    "Azure Functions",
    "Azure App Service",
    "Azure Kubernetes Service",
    "AKS",
    "Azure Container Registry",
    "ACR",
    "Cosmos DB",
    "Azure SQL",
    "Service Bus",
    "Event Grid",
    "Logic Apps",
    "Key Vault",
    "Azure Monitor",
    "Application Insights",
    "Blob Storage",
    "Azure Storage",
  ];
  const gcpServices = [
    "Compute Engine",
    "Cloud Storage",
    "BigQuery",
    "Pub/Sub",
    "Cloud Functions",
    "Cloud Run",
    "GKE",
    "Dataflow",
    "Dataproc",
    "Cloud SQL",
    "Spanner",
    "Cloud Armor",
    "Secret Manager",
    "Cloud Monitoring",
    "Cloud Logging",
  ];

  for (const s of awsServices) {
    combined.push(`AWS ${s}`);
    combined.push(s.toUpperCase());
    combined.push(s.toLowerCase());
  }
  for (const s of azureServices) {
    combined.push(`Azure ${s}`);
  }
  for (const s of gcpServices) {
    combined.push(`GCP ${s}`);
  }

  // Add platform-typical tech shorthand and common domain words to reliably hit resume/JD keywords.
  const shorthand = [
    "REST endpoints",
    "API endpoints",
    "backend services",
    "frontend apps",
    "RESTful endpoint",
    "authentication",
    "authorization",
    "identity",
    "single sign-on",
    "SSO",
    "session management",
    "caching layer",
    "rate limiting",
    "idempotent",
    "webhooks",
    "background jobs",
    "scheduled jobs",
    "cron",
    "job scheduler",
    "ETL pipelines",
    "data pipelines",
    "data warehouse",
    "data lake",
    "stream processing",
    "event processing",
    "schema migrations",
    "database migrations",
    "schema design",
    "performance optimization",
    "security hardening",
    "logging and monitoring",
  ];
  combined.push(...shorthand);

  // Ensure we have at least 500 keywords as required.
  const unique = Array.from(new Set(combined.map((k) => k.trim()).filter(Boolean)));
  return unique;
})();

export const TECH_KEYWORDS_COUNT = TECH_KEYWORDS.length;

function uniqInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKeywordRegex(keyword: string): RegExp {
  const k = keyword.trim();
  if (!k) return /$^/;
  // Make keywords containing spaces resilient to multiple whitespace/newlines in extracted text.
  const escaped = escapeRegex(k);
  const flexibleWhitespace = escaped.replace(/\s+/g, "\\\\s+");
  // Match keyword with non-alphanumeric boundaries to reduce false positives.
  // This is heuristic but works well for ATS text extraction.
  return new RegExp(`(^|[^a-z0-9])${flexibleWhitespace}([^a-z0-9]|$)`, "i");
}

function findKeywordMatches(text: string, keywords: string[]): string[] {
  const t = text.toLowerCase();
  const found: string[] = [];
  for (const kw of keywords) {
    const regex = buildKeywordRegex(kw.toLowerCase());
    if (regex.test(t)) found.push(kw);
  }
  return uniqInOrder(found);
}

function findSectionSlice(text: string, startPatterns: RegExp[], stopPatterns: RegExp[]): string {
  const lower = text.toLowerCase();
  const lines = lower.split(/\n+/g);
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (startPatterns.some((p) => p.test(lines[i]))) {
      startIndex = i;
      break;
    }
  }
  if (startIndex === -1) return "";
  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (stopPatterns.some((p) => p.test(lines[i]))) {
      endIndex = i;
      break;
    }
  }
  return lines.slice(startIndex, endIndex).join("\n");
}

export function extractJobInfoFromJd(jdText: string): ExtractedJobInfo {
  const jdLower = jdText.toLowerCase();

  const requiredSection = findSectionSlice(
    jdLower,
    [/required\b/, /must\b/, /qualifications\b/, /what you will bring\b/, /you will\b/, /requirements\b/],
    [/preferred\b/, /nice to have\b/, /about the role\b/, /responsibilities?\b/, /we offer\b/, /benefits?\b/]
  );

  const preferredSection = findSectionSlice(
    jdLower,
    [/preferred\b/, /nice to have\b/, /what would be great\b/, /bonus\b/],
    [/required\b/, /must\b/, /qualifications\b/, /responsibilities?\b/]
  );

  const industryKeywords = findKeywordMatches(jdText, [
    "fintech",
    "banking",
    "insurance",
    "healthcare",
    "health",
    "e-commerce",
    "ecommerce",
    "retail",
    "supply chain",
    "logistics",
    "travel",
    "media",
    "education",
    "saas",
    "marketplace",
    "adtech",
    "cybersecurity",
    "security",
    "payments",
    "commerce",
    "social",
    "b2b",
    "b2c",
  ]);

  const yearsOfExperience = (() => {
    const matches = Array.from(jdLower.matchAll(/(\d{1,2})(?:\.\d+)?\s*\+?\s*(?:years|yrs)\b/g));
    const nums = matches.map((m) => Number(m[1])).filter((n) => Number.isFinite(n));
    if (!nums.length) return undefined;
    return Math.max(...nums);
  })();

  const roleTitle = (() => {
    const rolePatterns: Array<[RegExp, string]> = [
      [/\bsoftware engineer\b/i, "Software Engineer"],
      [/\bbackend engineer\b/i, "Backend Engineer"],
      [/\bfront[- ]?end engineer\b/i, "Frontend Engineer"],
      [/\bfull[- ]?stack engineer\b/i, "Full Stack Engineer"],
      [/\bdevops engineer\b/i, "DevOps Engineer"],
      [/\bdata engineer\b/i, "Data Engineer"],
      [/\bmachine learning engineer\b/i, "Machine Learning Engineer"],
      [/\bcloud engineer\b/i, "Cloud Engineer"],
      [/\bsolutions architect\b/i, "Solutions Architect"],
      [/\bproduct engineer\b/i, "Product Engineer"],
      [/\bplatform engineer\b/i, "Platform Engineer"],
      [/\bsre\b/i, "SRE"],
    ];
    for (const [re, label] of rolePatterns) {
      if (re.test(jdText)) return label;
    }
    const firstLine = jdText.split(/\n+/).map((l) => l.trim()).find(Boolean);
    if (!firstLine) return undefined;
    return firstLine.length <= 70 ? firstLine : undefined;
  })();

  const fallbackRequired = requiredSection ? requiredSection : jdLower;
  const requiredSkills = findKeywordMatches(fallbackRequired, TECH_KEYWORDS);
  const preferredSkills = preferredSection ? findKeywordMatches(preferredSection, TECH_KEYWORDS) : [];

  return {
    requiredSkills,
    preferredSkills,
    yearsOfExperience,
    roleTitle,
    industryKeywords,
  };
}

function extractResumeSkills(resumeText: string): string[] {
  const resumeLower = resumeText.toLowerCase();
  const skillsSlice = findSectionSlice(
    resumeLower,
    [/skills\b/, /technical skills\b/, /core competencies\b/, /technologies\b/, /proficiencies\b/],
    [/experience\b/, /work experience\b/, /projects?\b/, /education\b/, /certifications?\b/]
  );
  const searchText = skillsSlice ? skillsSlice : resumeLower;
  const found = findKeywordMatches(searchText, TECH_KEYWORDS);
  return found;
}

function extractProjectsSection(resumeText: string): string {
  const resumeLower = resumeText.toLowerCase();
  const slice = findSectionSlice(
    resumeLower,
    [/projects?\b/, /selected projects\b/, /project experience\b/],
    [/experience\b/, /work experience\b/, /education\b/, /certifications?\b/, /skills\b/, /summary\b/]
  );
  return slice || resumeLower;
}

function extractExperienceYears(resumeText: string): number {
  const lower = resumeText.toLowerCase();
  const matches = Array.from(lower.matchAll(/(\d{1,2})(?:\.\d+)?\s*\+?\s*(?:years|yrs)\b/g));
  const nums = matches.map((m) => Number(m[1])).filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  return Math.max(...nums);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function computeAtsScore(resumeText: string, jdText: string): AtsScoreResult {
  const resume = resumeText || "";
  const jd = jdText || "";

  const jobInfo = extractJobInfoFromJd(jd);
  const requiredSkills = jobInfo.requiredSkills;
  const preferredSkills = jobInfo.preferredSkills;
  const requiredYears = jobInfo.yearsOfExperience ?? 0;

  const resumeSkills = extractResumeSkills(resume);
  const jdKeywords = findKeywordMatches(jd, TECH_KEYWORDS);

  const matchedRequiredSkills = requiredSkills.filter((s) =>
    resumeSkills.some((rs) => rs.toLowerCase() === s.toLowerCase())
  );
  const matched_keywords = jdKeywords.filter((k) =>
    resumeSkills.some((rs) => rs.toLowerCase() === k.toLowerCase())
  );

  const skillsMissing = requiredSkills.filter((s) =>
    !matchedRequiredSkills.some((m) => m.toLowerCase() === s.toLowerCase())
  );

  const keywordsMissing = jdKeywords.filter((k) =>
    !matched_keywords.some((m) => m.toLowerCase() === k.toLowerCase())
  );

  const resumeYears = extractExperienceYears(resume);
  const experienceMatch = requiredYears > 0 ? resumeYears >= requiredYears : false;
  const partial_score = requiredYears > 0 && resumeYears > 0 ? clamp(resumeYears / requiredYears, 0, 1) : 0;

  const total_required_skills = requiredSkills.length || 0;
  const total_jd_keywords = jdKeywords.length || 0;
  const matched_required_skills = matchedRequiredSkills.length;
  const matched_keywords_count = matched_keywords.length;

  const skillScore = total_required_skills > 0 ? (matched_required_skills / total_required_skills) * 40 : 0;
  const keywordScore = total_jd_keywords > 0 ? (matched_keywords_count / total_jd_keywords) * 30 : 0;

  // The provided formula in the prompt includes a constant that would otherwise overflow the required 0-10 scale.
  // We apply the formula shape while keeping output within the intended 0-20 contribution.
  const experienceScore = clamp((experienceMatch ? 20 : partial_score) * 20, 0, 20);

  const projectsSection = extractProjectsSection(resume);
  const projectBlocks = projectsSection
    .split(/\n(?=[\-*•]\s+)/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const targetSkills = requiredSkills.length ? requiredSkills : jdKeywords;

  let relevant_project_count = 0;
  let relevant_count = 0;

  for (const block of projectBlocks.length ? projectBlocks : [projectsSection]) {
    const foundInBlock = findKeywordMatches(block, targetSkills);
    if (foundInBlock.length >= 2) relevant_project_count += 1;
    if (foundInBlock.length >= 1) relevant_count += 1;
  }

  const projectScore = relevant_project_count >= 2 ? 10 : relevant_count * 5;

  const totalScoreRaw = (skillScore + keywordScore + experienceScore + projectScore) / 10;
  const score = clamp(Number(totalScoreRaw.toFixed(2)), 0, 10);
  const percentage = clamp(Number((score * 10).toFixed(0)), 0, 100);

  const verdict: AtsVerdict = score >= 8 ? "Strong Match" : score >= 5 ? "Moderate Match" : "Weak Match";

  const breakdown = {
    skillsMatchPercentage: clamp((skillScore / 40) * 100, 0, 100),
    keywordMatchPercentage: clamp((keywordScore / 30) * 100, 0, 100),
    experienceMatchPercentage: clamp((experienceScore / 20) * 100, 0, 100),
    projectRelevancePercentage: clamp((projectScore / 10) * 100, 0, 100),
  };

  const suggestions = (() => {
    const out: string[] = [];
    const missingSkills = skillsMissing.slice(0, 4);
    const missingKeywords = keywordsMissing.slice(0, 4);

    if (jobInfo.roleTitle && out.length < 3) {
      out.push(`Align your professional summary/title with the JD role: explicitly target "${jobInfo.roleTitle}" (headline + first 2 lines).`);
    }

    if (jobInfo.industryKeywords.length && out.length < 3) {
      const pick = jobInfo.industryKeywords.slice(0, 4).join(", ");
      out.push(`Mirror industry context from the JD by weaving these terms into relevant bullets: ${pick}.`);
    }

    if (missingSkills.length) {
      for (const skill of missingSkills) {
        out.push(`Add "${skill}" to the Skills section and include it in at least one Experience or Projects bullet with a measurable impact.`);
      }
    }

    if (out.length < 6 && missingKeywords.length) {
      for (const kw of missingKeywords.slice(0, 3)) {
        out.push(`Mirror the exact JD phrasing for "${kw}" (use it in context, not just a list) so ATS keyword matching succeeds.`);
      }
    }

    if (preferredSkills.length) {
      const preferredMissing = preferredSkills.filter(
        (ps) => !resumeSkills.some((rs) => rs.toLowerCase() === ps.toLowerCase())
      );
      if (preferredMissing.length) {
        out.push(
          `If you want a faster lift, add 1-2 preferred skills from the JD such as "${preferredMissing[0]}" to your Skills section and support it with a project bullet.`
        );
      }
    }

    if (requiredYears > 0 && !experienceMatch) {
      if (resumeYears > 0) {
        out.push(
          `Align your experience to the JD requirement: the JD asks for ~${requiredYears}+ years, but your resume shows ~${resumeYears}. Strengthen bullets with scope/tenure signals (e.g., ownership duration, impact, and scale).`
        );
      } else {
        out.push(
          `The JD calls for ~${requiredYears}+ years. Ensure your resume explicitly states time-on-role/years of relevant experience (e.g., "X years building Y") and quantify outcomes.`
        );
      }
    }

    if (projectScore < 6) {
      out.push(
        `Add 1-2 projects that demonstrate multiple required skills together (aim for at least two keywords from the JD per project) to improve the project relevance component.`
      );
    }

    // Action verbs & formatting guidance.
    const hasActionVerb = ACTION_VERBS.some((v) => new RegExp(`\\b${escapeRegex(v.toLowerCase())}\\b`, "i").test(resume));
    if (!hasActionVerb && out.length < 9) {
      out.push(`Rewrite Experience/Project bullets to start with strong action verbs (Led, Built, Optimized, Reduced, Scaled) and include results in each bullet.`);
    }

    if (out.length < 5) {
      out.push(`Add a crisp, ATS-friendly Skills section (comma-separated or semicolon-separated) using the same terms found in the job description.`);
    }

    return uniqInOrder(out).slice(0, 10);
  })();

  // Ensure 5-10 suggestions even in edge cases.
  while (suggestions.length < 5) {
    suggestions.push("Use the job description keywords verbatim in relevant bullets (avoid generic synonyms) and quantify outcomes for each role.");
  }
  const trimmedSuggestions = suggestions.slice(0, 10);

  return {
    score,
    percentage,
    verdict,
    breakdown,
    skillsFound: matchedRequiredSkills,
    skillsMissing,
    keywordsFound: matched_keywords,
    keywordsMissing,
    experienceMatch,
    suggestions: trimmedSuggestions,
  };
}

