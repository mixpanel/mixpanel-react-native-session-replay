import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { MPSessionReplayView } from '@mixpanel/react-native-session-replay';

/**
 * Fixtures for the iOS wireframe coordinate goldens, selected by name.
 *
 * Mounted by `WireframeGoldenTests` into its own fixed-size window, never shown to a user. It
 * lives in the example app because a React Native surface can only be created by a running app —
 * see `example/ios/WireframeGoldenTests/README.md`.
 *
 * **The case list mirrors `android-goldens/` exactly**, name for name, so the two RN suites can
 * be diffed against each other and against the Android SDK, Flutter and iOS SDK suites. A case
 * that needs no special layout reuses one of the shared scenes below.
 *
 * **Every row is absolutely positioned.** A golden's coordinates have to be dictated by this
 * file rather than by intrinsic text measurement, which varies with the system font across OS
 * versions, so the same golden holds on any simulator. Do not reformat casually: changing a
 * coordinate invalidates a golden.
 */
export default function WireframeGoldenFixture(props: { scene?: string }) {
  const scene = props.scene ?? 'text';
  const Scene = SCENES[scene];
  if (!Scene) {
    // Loud rather than silent: an unknown scene would otherwise record an empty golden that
    // looks like a passing test.
    return (
      <View style={styles.root}>
        <Text style={[styles.abs, styles.row0]}>UNKNOWN SCENE {scene}</Text>
      </View>
    );
  }
  return <View style={styles.root}>{Scene()}</View>;
}

/** A single `<Text>`. Also the truncation and glyph cases, via `text` variants. */
const TextScene = () => (
  <Text style={[styles.abs, styles.row0]}>Order total</Text>
);

const TruncatedScene = () => (
  <Text style={[styles.abs, styles.tall]}>
    This paragraph is comfortably longer than the fifty character cap
  </Text>
);

/** Private-use-area glyphs only: an icon font, not human-readable text. */
const GlyphOnlyScene = () => (
  <Text style={[styles.abs, styles.square]}>{''}</Text>
);

/** Visible text *and* a label, so the fallback-off case can show which one wins. */
const TextLabelledScene = () => (
  <Text style={[styles.abs, styles.row0]} accessibilityLabel="ignored label">
    Order total
  </Text>
);

/** Declared glyphs on a glyph-only view: declared text is taken verbatim, never normalized. */
const DeclaredGlyphScene = () => (
  <MPSessionReplayView
    style={[styles.abs, styles.square]}
    wireframeText={'\ue900\ue901'}
  >
    <Text style={styles.fill}>{'\ue900\ue901'}</Text>
  </MPSessionReplayView>
);

const GlyphMixedScene = () => (
  <Text style={[styles.abs, styles.row0]}>{' Cart'}</Text>
);

const ImageScene = () => (
  <Image
    style={[styles.abs, styles.square]}
    source={{ uri: TRANSPARENT_PNG }}
  />
);

/**
 * A labelled image. On iOS the label lands on `RCTImageComponentView` while the element comes
 * from the inner `RCTUIImageViewAnimated`, so it is never named — the gap the goldens pin.
 */
const ImageLabelledScene = () => (
  <Image
    style={[styles.abs, styles.square]}
    accessibilityLabel="profile photo"
    source={{ uri: TRANSPARENT_PNG }}
  />
);

const ImageMaskedLabelledScene = () => (
  <MPSessionReplayView style={[styles.abs, styles.square]} sensitive={true}>
    <Image
      style={styles.fill}
      accessibilityLabel="profile photo"
      source={{ uri: TRANSPARENT_PNG }}
    />
  </MPSessionReplayView>
);

const InputScene = () => (
  <TextInput
    style={[styles.abs, styles.row1]}
    defaultValue="4111 1111 1111 1111"
  />
);

