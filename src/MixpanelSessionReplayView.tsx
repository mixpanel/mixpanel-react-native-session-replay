import { requireNativeComponent, type ViewProps } from 'react-native';

interface MixpanelSessionReplayViewProps extends ViewProps {
  /**
   * Masks everything inside this view in the replay video, and drops the text of every
   * wireframe element under it.
   *
   * Controls pixels. Orthogonal to {@link wireframeText}, which controls what the
   * wireframe *says*; the two compose.
   */
  sensitive?: boolean;

  /**
   * Declares the text recorded for this view in the wireframe.
   *
   * **Beta.** Wireframes are in beta; see `MPWireframesOptions` for what to check before
   * shipping to production.
   *
   * Use it to describe content the SDK can't read — custom-drawn views, charts, canvases —
   * or to attach an analytical label. Declared text wins over the view's own visible text
   * and over its accessibility label.
   *
   * **It is sent even when the view is masked.** Masking hides the pixels while the
   * declared text still describes the view for the summary. Because you authored it rather
   * than the SDK scraping it off the screen, making sure the text is not itself sensitive
   * is up to you — if it could be, leave it off.
   *
   * ```tsx
   * <MPSessionReplayView sensitive wireframeText="Card number">
   *   <CardNumberField />
   * </MPSessionReplayView>
   * ```
   *
   * Requires `wireframesOptions` on the config; without it no wireframes are captured and
   * this prop does nothing. Blank strings are ignored.
   */
  wireframeText?: string;
}

export const MPSessionReplayView =
  requireNativeComponent<MixpanelSessionReplayViewProps>(
    'MixpanelSessionReplayView'
  );
