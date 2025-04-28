import React from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import { MixpanelMaskView } from 'mp-session-replay';

export default function ScreenFive({ navigation }) {
  return (
    <View style={styles.container} >
      <Text style={styles.title}>You've reached Screen Five</Text>
      <MixpanelMaskView mask='safe'>
        <Image
          source={{ uri: 'https://mixpanel.com/wp-content/uploads/2020/09/pa-img013.png' }}
          style={styles.image}
          resizeMode="contain"
        />
      </MixpanelMaskView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  image: {
    width: 300,
    height: 200,
    marginBottom: 20,
  },
});