/** An input inside an unmask: still masked. Nothing overrides a text-entry decision. */
const InputInUnmaskScene = () => (
  <MPSessionReplayView style={[styles.abs, styles.box]} sensitive={false}>
    <TextInput style={styles.fill} defaultValue="4111 1111 1111 1111" />
  </MPSessionReplayView>
);

const MaskedTextScene = () => (
  <MPSessionReplayView style={[styles.abs, styles.row0]} sensitive={true}>
    <Text style={styles.fill}>4111 1111 1111 1111</Text>
  </MPSessionReplayView>
);

/** An unmask over otherwise auto-masked text. */
const UnmaskedTextScene = () => (
  <MPSessionReplayView style={[styles.abs, styles.row0]} sensitive={false}>
    <Text style={styles.fill}>Public notice</Text>
  </MPSessionReplayView>
);

/** `<Pressable>` shape: a container with a `<Text>` inside. No `button` role, deliberately. */
const TouchableScene = () => (
  <View style={[styles.abs, styles.box]}>
    <Text style={[styles.abs, styles.inner]}>Log in</Text>
  </View>
);

/** Icon-only touchable, labelled on the container — which emits no element to name. */
const TouchableLabelledScene = () => (
  <View style={[styles.abs, styles.square]} accessibilityLabel="Add to cart">
    <Image
      style={[styles.abs, styles.innerSquare]}
      source={{ uri: TRANSPARENT_PNG }}
    />
  </View>
);

const TouchableMaskedScene = () => (
  <MPSessionReplayView
    style={[styles.abs, styles.box]}
    sensitive={true}
    // accessibilityLabel on the wrapper, so masking has something to drop.
    accessibilityLabel="Add to cart"
  >
    <Text style={[styles.abs, styles.inner]}>Add</Text>
  </MPSessionReplayView>
);

// ---- Accessibility roles ----------------------------------------------------------------
//
// `accessibilityRole` is developer-declared intent, and the only signal available for a control
// that is a plain view — which is what `Pressable`/`TouchableOpacity` produce. iOS collapses
// most values to `UIAccessibilityTraitNone`, so the checkbox/switch scenes below deliberately
// record *no* role here while Android reports one. The case exists on both platforms so the
// difference is visible in the goldens rather than hidden by omission.

/**
 * `accessible={true}` is required, not decoration.
 *
 * Fabric only applies `accessibilityRole` to `UIAccessibilityTraits` for a view that is itself
 * an accessibility element — a bare `<View accessibilityRole="button">` gets *no* trait, and iOS
 * then reports no role. `Pressable` and `TouchableOpacity` both default `accessible` to true
 * (`accessible !== false`), so a real touchable does get it; only a hand-written `<View>` like
 * this one has to say so. Android reads its own view tag and is unaffected either way.
 */
const RoleScene = (role: string) => () => (
  <View
    style={[styles.abs, styles.box]}
    accessible={true}
    accessibilityRole={role as never}
  >
    <Text style={[styles.abs, styles.inner]}>Log in</Text>
  </View>
);

const RoleLinkScene = () => (
  <View
    style={[styles.abs, styles.box]}
    accessible={true}
    accessibilityRole="link"
  >
    <Text style={[styles.abs, styles.inner]}>Terms of service</Text>
  </View>
);

const RoleHeaderScene = () => (
  <View
    style={[styles.abs, styles.box]}
    accessible={true}
    accessibilityRole="header"
  >
    <Text style={[styles.abs, styles.inner]}>Your orders</Text>
  </View>
);

/** A roled control wrapping masked content: reported, but never laundering the masked text. */
const RoleMaskedDescendantScene = () => (
  <View
    style={[styles.abs, styles.box]}
    accessible={true}
    accessibilityRole="button"
  >
    <Text style={[styles.abs, styles.inner]}>Pay</Text>
    <MPSessionReplayView
      style={[styles.abs, styles.innerSecond]}
      sensitive={true}
    >
      <Text style={styles.fill}>4111 1111 1111 1111</Text>
    </MPSessionReplayView>
  </View>
);

