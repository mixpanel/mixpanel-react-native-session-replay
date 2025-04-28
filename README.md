# mp-session-replay

Mixpanel session replay

## Installation

```sh
npm install https://github.com/ketanmixpanel/mpsession-replay-react-native.git
```

## Usage


```js
//Import SDK functions
import {
  initialize,
  startRecording,
  stopRecording,
  MPSessionReplayConfig,
} from 'mp-session-replay';


//Helper funtion to initialise SDK
const handleInitialize = () => {
    const config = new MPSessionReplayConfig({
      wifiOnly: true,
      recordSessionsPercent: 100,
      autoMaskedViews: [MPAutoMaskedViews.Image, MPAutoMaskedViews.Text],
    });
    initialize('test', 'test', config);
  };



//Usage
<Button title="Initialize SDK" onPress={handleInitialize} />
<Button title="Start Recording" onPress={startRecording} />
<Button title="Stop Recording" onPress={stopRecording} />

```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
