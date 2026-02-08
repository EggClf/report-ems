/**
 * Network Scan API Service
 * Fetches cell data from the network scan endpoint
 *
 * TEMPORARY WORKAROUND:
 * - The network scan API doesn't provide 'confidence' field
 * - We calculate it based on data completeness (see calculateConfidence method)
 * - See WORKAROUNDS.md for details and removal instructions
 */

const NETWORK_SCAN_URL = import.meta.env.VITE_NETWORK_SCAN_URL || 'http://172.16.28.63:8000/network-scan/scan';

export interface CellFeatures {
  intent_id: string;
  cellname: string;
  ne_name: string;
  timestamp: string;
  // MRO Features
  'Handover Failure Pressure'?: number | null;
  'Handover Success Stability'?: number | null;
  'Congestion-Induced HO Risk'?: number | null;
  'Mobility Volatility Index'?: number | null;
  'Weather-Driven Mobility Risk'?: number | null;
  n_alarm?: number;
  'Social Event Score'?: number | null;
  // ES Features
  'Persistent Low Load Score'?: number | null;
  'Energy Inefficiency Score'?: number | null;
  'Stable QoS Confidence'?: number | null;
  'Mobility Safety Index'?: number | null;
  'Traffic Volatility Index'?: number | null;
  'Weather Sensitivity Score'?: number | null;
}

export interface NetworkScanData {
  scan_time: string;
  target_timestamp: string;
  total_cells: number;
  mro_features: CellFeatures[];
  es_features: CellFeatures[];
}

class NetworkScanAPI {
  private baseUrl: string;

  constructor(baseUrl: string = NETWORK_SCAN_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch network scan data from the backend
   * @param date - Optional date to fetch data for (defaults to today)
   */
  async fetchNetworkScan(date?: Date): Promise<NetworkScanData> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: `${dateStr}T10:00:00`,
          enable_web_search: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Network scan failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch network scan data:', error);
      throw error;
    }
  }

  /**
   * Calculate confidence score based on data completeness
   * Temporary workaround since network scan API doesn't return confidence
   */
  private calculateConfidence(cell: CellFeatures, featureNames: string[]): number {
    // Count how many features have valid values
    let validFeatures = 0;
    let totalFeatures = 0;

    featureNames.forEach(name => {
      if (name === 'confidence' || name === 'n_alarm') return; // Skip these
      totalFeatures++;
      const value = (cell as any)[name];
      if (value !== null && value !== undefined) {
        validFeatures++;
      }
    });

    // Calculate confidence as percentage of valid features
    // Range: 0.7 to 0.95 based on completeness
    const completeness = totalFeatures > 0 ? validFeatures / totalFeatures : 0.5;
    const confidence = 0.7 + (completeness * 0.25);

    return Math.min(0.95, Math.max(0.7, confidence));
  }

  /**
   * Extract ML features from cell data for a specific model type
   */
  extractMLFeatures(cell: CellFeatures, modelType: 'ES' | 'MRO'): Record<string, number> {
    const features: Record<string, number> = {};

    if (modelType === 'ES') {
      // ES model features
      const esFeatureNames = [
        'confidence',
        'Persistent Low Load Score',
        'Energy Inefficiency Score',
        'Stable QoS Confidence',
        'Mobility Safety Index',
        'Social Event Score',
        'Traffic Volatility Index',
        'Weather Sensitivity Score',
        'n_alarm',
      ];

      // Calculate confidence based on data completeness
      const confidence = this.calculateConfidence(cell, esFeatureNames);

      esFeatureNames.forEach(name => {
        if (name === 'confidence') {
          features[name] = confidence;
        } else if (name === 'n_alarm') {
          features[name] = cell.n_alarm ?? 0;
        } else {
          const value = (cell as any)[name];
          // Use 0 as default for missing optional features
          features[name] = value !== null && value !== undefined ? value : 0;
        }
      });

      console.log(`ES features for ${cell.cellname}: confidence=${confidence.toFixed(3)}, valid_features=${Object.values(features).filter(v => v !== 0).length}/${esFeatureNames.length}`);

    } else {
      // MRO model features
      const mroFeatureNames = [
        'confidence',
        'Handover Failure Pressure',
        'Handover Success Stability',
        'Congestion-Induced HO Risk',
        'Mobility Volatility Index',
        'Weather-Driven Mobility Risk',
        'n_alarm',
        'Social Event Score',
      ];

      // Calculate confidence based on data completeness
      const confidence = this.calculateConfidence(cell, mroFeatureNames);

      mroFeatureNames.forEach(name => {
        if (name === 'confidence') {
          features[name] = confidence;
        } else if (name === 'n_alarm') {
          features[name] = cell.n_alarm ?? 0;
        } else {
          const value = (cell as any)[name];
          // Use 0 as default for missing optional features
          features[name] = value !== null && value !== undefined ? value : 0;
        }
      });

      console.log(`MRO features for ${cell.cellname}: confidence=${confidence.toFixed(3)}, valid_features=${Object.values(features).filter(v => v !== 0).length}/${mroFeatureNames.length}`);
    }

    return features;
  }

  /**
   * Merge MRO and ES features for a cell
   */
  mergeCellFeatures(mroFeatures: CellFeatures[], esFeatures: CellFeatures[]): CellFeatures[] {
    const merged: CellFeatures[] = [];

    // Use cell name as key to merge
    const esFeaturesMap = new Map(esFeatures.map(cell => [cell.cellname, cell]));

    mroFeatures.forEach(mroCell => {
      const esCell = esFeaturesMap.get(mroCell.cellname);
      if (esCell) {
        // Merge by taking non-null values from both, MRO first then ES
        const mergedCell: any = { ...mroCell };
        Object.entries(esCell).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            mergedCell[key] = value;
          }
        });
        // Always preserve metadata from MRO
        mergedCell.intent_id = mroCell.intent_id;
        mergedCell.cellname = mroCell.cellname;
        mergedCell.ne_name = mroCell.ne_name;
        mergedCell.timestamp = mroCell.timestamp;
        merged.push(mergedCell as CellFeatures);
      } else {
        merged.push(mroCell);
      }
    });

    return merged;
  }
}

// Export singleton instance
export const networkScanAPI = new NetworkScanAPI();