/** A nested control keeps its own element rather than being swallowed by the outer one. */
const RoleNestedControlScene = () => (
  <View
    style={[styles.abs, styles.box]}
    accessible={true}
    accessibilityRole="button"
  >
    <Text style={[styles.abs, styles.inner]}>Cupcake</Text>
    <View
      style={[styles.abs, styles.innerSquare]}
      accessible={true}
      accessibilityRole="button"
    >
      <Text style={styles.fill}>Add</Text>
    </View>
  </View>
);

const DeclaredPlainScene = () => (
  <MPSessionReplayView
    style={[styles.abs, styles.tall]}
    wireframeText="Monthly spend chart"
  />
);

const DeclaredInputScene = () => (
  <MPSessionReplayView
    style={[styles.abs, styles.row1]}
    wireframeText="Card number"
  >
    <TextInput style={styles.fill} defaultValue="4111 1111 1111 1111" />
  </MPSessionReplayView>
);

const DeclaredMaskImageScene = () => (
  <MPSessionReplayView
    style={[styles.abs, styles.square]}
    sensitive={true}
    wireframeText="profile photo"
  >
    <Image style={styles.fill} source={{ uri: TRANSPARENT_PNG }} />
  </MPSessionReplayView>
);

/** A declared *container* keeps its real content — it has no role of its own. */
const DeclaredContainerScene = () => (
  <MPSessionReplayView
    style={[styles.abs, styles.box]}
    wireframeText="Checkout summary"
  >
    <TextInput style={[styles.abs, styles.inner]} defaultValue="4111" />
  </MPSessionReplayView>
);

/** Declared text is exempt from the geometric strip; the sibling text is not. */
const DeclaredSurvivesGeometricScene = () => (
  <MPSessionReplayView style={[styles.abs, styles.box]} sensitive={true}>
    <MPSessionReplayView
      style={[styles.abs, styles.inner]}
      wireframeText="Account"
    >
      <Text style={styles.fill}>Account 4021-8853</Text>
    </MPSessionReplayView>
  </MPSessionReplayView>
);

const DeclaredBeatsVisibleScene = () => (
  <MPSessionReplayView
    style={[styles.abs, styles.row0]}
    wireframeText="declared"
  >
    <Text style={styles.fill}>scraped</Text>
  </MPSessionReplayView>
);

/** A masked sibling painted over unmasked text. */
const GeometricOverlapScene = () => (
  <View style={styles.fill}>
    <Text style={[styles.abs, styles.row0]}>Account 4021-8853</Text>
    <MPSessionReplayView style={[styles.abs, styles.row0]} sensitive={true} />
  </View>
);

const GeometricTextAndImageScene = () => (
  <View style={styles.fill}>
    <Image
      style={[styles.abs, styles.square]}
      source={{ uri: TRANSPARENT_PNG }}
    />
    <Text style={[styles.abs, styles.besideSquare]}>Ada Lovelace</Text>
    <MPSessionReplayView
      style={[styles.abs, styles.coverTop]}
      sensitive={true}
    />
  </View>
);

/** A mask nested inside an unmask still masks. */
const NestedMaskInUnmaskScene = () => (
  <MPSessionReplayView style={[styles.abs, styles.box]} sensitive={false}>
    <MPSessionReplayView style={[styles.abs, styles.inner]} sensitive={true}>
      <Text style={styles.fill}>Account 4021-8853</Text>
    </MPSessionReplayView>
  </MPSessionReplayView>
);

/** An unmask nested inside a mask: the parent's rect still strips it. */
const NestedUnmaskInMaskScene = () => (
  <MPSessionReplayView style={[styles.abs, styles.box]} sensitive={true}>
    <MPSessionReplayView style={[styles.abs, styles.inner]} sensitive={false}>
      <Text style={styles.fill}>Order total</Text>
    </MPSessionReplayView>
  </MPSessionReplayView>
);

