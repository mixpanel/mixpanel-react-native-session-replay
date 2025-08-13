import React, { useLayoutEffect, useRef } from 'react';
import { requireNativeComponent, type ViewProps, findNodeHandle } from 'react-native';
import MixpanelReactNativeSessionReplay from './NativeMixpanelReactNativeSessionReplay';

export interface MixpanelSessionReplayViewProps extends ViewProps {
  sensitive?: boolean;
  children?: React.ReactNode;
}

interface NativeMixpanelSessionReplayViewProps extends ViewProps {
  sensitive?: boolean;
}

const NativeMixpanelSessionReplayView =
  requireNativeComponent<NativeMixpanelSessionReplayViewProps>(
    'MixpanelSessionReplayView'
  );

export const MixpanelSessionReplayView: React.FC<
  MixpanelSessionReplayViewProps
> = ({ sensitive = false, children, style, ...otherProps }) => {
  const viewRef = useRef<any>(null);

  useLayoutEffect(() => {
    if (!sensitive && viewRef.current) {
      // Use findNodeHandle to get native reference
      const viewTag = findNodeHandle(viewRef.current);
      if (viewTag) {
        // Custom method that only affects this specific view's children
        MixpanelReactNativeSessionReplay.markViewChildrenAsSafe(viewTag).catch((error) => {
          console.warn('Failed to mark view children as safe:', error);
        });
      }
    }
  }, [sensitive]);

  return (
    <NativeMixpanelSessionReplayView
      ref={viewRef}
      sensitive={sensitive}
      style={style}
      {...otherProps}
    >
      {children}
    </NativeMixpanelSessionReplayView>
  );
};
