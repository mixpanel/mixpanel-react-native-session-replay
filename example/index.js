import { AppRegistry } from 'react-native';
import App from './src/App';
import WireframeGoldenFixture from './src/WireframeGoldenFixture';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

// Registered but never shown to a user: `WireframeGoldenTests` mounts this surface into its
// own fixed-size window to capture coordinate goldens. A React Native surface can only be
// created by a running app, which is why the golden fixture lives here rather than in a
// standalone test bundle.
AppRegistry.registerComponent('WireframeGolden', () => WireframeGoldenFixture);
