/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface M5Telemetry {
  timestamp: string;
  system_status: 'safe' | 'heat_warning' | 'fall_danger';
  temperature: number;
  humidity: number;
  motion: number; // 0 or 1
  person_detected: boolean;
  speaker_volume: number;
  fall_detected: boolean;
  acceleration: number;
}
