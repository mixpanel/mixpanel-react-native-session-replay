import { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  initialize,
  startRecording,
  stopRecording,
  isRecording,
  MPSessionReplayMask,
  MPSessionReplayConfig,
} from 'mixpanel-react-native-session-replay';
import type { RootStackParamList } from '../types/navigation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [recording, setRecording] = useState(false);
  const [token, setToken] = useState('5d9d3df08d1c34a272abf23d892820bf');
  const [distinctId, setDistinctId] = useState(
    () => `user-${Math.floor(Math.random() * 1e9)}`
  );

  const checkRecordingStatus = async () => {
    try {
      const status = await isRecording();
      setRecording(status);
    } catch (error) {
      console.error('Error checking recording status:', error);
    }
  };

  const handleInitialize = async () => {
    try {
      const config: MPSessionReplayConfig = new MPSessionReplayConfig({
        // autoMaskedViews: [MPSessionReplayMask.Text],
        enableLogging: true,
      });
      console.log('config', config);
      await initialize(token, distinctId, config);
      setIsInitialized(true);
      Alert.alert(
        'Success',
        'Mixpanel Session Replay initialized successfully!'
      );
      await checkRecordingStatus();
    } catch (error) {
      Alert.alert('Error', `Failed to initialize: ${error}`);
      console.error('Initialization error:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      Alert.alert('Success', 'Recording started!');
      await checkRecordingStatus();
    } catch (error) {
      Alert.alert('Error', `Failed to start recording: ${error}`);
      console.error('Start recording error:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
      Alert.alert('Success', 'Recording stopped!');
      await checkRecordingStatus();
    } catch (error) {
      Alert.alert('Error', `Failed to stop recording: ${error}`);
      console.error('Stop recording error:', error);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      const interval = setInterval(checkRecordingStatus, 2000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isInitialized]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mixpanel Session Replay Demo</Text>

      {!isInitialized ? (
        <View style={styles.configSection}>
          <Text style={styles.label}>Mixpanel Token:</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Enter your Mixpanel token"
          />

          <Text style={styles.label}>Distinct ID:</Text>
          <TextInput
            style={styles.input}
            value={distinctId}
            onChangeText={setDistinctId}
            placeholder="Enter user distinct ID"
          />

          <TouchableOpacity style={styles.button} onPress={handleInitialize}>
            <Text style={styles.buttonText}>Initialize Session Replay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controlSection}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Status: {recording ? '🔴 Recording' : '⭕ Not Recording'}
            </Text>
            <Text style={styles.userText}>User: {distinctId}</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, recording && styles.disabledButton]}
            onPress={handleStartRecording}
            disabled={recording}
          >
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !recording && styles.disabledButton]}
            onPress={handleStopRecording}
            disabled={!recording}
          >
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => navigation.navigate('Test')}
          >
            <Text style={styles.testButtonText}>Go to Test Screen</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  configSection: {
    marginBottom: 20,
  },
  controlSection: {
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    paddingHorizontal: 28,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
