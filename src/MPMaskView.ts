import { requireNativeComponent, type ViewProps } from 'react-native';

interface MixpanelMaskViewProps extends ViewProps {
  mask: 'safe' | 'sensitive';
}

export const MixpanelMaskView =
  requireNativeComponent<MixpanelMaskViewProps>('RCTMPSensitiveView');
