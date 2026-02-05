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
