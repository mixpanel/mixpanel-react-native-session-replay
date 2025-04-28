import React from 'react';
import { View, Text, StyleSheet, Dimensions, Button } from 'react-native';
import { WebView } from 'react-native-webview';

export default function ScreenThree({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You are on Screen Three</Text>
      <WebView
        source={{ uri: 'https://www.google.com' }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  webview: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
});