// New types for Loop Monitoring Dashboard

export type LoopStatus = 'running' | 'degraded' | 'paused';
export type AlertType = 'policy_blocked' | 'action_failed' | 'kpi_guardrail_violated';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type IntentLabel = 'MRO' | 'ES'; // | 'QoS' | 'TS'; // QoS and TS not supported yet
export type ExecutionStatus = 'sent' | 'ack' | 'applied' | 'failed' | 'rollback';

export interface OverviewData {
  loopStatus: LoopStatus;
  dataFreshness: {
    snapshotAge: number; // seconds
    featureCoverage: number; // percentage
  };
  activeIntents: {
    region: string;
    count: number;
    priority: Priority;
  }[];
  alerts: {
    id: string;
    type: AlertType;
    message: string;
    timestamp: Date;
    severity: Priority;
  }[];
}

export interface Hotspot {
  id: string;
  cellId: string;
  cluster: string;
  region: string;
  severityScore: number;
  lat?: number;
  lng?: number;
  reason: string;
  intentLabel: IntentLabel;
}

export interface Intent {
  id: string;
  intentLabel: IntentLabel;
  scope: {
    type: 'cell' | 'cluster';
    target: string;
  };
  confidence: number;
  timestamp: Date;
  region: string;
  priority: Priority;
}

export interface IntentDistribution {
  timestamp: Date;
  intents: Record<IntentLabel, number>;
}

export interface DecisionTreeNode {
  nodeId: number;
  condition: string;
  threshold: number;
  featureValue: number;
  featureName: string;
  passed: boolean;
}

export interface DecisionTreeTrace {
  intentId: string;
  intentLabel: IntentLabel;
  decision?: boolean; // ML model prediction result
  confidence?: number; // Prediction confidence
  path: DecisionTreeNode[];
  topFeatures: {
    name: string;
    value: number;
    importance: number;
  }[];
  counterfactual: {
    feature: string;
    currentValue: number;
    thresholdValue: number;
    alternativeIntent: IntentLabel;
  }[];
  featureSnapshot: Record<string, number>;
}

export interface PlannerAction {
  id: string;
  action: string;
  target: string;
  expectedGain: number;
  riskScore: number;
  parameters: Record<string, any>;
}

export interface PlannerOutput {
  planId: string;
  intentId: string;
  useCase: 'ES' | 'MRO'; // | 'TS' | 'QoS'; // QoS and TS not supported yet
  candidateActions: PlannerAction[];
  constraints: {
    name: string;
    passed: boolean;
    reason?: string;
  }[];
  timeline: {
    when: Date;
    where: string[];
    durationMinutes: number;
  };
  multiVendorCompatibility: {
    vendor: string;
    compatible: boolean;
    affectedParameters: string[];
  }[];
}

export interface ExecutionLog {
  executionId: string;
  planId: string;
  intentId: string;
  status: ExecutionStatus;
  timestamp: Date;
  errorReason?: string;
  targetCell: string;
}

export interface KPIDelta {
  metric: string;
  before: number;
  after: number;
  delta: number;
  deltaPercent: number;
  timeWindowMinutes: number;
}

export interface ExecutionOutcome {
  executionId: string;
  planId: string;
  intentId: string;
  logs: ExecutionLog[];
  kpiDeltas: KPIDelta[];
  attribution: {
    success: boolean;
    correlationScore: number;
  };
  rateLimiting: {
    cooldownMinutes: number;
    actionsRemainingInWindow: number;
  };
}
