/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets, 
  Eye, 
  Volume2, 
  VolumeX, 
  User, 
  UserMinus, 
  AlertTriangle, 
  Database, 
  Terminal, 
  Copy, 
  Check, 
  Flame, 
  Clock 
} from 'lucide-react';
import { M5Telemetry } from './types';

export default function App() {
  const [telemetry, setTelemetry] = useState<M5Telemetry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const FIREBASE_URL = "https://aesa-ff04e-default-rtdb.europe-west1.firebasedatabase.app/sensor_data.json";

  // CHANGED: Fetch telemetry logs directly from Firebase Realtime Database
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch(FIREBASE_URL);
      const json = await res.json();
      
      if (json) {
        // Firebase returns data as an object of objects: { "-O1abc": { ...data }, "-O2def": { ...data } }
        // We convert this object map into a clean sorted array
        const formattedData: M5Telemetry[] = Object.keys(json).map((key) => {
          const item = json[key];
          return {
            timestamp: item.timestamp || 'Unknown Time',
            system_status: item.system_status || 'safe',
            temperature: Number(item.temperature) || 0,
            humidity: Number(item.humidity) || 0,
            motion: Number(item.motion) || 0,
            person_detected: Object.prototype.hasOwnProperty.call(item, 'person_detected') ? Boolean(item.person_detected) : true,
            speaker_volume: Number(item.speaker_volume) || 0,
            fall_detected: Object.prototype.hasOwnProperty.call(item, 'fall_detected') ? Boolean(item.fall_detected) : false,
            acceleration: Number(item.acceleration) || 0
          };
        });

        // Reverse the array so the newest records sent from Postman show up first
        setTelemetry(formattedData.reverse().slice(0, 15));
        setError('');
      } else {
        setTelemetry([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to fetch live telemetry stream from Firebase.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for real-time updates every 2.5 seconds
  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2500);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Post simulator report to API
  const sendReport = async (payload: Partial<M5Telemetry>) => {
    try {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${days[now.getDay()]} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const body = {
        timestamp: timestampStr,
        system_status: payload.system_status || 'safe',
        temperature: payload.temperature || 25,
        humidity: payload.humidity || 50,
        motion: payload.motion || 0,
        person_detected: payload.person_detected ?? true,
        speaker_volume: payload.speaker_volume || 0,
        fall_detected: payload.fall_detected ?? false,
        acceleration: payload.acceleration || 1.0,
      };

      const res = await fetch(FIREBASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.name) {
        fetchTelemetry();
      }
    } catch (err) {
      console.error('Failed to post simulated report:', err);
    }
  };

  const copyCurl = () => {
    const cmd = `curl -X POST "${FIREBASE_URL}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "timestamp": "2026-07-08 Wed 17:57:06",
    "system_status": "heat_warning",
    "temperature": 30.35,
    "humidity": 79.36,
    "motion": 1,
    "person_detected": true,
    "speaker_volume": 40,
    "fall_detected": false,
    "acceleration": 1.040342
  }'`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get current active state (first/latest item in the telemetry list)
  const current: M5Telemetry = telemetry[0] || {
    timestamp: "N/A",
    system_status: "safe",
    temperature: 0,
    humidity: 0,
    motion: 0,
    person_detected: false,
    speaker_volume: 0,
    fall_detected: false,
    acceleration: 0
  };

  // Status visual configurations
  let statusBg = 'bg-slate-900 border-slate-800 text-white';
  let statusText = 'Resident Safe';
  let statusIcon = <Heart className="w-8 h-8 text-emerald-400 fill-emerald-400/20" />;
  let description = 'Living space metrics are in safe bounds. Resident is secure.';

  if (current.system_status === 'fall_danger' || current.fall_detected) {
    statusBg = 'bg-red-950 border-red-500/40 text-red-100 strobe-alert';
    statusText = 'CRITICAL FALL DETECTED!';
    statusIcon = <AlertTriangle className="w-9 h-9 text-red-500 fill-red-500/20 animate-bounce" />;
    description = `Emergency warning active. Accelerometer shock registered high impact G force: ${current.acceleration.toFixed(4)}G.`;
  } else if (current.system_status === 'heat_warning') {
    statusBg = 'bg-amber-950 border-amber-500/40 text-amber-100';
    statusText = 'HEAT WARNING ONGOING';
    statusIcon = <Flame className="w-8 h-8 text-amber-500 animate-pulse" />;
    description = `Ambient temperature has crossed comfort bounds: ${current.temperature}°C. `;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-6" id="header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-violet-400 font-extrabold text-lg">
              M5
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display tracking-tight text-white">AESA IoT Monitor</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Live
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20 uppercase tracking-widest flex items-center gap-1">
                  <Database className="w-3 h-3" /> Firebase Connected
                </span>
              </div>
               <p className="text-xs text-slate-400 mt-0.5">
                Accessible and Safe Environment Assistant (AESA): An IoT-Based Independent Living Monitoring System
              </p>
              
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time dashboard syncing effortlessly with your cloud database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Latest Report: {current.timestamp}</span>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* HERO STATUS BANNER */}
        <div className={`p-6 rounded-2xl border ${statusBg} transition-all duration-300 shadow-xl relative overflow-hidden`} id="status-hero">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                {statusIcon}
              </div>
              <div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/10 text-white mb-2`}>
                  System State
                </span>
                <h2 className="text-2xl font-bold font-display tracking-tight leading-none text-white">
                  {statusText}
                </h2>
                <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-white/5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {current.person_detected ? (
                    <span className="text-emerald-400 font-medium">User Present</span>
                  ) : (
                    <span className="text-slate-400 font-medium">No User Detected</span>
                  )}
                </span>
              </div>
              <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-white/5 flex items-center gap-1.5">
                {current.speaker_volume > 0 ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400 font-medium">Speaker Volume ({current.speaker_volume}%)</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">Speaker Muted</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SENSOR GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" id="metric-cards">
          <div className={`p-5 rounded-2xl bg-slate-900 border ${current.system_status === 'heat_warning' ? 'border-amber-500/30 bg-amber-950/10' : 'border-slate-800'} shadow flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-sky-400" /> Temperature
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white font-display">
                  {current.temperature ? current.temperature.toFixed(2) : '--'}
                </span>
                <span className="text-sm text-slate-400 font-medium">°C</span>
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl bg-slate-900 border ${current.system_status === 'heat_warning' ? 'border-amber-500/30 bg-amber-950/10' : 'border-slate-800'} shadow flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-400" /> Humidity
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white font-display">
                  {current.humidity ? current.humidity.toFixed(2) : '--'}
                </span>
                <span className="text-sm text-slate-400 font-medium">%</span>
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl bg-slate-900 border ${current.motion > 0 ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800'} shadow flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" /> PIR Motion
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white font-display">
                  {current.motion}
                </span>
                <span className="text-xs text-slate-400 font-mono"> val</span>
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl bg-slate-900 border ${!current.person_detected ? 'border-red-500/20 bg-red-950/5' : 'border-slate-800'} shadow flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-purple-400" /> User Detection
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                {current.person_detected ? (
                  <span className="text-base font-bold text-emerald-400">Present</span>
                ) : (
                  <span className="text-base font-bold text-slate-400">Empty</span>
                )}
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl bg-slate-900 border ${current.fall_detected ? 'border-red-500/30 bg-red-950/10' : 'border-slate-800'} shadow flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-500" /> IMU Acceleration
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white font-display">
                  {current.acceleration ? current.acceleration.toFixed(4) : '--'}
                </span>
                <span className="text-xs text-slate-400 font-mono">m/s²</span>
              </div>
            </div>
          </div>
        </div>

        {/* LOG RECORDS AND DOCUMENTATION PANEL */}
        <div className="overflow-x-auto overflow-y-auto max-h-[450px] pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-15 flex flex-col" id="log-table">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold font-display text-white">Live Telemetry History Log</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5">Timestamp</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Temp</th>
                    <th className="py-2.5">Hum</th>
                    <th className="py-2.5">User</th>
                    <th className="py-2.5 text-right">Acceleration</th>
                    <th className="py-2.5 text-right">Speaker Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {telemetry.map((log, idx) => {
                    let alertLabel = 'Safe';
                    let badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    if (log.system_status === 'fall_danger' || log.fall_detected) {
                      alertLabel = 'Fall Danger';
                      badgeColor = 'bg-red-500/20 text-red-400 border border-red-500/30';
                    } else if (log.system_status === 'heat_warning') {
                      alertLabel = 'Heat Warning';
                      badgeColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                    }

                    return (
                      <tr key={idx} className="hover:bg-slate-850/40 text-slate-300">
                        <td className="py-3 font-mono text-[11px] text-slate-400">{log.timestamp}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${badgeColor}`}>
                            {alertLabel}
                          </span>
                        </td>
                        <td className="py-3 font-medium">{log.temperature.toFixed(2)} °C</td>
                        <td className="py-3 text-slate-400">{log.humidity.toFixed(2)} %</td>
                        <td className="py-3 text-slate-400">{log.person_detected ? "Present" : "No User"}</td>
                        <td className="py-3 text-right font-mono font-semibold text-slate-200">{log.acceleration.toFixed(4)} G</td>
                        <td className="py-3 text-right font-mono font-semibold text-slate-200">{log.speaker_volume.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}