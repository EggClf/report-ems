# 5G RAN Automation Platform - Terminology Reference

## Intent Classification Types

### MRO (Mobility Robustness Optimization)
**Purpose**: Optimize handover parameters and mobility performance
- **Triggers**: High handover failure rate, RLF rate above threshold
- **Actions**: CIO adjustment, handover parameter tuning, A3 offset optimization
- **KPIs**: Handover success rate, RLF rate, RSRP at handover
- **Target**: Reduce call drops and improve user experience during mobility

### ES (Energy Saving)
**Purpose**: Reduce network power consumption without compromising QoS
- **Triggers**: Low traffic periods, underutilized cells
- **Actions**: Cell sleep/wake, carrier shutdown, SSB configuration
- **KPIs**: Power consumption, PRB utilization, active user count
- **Target**: Minimize OPEX while maintaining service quality

### QoS (Quality of Service)
**Purpose**: Ensure service level agreements and 5QI requirements are met
- **Triggers**: 5QI violation, packet loss, latency issues
- **Actions**: QoS flow adjustment, scheduling policy changes, PDCP configuration
- **KPIs**: Packet delay, packet loss rate, 5QI satisfaction rate
- **Target**: Guarantee service quality for critical applications

### TS (Traffic Steering)
**Purpose**: Balance load across cells and optimize resource allocation
- **Triggers**: Cell overload, PRB utilization imbalance
- **Actions**: MLB parameter adjustment, inter-frequency load balancing
- **KPIs**: PRB utilization, throughput per cell, user distribution
- **Target**: Optimize network capacity and user experience

## Key 5G Network KPIs

### Radio Performance
- **RSRP** (Reference Signal Received Power): Signal strength in dBm (-140 to -44 dBm)
  - Good: > -90 dBm
  - Fair: -90 to -105 dBm
  - Poor: < -105 dBm

- **PRB Utilization**: Percentage of Physical Resource Blocks in use (0-100%)
  - Normal: < 70%
  - Busy: 70-85%
  - Congested: > 85%

- **CQI** (Channel Quality Indicator): Channel quality metric (0-15)
  - Excellent: 12-15
  - Good: 9-11
  - Fair: 6-8
  - Poor: < 6

### Mobility Metrics
- **Handover Success Rate**: Percentage of successful handovers (target: > 95%)
- **RLF Rate** (Radio Link Failure): Connection failures per 1000 attempts (target: < 2)
- **RACH Success Rate**: Random access success percentage (target: > 98%)

### Quality Metrics
- **5QI** (5G QoS Identifier): QoS class identifier for bearers
  - 5QI 1: Conversational voice
  - 5QI 5: IMS signaling
  - 5QI 9: Default bearer
  
- **Packet Delay**: End-to-end latency in milliseconds
- **Packet Loss Rate**: Percentage of lost packets (target: < 1%)

## Common 5G Actions

### MRO Actions
- **CIO (Cell Individual Offset)**: Handover bias between cells (-24 to +24 dB)
- **A3 Offset**: Handover trigger offset (0 to 30 dB)
- **Time-to-Trigger**: Handover decision delay (0 to 5120 ms)
- **Hysteresis**: Measurement fluctuation buffer (0 to 30 dB)

### ES Actions
- **Cell Sleep**: Power down underutilized cells
- **Carrier Shutdown**: Deactivate secondary carriers
- **SSB Configuration**: Adjust synchronization signal periodicity
- **MIMO Layer Reduction**: Reduce active antenna layers

### TS Actions
- **MLB (Mobility Load Balancing)**: Adjust handover parameters for load distribution
- **Inter-Frequency Load Balancing**: Steer users between frequency bands
- **Cell Range Expansion**: Extend cell coverage for load balancing

### QoS Actions
- **QoS Flow Adjustment**: Modify bearer QoS parameters
- **Scheduling Policy**: Change resource allocation strategy
- **PDCP Configuration**: Adjust compression and ciphering

## Vendor-Specific Parameters

### Ericsson
- `cellIndividualOffsetEUtran`: CIO parameter
- `qOffsetCell`: Handover offset
- `a3Offset`: A3 event offset
- `timeToTrigger`: Handover timer

### Huawei
- `CellIndividualOffset`: CIO parameter
- `QOffset`: Handover offset
- `HoA3Offset`: A3 event offset
- `TimeToTrigger`: Handover timer

### Nokia
- `individualOffset`: CIO parameter
- `qOffsetFreq`: Frequency-specific offset
- `a3Offset`: A3 event offset
- `timeToTrigger`: Handover timer

## System Architecture

### Loop Components
1. **Data Collection**: PM counters, UE measurements, trace data
2. **Feature Engineering**: KPI calculation, normalization
3. **Intent Classification**: ML model for intent detection
4. **Decision Tree**: Rule-based validation and path tracing
5. **Planner**: Action generation and optimization
6. **Executor**: Parameter configuration via vendor APIs
7. **Monitor**: Outcome tracking and attribution analysis

### Deployment Regions

#### Hà Nam Province
- Urban and suburban deployment
- Mixed traffic patterns
- Multi-vendor infrastructure

#### Khánh Hòa Province (Nha Trang)
- Coastal tourist area
- High seasonal traffic variation
- Focus on QoS for tourism services

## Guardrails and Constraints

### KPI Guardrails
- **PRB Utilization**: Must stay below 95% to prevent congestion
- **RSRP**: Must maintain above -110 dBm in coverage area
- **5QI Satisfaction**: Critical bearers must maintain > 98% success
- **RLF Rate**: Must stay below 2 per 1000 connections

### Operational Constraints
- **Peak Hours Policy**: Limited changes during high traffic (8am-10pm)
- **Rate Limiting**: Maximum 5 parameter changes per cell per hour
- **Cooldown Period**: 15-minute wait between successive actions
- **Neighbor Capacity**: Ensure neighbor cells can absorb offloaded traffic

### Business Rules
- **Energy Saving**: Only during low traffic hours (midnight-6am)
- **MRO Changes**: Require >100 samples for statistical significance
- **QoS Priority**: Never compromise critical service 5QIs
- **Multi-Vendor**: Ensure parameter compatibility across vendors

## Troubleshooting Guide

### Common Intent Scenarios

**High PRB Utilization (TS Intent)**
- Check: Traffic distribution across cells
- Action: MLB offset adjustment or carrier addition
- Expected: PRB utilization reduction by 10-20%

**Handover Failures (MRO Intent)**
- Check: RSRP at cell edge, neighbor list configuration
- Action: CIO adjustment, A3 offset tuning
- Expected: Handover success rate improvement to >95%

**Low Traffic Opportunity (ES Intent)**
- Check: Active users, traffic volume, time of day
- Action: Cell sleep, carrier shutdown
- Expected: Power reduction with maintained QoS

**5QI Violation (QoS Intent)**
- Check: Bearer configuration, scheduling policy
- Action: QoS flow adjustment, resource prioritization
- Expected: 5QI satisfaction >98%

---

**Document Version**: 2.0  
**Last Updated**: February 2026  
**Platform**: TaoQuan AI Loop Monitoring System
