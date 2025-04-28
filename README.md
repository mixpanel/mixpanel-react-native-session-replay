# mp-session-replay

Mixpanel session replay

## Installation

```sh
npm install https://github.com/mixpanel/mixpanel-react-native-session-replay.git
```

## Usage


```js
//Import SDK functions
import {
  initialize,
  startRecording,
  stopRecording,
  MPSessionReplayConfig,
  MPAutoMaskedViewsConfig,
  captureScreenshot
} from 'mp-session-replay';


//Helper funtion to initialise SDK
  const handleInitialize = () => {
    const config = new MPSessionReplayConfig({
      wifiOnly: true,
      recordSessionsPercent: 100,
      autoMaskedViews: [MPAutoMaskedViewsConfig.Image, MPAutoMaskedViewsConfig.Text],
    });
    initialize('5d9d3df08d1c34a272abf23d892820bf', 'react-native-ketan', config);
  }

//Usage
    <Button title="Initialize SDK" onPress={handleInitialize} />
    <Button title="Start Recording" onPress={startRecording} />
    <Button title="Stop Recording" onPress={stopRecording} />
    <Button title="Capture screenshot" onPress={captureScreenshot} />

```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