const NestedUnmaskUnderLayoutScene = () => (
  <MPSessionReplayView style={[styles.abs, styles.box]} sensitive={true}>
    <View style={[styles.abs, styles.inner]}>
      <MPSessionReplayView style={styles.fill} sensitive={false}>
        <Text style={styles.fill}>Order total</Text>
      </MPSessionReplayView>
    </View>
  </MPSessionReplayView>
);

/** Two rows so a strip/redact rule can be seen to affect one and not the other. */
const TwoTextRowsScene = () => (
  <View style={styles.fill}>
    <Text style={[styles.abs, styles.row0]}>Account 4021-8853</Text>
    <Text style={[styles.abs, styles.row1]}>Order total</Text>
  </View>
);

const EmailScene = () => (
  <Text style={[styles.abs, styles.row0]}>Receipt sent to ada@example.com</Text>
);

const NameScene = () => (
  <Text style={[styles.abs, styles.row0]}>Receipt sent to Ada</Text>
);

const EmptyScene = () => null;

const HiddenScene = () => (
  <View style={[styles.abs, styles.row0, styles.hidden]}>
    <Text style={styles.fill}>Hidden</Text>
  </View>
);

const TransparentScene = () => (
  <View style={[styles.abs, styles.row0, styles.transparent]}>
    <Text style={styles.fill}>Invisible</Text>
  </View>
);

/** The control that makes the two emptiness cases above mean something. */
const VisibleControlScene = () => (
  <View style={[styles.abs, styles.row0]}>
    <Text style={styles.fill}>Visible</Text>
  </View>
);

const OverlappingScene = () => (
  <View style={styles.fill}>
    <Text style={[styles.abs, styles.row0]}>Behind</Text>
    <Text style={[styles.abs, styles.rowOffset]}>In front</Text>
  </View>
);

/** A masked container describes its structure: children ship as textless shells. */
const MaskedContainerScene = () => (
  <MPSessionReplayView style={[styles.abs, styles.box]} sensitive={true}>
    <Text style={[styles.abs, styles.inner]}>Name</Text>
    <Text style={[styles.abs, styles.innerSecond]}>Ada Lovelace</Text>
    <Image
      style={[styles.abs, styles.innerSquare]}
      source={{ uri: TRANSPARENT_PNG }}
    />
  </MPSessionReplayView>
);

/** A row below the window is not emitted — what a long `FlatList` produces below the fold. */
const OffscreenScene = () => (
  <View style={styles.fill}>
    <Text style={[styles.abs, styles.row0]}>Row in view</Text>
    <Text style={[styles.abs, styles.belowFold]}>Row below the fold</Text>
  </View>
);

/** Everything at once: the integration case each platform's suite ends with. */
const ComplexScene = () => (
  <View style={styles.fill}>
    <Text style={[styles.abs, styles.row0]}>Checkout</Text>
    <Image
      style={[styles.abs, styles.squareRow]}
      accessibilityLabel="profile photo"
      source={{ uri: TRANSPARENT_PNG }}
    />
    <MPSessionReplayView
      style={[styles.abs, styles.row2]}
      wireframeText="Card number"
    >
      <TextInput style={styles.fill} defaultValue="4111 1111 1111 1111" />
    </MPSessionReplayView>
    <MPSessionReplayView style={[styles.abs, styles.row3]} sensitive={true}>
      <Text style={styles.fill}>Account 4021-8853</Text>
    </MPSessionReplayView>
    <Text style={[styles.abs, styles.row4]}>
      Receipt sent to ada@example.com
    </Text>
    <View style={[styles.abs, styles.row5]}>
      <Text style={styles.fill}>Place order</Text>
    </View>
  </View>
);

