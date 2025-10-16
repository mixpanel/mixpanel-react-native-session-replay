import { requireNativeComponent, type ViewProps } from 'react-native';

interface MixpanelSessionReplayViewProps extends ViewProps {
  sensitive?: boolean;
}

export const MPSessionReplayView =
  requireNativeComponent<MixpanelSessionReplayViewProps>(
    'MixpanelSessionReplayView'
  );
