import React from 'react';
import { View, Text, Button } from 'react-native';

export default function ScreenOne({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Welcome to Screen One</Text>
    </View>
  );
}