import type { Criterion, Question, Questionnaire } from "./types";

/**
 * Source definition of the current questionnaire version. It is loaded into the
 * database by prisma/seed.ts; the running application reads the database.
 * Never edit a published version in place: copy it under a new code instead.
 */
export const QUESTIONNAIRE_VERSION = "Q-1.0";

export const CRITERIA: Criterion[] = [
  {
    id: "effectiveness",
    name: "Effectiveness",
    description:
      "Information is relevant and pertinent to the business process and delivered in a timely, correct, consistent and usable manner.",
  },
  {
    id: "efficiency",
    name: "Efficiency",
    description: "Information is provided through the optimal (most productive and economical) use of resources.",
  },
  {
    id: "confidentiality",
    name: "Confidentiality",
    description: "Sensitive information is protected from unauthorized disclosure.",
  },
  {
    id: "integrity",
    name: "Integrity",
    description:
      "Information is accurate, complete and valid in accordance with business values and expectations.",
  },
  {
    id: "availability",
    name: "Availability",
    description:
      "Information is available when required by the business process, now and in the future, and the necessary resources are safeguarded.",
  },
  {
    id: "compliance",
    name: "Compliance",
    description:
      "The system complies with the laws, regulations and contractual arrangements to which the business process is subject.",
  },
  {
    id: "reliability",
    name: "Reliability",
    description:
      "The system provides appropriate information for management to operate the entity and exercise its fiduciary and governance responsibilities.",
  },
];

