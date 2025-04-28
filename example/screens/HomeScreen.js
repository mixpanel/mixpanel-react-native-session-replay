import React from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';

import {
  initialize,
  startRecording,
  stopRecording,
  MPSessionReplayConfig,
  MPAutoMaskedViewsConfig,
  captureScreenshot
} from 'mp-session-replay';


export default function HomeScreen({ navigation }) {
  const handleInitialize = () => {
    const config = new MPSessionReplayConfig({
      wifiOnly: true,
      recordSessionsPercent: 100,
      autoMaskedViews: [MPAutoMaskedViewsConfig.Image, MPAutoMaskedViewsConfig.Text],
    });
    initialize('5d9d3df08d1c34a272abf23d892820bf', 'react-native-ketan', config);
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.spacer} />
      <Text>Mixpanel Session Replay</Text>
      <Button title="Initialize SDK" onPress={handleInitialize} />
      <Button title="Start Recording" onPress={startRecording} />
      <Button title="Stop Recording" onPress={stopRecording} />
      <Button title="Capture screenshot" onPress={captureScreenshot} />

      <View style={styles.spacer} />

      <Button title="Go to Screen One" onPress={() => navigation.navigate('ScreenOne')} />
      <View style={styles.spacer} />

      <Button title="Go to Screen Two" onPress={() => navigation.navigate('ScreenTwo')} />
      <View style={styles.spacer} />

      <Button title="Go to Screen Three" onPress={() => navigation.navigate('ScreenThree')} />
      <View style={styles.spacer} />

      <Button title="Go to Screen Four" onPress={() => navigation.navigate('ScreenFour')} />
      <View style={styles.spacer} />

      <Button title="Go to Screen Five" onPress={() => navigation.navigate('ScreenFive')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  spacer: {
    height: 16,
  },
});