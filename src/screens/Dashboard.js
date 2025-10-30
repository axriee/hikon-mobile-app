import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, TextInput, FlatList, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../supabaseClient';
import * as Notifications from 'expo-notifications';

// Configure notification handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false })
});

// Numeric metrics available in your `s3_sensor_data` table
const METRICS = [
  { key: 'heart_rate', label: 'Heart Rate' },
  { key: 'spo2', label: 'SpO2' },
  { key: 'accel_mag', label: 'Accel Mag' },
  { key: 'temperature', label: 'Temperature' },
  { key: 'humidity', label: 'Humidity' }
];

export default function Dashboard() {
  const [latest, setLatest] = useState(null);
  const [metric, setMetric] = useState('heart_rate');
  const [threshold, setThreshold] = useState('100');
  const [history, setHistory] = useState([]);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    requestNotificationPermission();
    fetchLatest();
    fetchHistory();
    subscribeRealtime();

    return () => {
      if (subscriptionRef.current && subscriptionRef.current.unsubscribe) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [metric]); // refetch when metric changes

  async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
    }
  }

  async function fetchLatest() {
    try {
      const { data, error } = await supabase
        .from('s3_sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setLatest(data[0]);
      }
    } catch (e) {
      console.error('fetchLatest', e.message);
    }
  }

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from('s3_sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory(data || []);
    } catch (e) {
      console.error('fetchHistory', e.message);
    }
  }

  function subscribeRealtime() {
    try {
      const channel = supabase.channel('public:s3_sensor_data')
        .on('postgres_changes', { event: '*', schema: 'public', table: 's3_sensor_data' }, (payload) => {
          const newRow = payload.new;
          if (newRow) {
            setLatest(newRow);
            setHistory((h) => [newRow, ...h].slice(0, 200));
            checkAndNotify(newRow);
          }
        })
        .subscribe();

      subscriptionRef.current = channel;
    } catch (e) {
      console.error('subscribeRealtime', e.message);
    }
  }

  async function checkAndNotify(row) {
    const t = Number(threshold);
    const value = Number(row?.[metric]);
    if (isNaN(value) || isNaN(t)) return;
    // default: notify when value >= threshold
    if (value >= t) {
      await sendLocalNotification(`${metric} ${value} ≥ ${t}`);
      try {
        const SMS_API_URL = '<REPLACE_WITH_SMS_API_URL>';
        if (SMS_API_URL && SMS_API_URL !== '<REPLACE_WITH_SMS_API_URL>') {
          await fetch(SMS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: '<RECEIVER_NUMBER_E.164>', message: `Alert: ${metric} ${value} at ${row.created_at}` })
          });
        } else {
          console.log('SMS API URL not configured. Skipping SMS.');
        }
      } catch (e) {
        console.error('sendSms', e.message);
      }
    }
  }

  async function sendLocalNotification(body) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Hikonulit Alert', body },
        trigger: null
      });
    } catch (e) {
      console.error('sendLocalNotification', e.message);
    }
  }

  async function manualCheck() {
    await fetchLatest();
    if (latest) checkAndNotify(latest);
    Alert.alert('Checked', 'Latest value fetched and checked.');
  }

  async function addRandomMeasurement() {
    // Demo insert into s3_sensor_data. device_id is required in your schema.
    try {
      const heart_rate = Math.floor(50 + Math.random() * 100);
      const spo2 = Math.floor(88 + Math.random() * 12);
      const accel_mag = Math.random() * 5;
      const temperature = 36 + Math.random() * 3;
      const humidity = Math.floor(30 + Math.random() * 50);
      const risk_level = heart_rate > 120 || spo2 < 90 ? 'high' : 'low';

      const payload = {
        device_id: 'demo-device-1',
        heart_rate,
        spo2,
        accel_mag,
        temperature,
        humidity,
        prediction_label: null,
        risk_level
      };

      const { data, error } = await supabase.from('s3_sensor_data').insert([payload]);
      if (error) throw error;
      Alert.alert('Inserted', `Inserted demo row: hr=${heart_rate}, spo2=${spo2}`);
    } catch (e) {
      console.error('addRandomMeasurement', e.message);
      Alert.alert('Error', e.message);
    }
  }

  function renderMetricButtons() {
    return (
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {METRICS.map((m) => (
          <TouchableOpacity
            key={m.key}
            onPress={() => setMetric(m.key)}
            style={[styles.metricButton, metric === m.key && styles.metricButtonActive]}
          >
            <Text style={metric === m.key ? { color: '#fff' } : {}}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hikonulit Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Latest ({METRICS.find(m => m.key === metric)?.label})</Text>
        <Text style={styles.value}>{latest ? String(latest[metric]) : '—'}</Text>
        <Text style={styles.time}>{latest ? new Date(latest.created_at).toLocaleString() : ''}</Text>
        <Text style={{ color: '#666', marginTop: 6 }}>{latest ? `Device: ${latest.device_id}` : ''}</Text>
      </View>

      <View style={styles.controls}>
        {renderMetricButtons()}
        <TextInput
          style={styles.input}
          value={String(threshold)}
          keyboardType="numeric"
          onChangeText={setThreshold}
          placeholder="Threshold"
        />
        <Button title="Manual check" onPress={manualCheck} />
        <View style={{ height: 8 }} />
        <Button title="Insert demo row" onPress={addRandomMeasurement} />
      </View>

      <Text style={{ marginTop: 16, fontWeight: 'bold' }}>Recent</Text>
      <FlatList
        style={{ width: '100%' }}
        data={history}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text>{new Date(item.created_at).toLocaleTimeString()}</Text>
            <Text style={{ marginLeft: 12 }}>{String(item[metric] ?? '-')}</Text>
            <Text style={{ marginLeft: 12, color: '#666' }}>{item.risk_level ?? ''}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { width: '100%', padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center' },
  label: { color: '#666' },
  value: { fontSize: 32, fontWeight: '700', marginTop: 6 },
  time: { color: '#888', marginTop: 4 },
  controls: { width: '100%', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, width: '100%', borderBottomWidth: 1, borderColor: '#eee' },
  metricButton: { padding: 8, marginRight: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  metricButtonActive: { backgroundColor: '#007aff', borderColor: '#007aff' }
});