export const QUESTIONS: Question[] = [
  // Effectiveness
  {
    id: "EFF-01",
    criterion: "effectiveness",
    text: "Are the business requirements that the system must support documented and approved by business owners?",
    risk: "The system may not support the business processes it is intended to serve.",
    recommendation:
      "Document the business requirements and have them formally approved by the responsible business owners; review them at each major change.",
  },
  {
    id: "EFF-02",
    criterion: "effectiveness",
    text: "Do users receive the information they need in time to perform their tasks?",
    risk: "Late information can delay decisions and operational activities.",
    recommendation:
      "Identify time-critical information flows, define delivery deadlines and monitor them.",
  },
  {
    id: "EFF-03",
    criterion: "effectiveness",
    text: "Is user satisfaction with the system measured periodically (survey, feedback, tickets analysis)?",
    risk: "Usability or relevance problems may remain undetected.",
    recommendation:
      "Set up a periodic user satisfaction measurement and track the resulting improvement actions.",
  },
  {
    id: "EFF-04",
    criterion: "effectiveness",
    text: "Are changes to the system tested and accepted by users before going into production?",
    critical: true,
    risk: "Untested changes can disrupt business operations or produce incorrect results.",
    recommendation:
      "Introduce a change management process requiring documented testing and formal user acceptance before production deployment.",
  },
  {
    id: "EFF-05",
    criterion: "effectiveness",
    text: "Are users trained and is up-to-date user documentation available?",
    risk: "Incorrect use of the system may lead to errors and loss of value.",
    recommendation: "Provide training for new users and keep the user documentation up to date.",
  },

  // Efficiency
  {
    id: "EFI-01",
    criterion: "efficiency",
    text: "Are the operating costs of the system (licences, infrastructure, support) known and monitored?",
    risk: "Costs may drift without being noticed or justified.",
    recommendation: "Establish a cost model for the system and review it at least annually.",
  },
  {
    id: "EFI-02",
    criterion: "efficiency",
    text: "Are system performance and capacity (response times, storage, load) monitored?",
    risk: "Performance degradation may impact productivity before it is detected.",
    recommendation:
      "Define performance indicators and capacity thresholds, and monitor them with alerting.",
  },
  {
    id: "EFI-03",
    criterion: "efficiency",
    text: "Are repetitive manual tasks around the system (data re-entry, manual reconciliations) limited or automated?",
    risk: "Manual work increases costs and the likelihood of errors.",
    recommendation:
      "Inventory recurring manual tasks and prioritize automation or interface opportunities.",
  },
  {
    id: "EFI-04",
    criterion: "efficiency",
    text: "Are licences and resources reviewed to remove those that are unused?",
    risk: "Unused resources generate unnecessary costs.",
    recommendation: "Perform a periodic review of licences and infrastructure resources.",
  },
  {
    id: "EFI-05",
    criterion: "efficiency",
    text: "Are there service levels (SLAs) agreed with the IT department or suppliers?",
    risk: "Without agreed service levels, performance cannot be measured or enforced.",
    recommendation: "Define and agree service levels with internal IT and external suppliers.",
  },

  // Confidentiality
  {
    id: "CON-01",
    criterion: "confidentiality",
    text: "Is access to the system granted based on a formal request and approval, according to the least-privilege principle?",
    critical: true,
    risk: "Users may obtain access rights exceeding their needs, enabling unauthorized disclosure.",
    recommendation:
      "Implement a formal access request and approval workflow based on roles and least privilege.",
  },
  {
    id: "CON-02",
    criterion: "confidentiality",
    text: "Are access rights reviewed periodically and removed promptly when a person leaves or changes role?",
    critical: true,
    risk: "Former employees or users who changed role may retain access to sensitive information.",
    recommendation:
      "Review access rights at least annually and link access removal to the HR leaver/mover process.",
  },
  {
    id: "CON-03",
    criterion: "confidentiality",
    text: "Is strong authentication (e.g. multi-factor authentication) used, at least for remote and privileged access?",
    critical: true,
    risk: "Compromised passwords may allow attackers to access the system.",
    recommendation:
      "Enforce multi-factor authentication for remote, administrative and privileged accounts.",
  },
  {
    id: "CON-04",
    criterion: "confidentiality",
    text: "Are sensitive data encrypted in transit and at rest?",
    risk: "Intercepted or stolen data may be read by unauthorized parties.",
    recommendation:
      "Encrypt data in transit (TLS) and at rest for sensitive information, including backups.",
  },
  {
    id: "CON-05",
    criterion: "confidentiality",
    text: "Is the data processed by the system classified according to its sensitivity?",
    risk: "Without classification, protection measures may not match data sensitivity.",
    recommendation: "Classify the system's data and define the protection requirements for each level.",
  },

  // Integrity
  {
    id: "INT-01",
    criterion: "integrity",
    text: "Are input controls in place to detect invalid, incomplete or duplicate data?",
    risk: "Erroneous data can enter the system and propagate to reports and decisions.",
    recommendation:
      "Implement input validation rules (formats, mandatory fields, ranges, duplicate checks).",
  },
  {
    id: "INT-02",
    criterion: "integrity",
    text: "Are interfaces and data transfers with other systems controlled (reconciliations, error handling)?",
    risk: "Data may be lost or altered during transfers without detection.",
    recommendation:
      "Implement control totals, reconciliations and error queues on interfaces, with follow-up of rejects.",
  },
  {
    id: "INT-03",
    criterion: "integrity",
    text: "Are changes to critical data and configuration logged in an audit trail that cannot be altered by users?",
    critical: true,
    risk: "Unauthorized or fraudulent changes may go undetected and be impossible to investigate.",
    recommendation:
      "Enable audit logging of critical data and configuration changes and protect logs from modification.",
  },
  {
    id: "INT-04",
    criterion: "integrity",
    text: "Are incompatible duties segregated (e.g. the same person cannot create and approve a transaction)?",
    critical: true,
    risk: "A single person could carry out and conceal errors or fraud.",
    recommendation:
      "Define a segregation of duties matrix and enforce it through access roles; apply compensating controls where not possible.",
  },
  {
    id: "INT-05",
    criterion: "integrity",
    text: "Are production changes restricted to authorized persons and separated from development?",
    risk: "Uncontrolled changes may alter system behaviour or data.",
    recommendation:
      "Separate development, test and production environments and restrict production deployment rights.",
  },

  // Availability
  {
    id: "AVA-01",
    criterion: "availability",
    text: "Are backups performed regularly and stored in a separate location (including an offline or immutable copy)?",
    critical: true,
    risk: "Data could be permanently lost after an incident, failure or ransomware attack.",
    recommendation:
      "Implement regular backups following the 3-2-1 principle, with at least one offline or immutable copy.",
  },
  {
    id: "AVA-02",
    criterion: "availability",
    text: "Are data restorations from backups tested periodically?",
    critical: true,
    risk: "Backups may prove unusable when they are needed.",
    recommendation: "Perform and document restoration tests at least annually.",
  },
  {
    id: "AVA-03",
    criterion: "availability",
    text: "Have maximum tolerable downtime and data loss (RTO/RPO) been defined for the system?",
    risk: "Recovery capabilities may not match business needs.",
    recommendation: "Define RTO and RPO with business owners and align the technical recovery capabilities.",
  },
  {
    id: "AVA-04",
    criterion: "availability",
    text: "Is there a documented and tested continuity or disaster recovery plan covering the system?",
    risk: "Recovery after a major incident may be slow and improvised.",
    recommendation: "Document a disaster recovery plan for the system and test it periodically.",
  },
  {
    id: "AVA-05",
    criterion: "availability",
    text: "Are security updates and patches applied to the system and its infrastructure within defined timeframes?",
    risk: "Known vulnerabilities may be exploited to disrupt or compromise the system.",
    recommendation:
      "Define a patch management policy with deadlines based on severity and monitor its application.",
  },

  // Compliance
  {
    id: "COM-01",
    criterion: "compliance",
    text: "Have the legal, regulatory and contractual requirements applicable to the system been identified?",
    risk: "The organization may be unaware of obligations and exposed to sanctions.",
    recommendation:
      "Establish and maintain an inventory of applicable legal, regulatory and contractual requirements.",
  },
  {
    id: "COM-02",
    criterion: "compliance",
    text: "If the system processes personal data, is the processing documented (e.g. GDPR record of processing activities)?",
    critical: true,
    risk: "Undocumented personal data processing may breach data protection law.",
    recommendation:
      "Document the processing in the record of processing activities and assess whether a DPIA is required.",
  },
  {
    id: "COM-03",
    criterion: "compliance",
    text: "Are data retention periods defined and applied?",
    risk: "Data may be kept longer than permitted or deleted too early.",
    recommendation: "Define retention periods for each data category and implement deletion or archiving.",
  },
  {
    id: "COM-04",
    criterion: "compliance",
    text: "Do contracts with suppliers and hosting providers include security, confidentiality and data protection clauses?",
    risk: "Suppliers may not be bound to protect the organization's data.",
    recommendation:
      "Review supplier contracts and include security, confidentiality, audit and data processing clauses.",
  },
  {
    id: "COM-05",
    criterion: "compliance",
    text: "Has the system been subject to an internal or external audit or compliance review in the last three years?",
    risk: "Non-compliances may remain undetected.",
    recommendation: "Plan a periodic independent review of the system's controls.",
  },

  // Reliability
  {
    id: "REL-01",
    criterion: "reliability",
    text: "Are the reports produced by the system used for management decisions reconciled or validated?",
    critical: true,
    risk: "Management decisions may be based on incorrect information.",
    recommendation:
      "Implement reconciliations and validation procedures for key management and financial reports.",
  },
  {
    id: "REL-02",
    criterion: "reliability",
    text: "Are calculation rules and report definitions documented and controlled when changed?",
    risk: "Report results may change without anyone being aware.",
    recommendation: "Document calculation rules and apply change management to report definitions.",
  },
  {
    id: "REL-03",
    criterion: "reliability",
    text: "Is there a designated owner responsible for the system and its data?",
    risk: "Without clear ownership, issues may not be addressed and decisions may not be taken.",
    recommendation: "Appoint a business owner and a data owner for the system with defined responsibilities.",
  },
  {
    id: "REL-04",
    criterion: "reliability",
    text: "Are incidents and errors recorded, analysed and followed up until resolution?",
    risk: "Recurring problems may persist and affect the reliability of information.",
    recommendation: "Implement incident management with root-cause analysis for recurring issues.",
  },
  {
    id: "REL-05",
    criterion: "reliability",
    text: "Are key indicators on the system's performance and control status reported to management?",
    risk: "Management may lack visibility over the system's condition.",
    recommendation: "Define a small set of indicators reported periodically to management.",
  },
];

export const CURRENT_QUESTIONNAIRE: Questionnaire = {
  code: QUESTIONNAIRE_VERSION,
  criteria: CRITERIA,
  questions: QUESTIONS,
};
