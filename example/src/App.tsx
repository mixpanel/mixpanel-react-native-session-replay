import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';

import HomeScreen from './screens/HomeScreen';
import TestScreen from './screens/TestScreen';
import type { RootStackParamList } from './types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Session Replay Demo',
          }}
        />
        <Stack.Screen
          name="Test"
          component={TestScreen}
          options={{
            title: 'Masking Test',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
