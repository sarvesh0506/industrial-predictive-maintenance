import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocketTelemetry() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [latestReadings, setLatestReadings] = useState({});
  const [chartStreams, setChartStreams] = useState({
    temperature: [],
    vibration: [],
    pressure: [],
    rpm: [],
    current: [],
    voltage: []
  });

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      // Connect directly to backend WebSocket /ws
      const wsUrl = `${protocol}//${host}/ws/websocket`;
      
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('CONNECTED');
        // Send STOMP CONNECT Frame
        ws.send("CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\0");
      };

      ws.onmessage = (event) => {
        const message = event.data;
        
        if (message.startsWith('CONNECTED')) {
          // Send STOMP SUBSCRIBE Frame for /topic/telemetry
          ws.send("SUBSCRIBE\nid:sub-0\ndestination:/topic/telemetry\n\n\0");
          return;
        }

        if (message.startsWith('MESSAGE')) {
          try {
            const bodyIndex = message.indexOf('\n\n');
            if (bodyIndex !== -1) {
              const bodyStr = message.substring(bodyIndex + 2, message.length - 1).trim();
              if (bodyStr) {
                const data = JSON.parse(bodyStr);
                processIncomingReading(data);
              }
            }
          } catch (e) {
            // Ignore malformed message frames
          }
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        setConnectionStatus('ERROR');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('RECONNECTING');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 4000);
      };
    } catch (err) {
      setIsConnected(false);
      setConnectionStatus('ERROR');
    }
  }, []);

  const processIncomingReading = (reading) => {
    if (!reading || !reading.sensorType || reading.value == null) return;

    const timeLabel = new Date(reading.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const stype = reading.sensorType.toLowerCase();

    // Update Latest Readings Map for Fleet Table
    if (reading.sensorCode || reading.sensorId) {
      const machineCode = reading.sensorCode ? reading.sensorCode.split('-').slice(-2).join('-') : 'MCH-CNC-001';
      setLatestReadings((prev) => ({
        ...prev,
        [machineCode]: {
          ...(prev[machineCode] || {}),
          [stype]: reading.value,
          lastUpdated: timeLabel
        }
      }));
    }

    // Update Live Chart Streams
    if (['temperature', 'vibration', 'pressure', 'rpm', 'current', 'voltage'].includes(stype)) {
      setChartStreams((prev) => {
        const existing = prev[stype] || [];
        const updated = [...existing, { time: timeLabel, value: reading.value }];
        // Keep last 15 stream points
        return {
          ...prev,
          [stype]: updated.slice(-15)
        };
      });
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    connectionStatus,
    latestReadings,
    chartStreams,
    processIncomingReading
  };
}