const SCENES: Record<string, () => React.ReactNode> = {
  text: TextScene,
  truncated: TruncatedScene,
  glyphOnly: GlyphOnlyScene,
  glyphMixed: GlyphMixedScene,
  textLabelled: TextLabelledScene,
  declaredGlyph: DeclaredGlyphScene,
  roleButton: RoleScene('button'),
  roleCheckbox: RoleScene('checkbox'),
  roleSwitch: RoleScene('switch'),
  roleUnmapped: RoleScene('treegrid'),
  roleLink: RoleLinkScene,
  roleHeader: RoleHeaderScene,
  roleMaskedDescendant: RoleMaskedDescendantScene,
  roleNestedControl: RoleNestedControlScene,
  image: ImageScene,
  imageLabelled: ImageLabelledScene,
  imageMaskedLabelled: ImageMaskedLabelledScene,
  input: InputScene,
  inputInUnmask: InputInUnmaskScene,
  maskedText: MaskedTextScene,
  unmaskedText: UnmaskedTextScene,
  touchable: TouchableScene,
  touchableLabelled: TouchableLabelledScene,
  touchableMasked: TouchableMaskedScene,
  declaredPlain: DeclaredPlainScene,
  declaredInput: DeclaredInputScene,
  declaredMaskImage: DeclaredMaskImageScene,
  declaredContainer: DeclaredContainerScene,
  declaredSurvivesGeometric: DeclaredSurvivesGeometricScene,
  declaredBeatsVisible: DeclaredBeatsVisibleScene,
  geometricOverlap: GeometricOverlapScene,
  geometricTextAndImage: GeometricTextAndImageScene,
  nestedMaskInUnmask: NestedMaskInUnmaskScene,
  nestedUnmaskInMask: NestedUnmaskInMaskScene,
  nestedUnmaskUnderLayout: NestedUnmaskUnderLayoutScene,
  twoTextRows: TwoTextRowsScene,
  email: EmailScene,
  name: NameScene,
  empty: EmptyScene,
  hidden: HiddenScene,
  transparent: TransparentScene,
  visibleControl: VisibleControlScene,
  overlapping: OverlappingScene,
  maskedContainer: MaskedContainerScene,
  offscreen: OffscreenScene,
  complex: ComplexScene,
};

/** 1x1 fully transparent PNG, generated (an earlier hand-copied literal had a bad IDAT CRC). */
const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'white' },
  fill: { width: '100%', height: '100%' },
  abs: { position: 'absolute' },
  hidden: { display: 'none' },
  transparent: { opacity: 0 },

  // Shared grid. Cases reuse these so coordinates repeat across goldens and stay readable.
  row0: { left: 16, top: 16, width: 240, height: 24, fontSize: 15 },
  row1: { left: 16, top: 56, width: 240, height: 36, fontSize: 15 },
  row2: { left: 16, top: 112, width: 280, height: 36 },
  row3: { left: 16, top: 164, width: 280, height: 28 },
  row4: { left: 16, top: 208, width: 280, height: 22, fontSize: 14 },
  row5: { left: 16, top: 244, width: 176, height: 40 },
  rowOffset: { left: 32, top: 32, width: 240, height: 24, fontSize: 15 },
  tall: { left: 16, top: 16, width: 280, height: 60, fontSize: 15 },
  square: { left: 16, top: 16, width: 40, height: 40 },
  squareRow: { left: 16, top: 56, width: 40, height: 40 },
  besideSquare: { left: 64, top: 16, width: 200, height: 24, fontSize: 15 },
  coverTop: { left: 0, top: 0, width: 300, height: 56 },
  box: { left: 0, top: 0, width: 280, height: 60 },
  inner: { left: 8, top: 8, width: 240, height: 20, fontSize: 14 },
  innerSecond: { left: 8, top: 32, width: 200, height: 20, fontSize: 14 },
  innerSquare: { left: 220, top: 8, width: 24, height: 24 },
  belowFold: { left: 16, top: 900, width: 240, height: 40, fontSize: 15 },
});
