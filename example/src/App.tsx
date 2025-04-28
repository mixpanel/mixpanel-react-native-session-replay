// import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import {
  initialize,
  startRecording,
  stopRecording,
  MPSessionReplayConfig,
  MPAutoMaskedViews,
} from 'mp-session-replay';

export default function App() {
  const handleInitialize = () => {
    const config = new MPSessionReplayConfig({
      wifiOnly: true,
      recordSessionsPercent: 100,
      autoMaskedViews: [MPAutoMaskedViews.Image, MPAutoMaskedViews.Text],
    });
    initialize('test', 'test', config);
  };

  return (
    <View style={styles.container}>
      <Text>Mixpanel Session Replay</Text>
      <Button title="Initialize SDK" onPress={handleInitialize} />
      <Button title="Start Recording" onPress={startRecording} />
      <Button title="Stop Recording" onPress={stopRecording} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
