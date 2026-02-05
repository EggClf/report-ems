export interface KPIMetric {
  name: string;
  value: number;
  threshold: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  importance: number;
}

export interface RecommendedAction {
  profile?: string;
  mode?: string;
  scope?: string;
  duration_min?: number;
  parameters?: Record<string, number | string>;
}

export interface Decision {
  strategy: 'MRO' | 'ENERGY_SAVING' | 'MONITORING';
  confidence: number;
  recommended_action: RecommendedAction;
}

export interface WhyExplanation {
  summary: string;
  rules_triggered: string[];
  top_kpis: KPIMetric[];
}

export interface Guardrail {
  energy_saving_blocked?: boolean;
  reason?: string;
}

export interface ExpectedImpact {
  qos?: Record<string, string>;
  energy?: Record<string, string>;
}

export interface OperatorOptions {
  can_apply: boolean;
  can_override: boolean;
  can_simulate: boolean;
}

export interface DecisionResponse {
  metadata: {
    region: string;
    cell_id: string;
    time_window: string;
    model_version: string;
  };
  decision: Decision;
  why: WhyExplanation;
  guardrail?: Guardrail;
  expected_impact: ExpectedImpact;
  operator_options: OperatorOptions;
}

// New Metrics Types
export interface StrategicMetric {
  intent_type: 'ES' | 'MRO' | 'TS' | 'QoS';
  target_scope: string; // Cluster_ID or Cell_ID
  decision_path: string;
  model_version: string;
  value: number; // 1 for active or confidence score
  timestamp: string;
}

export interface TacticalActionMetric {
  agent_type: string; // ES, MRO, etc.
  action_name: string; // cell_sleep, power_offset, handover_threshold
  status: 'success' | 'failed' | 'rejected_by_safety_layer';
  value: number; // Value change (e.g., power reduction in dB)
  timestamp: string;
  target: string;
}

export interface TacticalPerformanceMetric {
  agent_type: string;
  metric_type: 'reward' | 'episode_length' | 'q_value_mean';
  value: number;
  timestamp: string;
}

export interface OperationalMetric {
  metric_name: 'loop_latency_seconds' | 'model_drift_score' | 'resource_usage';
  value: number;
  timestamp: string;
  labels?: {
    agent?: string;
    resource_type?: 'GPU' | 'CPU';
  };
}

export interface MetricsSnapshot {
  strategic: StrategicMetric[];
  tactical_actions: TacticalActionMetric[];
  tactical_performance: TacticalPerformanceMetric[];
  operational: OperationalMetric[];
  last_updated: string;
}
