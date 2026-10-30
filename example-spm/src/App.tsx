import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  MPSessionReplay,
  MPSessionReplayConfig,
  MPSessionReplayRemoteSettingsMode,
  MPSessionReplayView,
} from '@mixpanel/react-native-session-replay';

const TOKEN = 'MIXPANEL_API_KEY_HERE';
const DISTINCT_ID = `user-${Math.floor(Math.random() * 1e9)}`;

type InitState = 'initializing' | 'initialized' | 'failed';

export default function App() {
  const [initState, setInitState] = useState<InitState>('initializing');
  const [recording, setRecording] = useState(false);
  const [note, setNote] = useState('Sample text input');
  const [switchValue, setSwitchValue] = useState(false);

  const checkRecordingStatus = useCallback(async () => {
    try {
      setRecording(await MPSessionReplay.isRecording());
    } catch (error) {
      console.error('Error checking recording status:', error);
    }
  }, []);

  // Initialize as soon as the app launches.
  useEffect(() => {
    const config = new MPSessionReplayConfig({
      enableLogging: true,
      remoteSettingsMode: MPSessionReplayRemoteSettingsMode.Disabled,
    });
    MPSessionReplay.initialize(TOKEN, DISTINCT_ID, config)
      .then(() => {
        setInitState('initialized');
        // CI looks for this line in the device log to confirm the native SDK initialized.
        console.log('SessionReplayExampleSpm: initialized');
        return checkRecordingStatus();
      })
      .catch((error) => {
        setInitState('failed');
        console.error('Initialization error:', error);
      });
  }, [checkRecordingStatus]);

  useEffect(() => {
    if (initState !== 'initialized') {
      return undefined;
    }
    const interval = setInterval(checkRecordingStatus, 2000);
    return () => clearInterval(interval);
  }, [initState, checkRecordingStatus]);

  const run = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action();
      await checkRecordingStatus();
    } catch (error) {
      Alert.alert('Error', `${label} failed: ${error}`);
      console.error(`${label} error:`, error);
    }
  };

  const ready = initState === 'initialized';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Session Replay (SPM)</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {initState === 'initializing' && 'Initializing…'}
          {initState === 'failed' && 'Initialization failed'}
          {ready && (recording ? '🔴 Recording' : '⭕ Not Recording')}
        </Text>
        <Text style={styles.userText}>User: {DISTINCT_ID}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, (!ready || recording) && styles.disabledButton]}
        onPress={() => run('Start recording', MPSessionReplay.startRecording)}
        disabled={!ready || recording}
      >
        <Text style={styles.buttonText}>Start Recording</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, (!ready || !recording) && styles.disabledButton]}
        onPress={() => run('Stop recording', MPSessionReplay.stopRecording)}
        disabled={!ready || !recording}
      >
        <Text style={styles.buttonText}>Stop Recording</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.flushButton, !ready && styles.disabledButton]}
        onPress={() => run('Flush', MPSessionReplay.flush)}
        disabled={!ready}
      >
        <Text style={styles.buttonText}>Flush Events</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Text</Text>
      <Text style={styles.paragraph}>
        Plain text is masked by default. Recordings show its outline but not its
        content.
      </Text>

      <Text style={styles.sectionTitle}>Input</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="Type something"
      />

      <Text style={styles.sectionTitle}>Sensitive View</Text>
      <MPSessionReplayView sensitive={true}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Account number</Text>
          <Text style={styles.cardValue}>1234 5678 9012 3456</Text>
        </View>
      </MPSessionReplayView>

      <Text style={styles.sectionTitle}>Wireframe Text</Text>
      <MPSessionReplayView wireframeText="Monthly spend chart">
        <View style={styles.chart}>
          {[40, 70, 55, 90, 65].map((height, index) => (
            <View key={index} style={[styles.bar, { height }]} />
          ))}
        </View>
      </MPSessionReplayView>

      <View style={styles.toggleRow}>
        <Text style={styles.label}>Switch</Text>
        <Switch value={switchValue} onValueChange={setSwitchValue} />
      </View>
    </ScrollView>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    ...shadow,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  userText: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
    ...shadow,
  },
  flushButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 14,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
    ...shadow,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: '#333',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    ...shadow,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    ...shadow,
  },
  bar: {
    width: 24,
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});
