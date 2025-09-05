import { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { MixpanelSessionReplayView } from 'mixpanel-react-native-session-replay';

type TestScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Test'>;

export default function TestScreen() {
  const navigation = useNavigation<TestScreenNavigationProp>();
  const [textValue, setTextValue] = useState('Sample text input');
  const [emailValue, setEmailValue] = useState('user@example.com');
  const [passwordValue, setPasswordValue] = useState('password123');
  const [phoneValue, setPhoneValue] = useState('+1234567890');
  const [switchValue, setSwitchValue] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Masking Test Screen</Text>
      </View>

      {/* Text Elements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Elements</Text>
        <Text style={styles.heading}>Main Heading Text</Text>
        <Text style={styles.subheading}>Subheading Text Example</Text>
        <Text style={styles.paragraph}>
          This is a sample paragraph text that demonstrates various text content
          that might need to be masked during session replay recording. It
          contains sensitive information like user data, addresses, and personal
          details.
        </Text>
        <Text style={styles.label}>Label Text Example</Text>
        <Text style={styles.caption}>Caption text in smaller font</Text>
      </View>

      {/* Input Elements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Input Controls</Text>

        <Text style={styles.inputLabel}>Regular Text Input:</Text>
        <TextInput
          style={styles.textInput}
          value={textValue}
          onChangeText={setTextValue}
          placeholder="Enter some text here"
        />

        <Text style={styles.inputLabel}>Email Input:</Text>
        <TextInput
          style={styles.textInput}
          value={emailValue}
          onChangeText={setEmailValue}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>🔒 Masked Password Input:</Text>
        <MixpanelSessionReplayView sensitive={true}>
          <TextInput
            style={styles.textInput}
            value={passwordValue}
            onChangeText={setPasswordValue}
            placeholder="Enter password"
            secureTextEntry
          />
        </MixpanelSessionReplayView>

        <Text style={styles.inputLabel}>Phone Number:</Text>
        <TextInput
          style={styles.textInput}
          value={phoneValue}
          onChangeText={setPhoneValue}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
        />

        <Text style={styles.inputLabel}>Multiline Text:</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Enter multiple lines of text here..."
          multiline
          numberOfLines={3}
        />

        <Text style={styles.inputLabel}>Search Input (should be masked):</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Search for sensitive data..."
          clearButtonMode="while-editing"
        />

        <Text style={styles.inputLabel}>Numeric Input:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter amount: $0.00"
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Auto-Complete Input:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type to autocomplete addresses..."
          autoComplete="street-address"
        />
      </View>

      {/* Interactive Controls Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interactive Controls</Text>

        <View style={styles.switchContainer}>
          <Text style={styles.inputLabel}>Toggle Switch:</Text>
          <Switch
            value={switchValue}
            onValueChange={setSwitchValue}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={switchValue ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <Text style={styles.inputLabel}>Custom Range Control:</Text>
        <View style={styles.rangeContainer}>
          <TouchableOpacity style={styles.rangeButton}>
            <Text style={styles.rangeButtonText}>Min</Text>
          </TouchableOpacity>
          <View style={styles.rangeTrack}>
            <View style={styles.rangeProgress} />
          </View>
          <TouchableOpacity style={styles.rangeButton}>
            <Text style={styles.rangeButtonText}>Max</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rangeValue}>Value: 50</Text>
      </View>

      {/* Button Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buttons</Text>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Primary Button</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Secondary Button</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineButton}>
          <Text style={styles.outlineButtonText}>Outline Button</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>Danger Button</Text>
        </TouchableOpacity>
      </View>

      {/* Images Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Images & Media</Text>

        <Text style={styles.inputLabel}>
          Regular Images (React Native Image):
        </Text>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: 'https://picsum.photos/200/150?random=1',
            }}
            style={styles.networkImage}
            resizeMode="cover"
          />
          <Image
            source={{
              uri: 'https://picsum.photos/200/150?random=2',
            }}
            style={styles.networkImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.inputLabel}>🔒 Masked Profile Section:</Text>
        <MixpanelSessionReplayView sensitive={true}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: 'https://picsum.photos/80/80?random=profile',
              }}
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@company.com</Text>
          </View>
        </MixpanelSessionReplayView>

        <Text style={styles.inputLabel}>Background Image with Text:</Text>
        <ImageBackground
          source={{
            uri: 'https://picsum.photos/350/100?random=banner',
          }}
          style={styles.bannerImage}
        >
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerText}>Image with Text Overlay</Text>
            <Text style={styles.bannerSubtext}>Testing text over images</Text>
          </View>
        </ImageBackground>
      </View>

      {/* WebView Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WebView Components</Text>
        <Text style={styles.description}>
          WebView components are automatically masked when Web category is
          enabled. These would show embedded web content in a real app.
        </Text>

        <Text style={styles.inputLabel}>Simulated WebView (placeholder):</Text>
        <View style={styles.webViewPlaceholder}>
          <Text style={styles.webViewText}>🌐 WebView Content</Text>
          <Text style={styles.webViewSubtext}>
            This represents where a WebView component would render web content.
            In a real implementation, this would use react-native-webview.
          </Text>
          <View style={styles.webViewButtons}>
            <TouchableOpacity style={styles.webViewButton}>
              <Text style={styles.webViewButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webViewButton}>
              <Text style={styles.webViewButtonText}>Forward →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.inputLabel}>🔒 Masked WebView Content:</Text>
        <MixpanelSessionReplayView sensitive={true}>
          <View style={styles.webViewPlaceholder}>
            <Text style={styles.webViewText}>🔒 Sensitive Web Content</Text>
            <Text style={styles.webViewSubtext}>
              This WebView would contain sensitive information like banking
              login pages, payment forms, or personal data entry.
            </Text>
          </View>
        </MixpanelSessionReplayView>
      </View>

      {/* Sensitive Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sensitive Information</Text>
        <Text style={styles.description}>
          The data cards below demonstrate masking functionality. The first card
          is wrapped with MixpanelSessionReplayView sensitive=true and will be
          masked in session replays.
        </Text>

        <MixpanelSessionReplayView sensitive={true}>
          <View style={styles.dataCard}>
            <Text style={styles.cardTitle}>🔒 Masked User Profile</Text>
            <Text style={styles.dataLabel}>Full Name: John Smith</Text>
            <Text style={styles.dataLabel}>SSN: 123-45-6789</Text>
            <Text style={styles.dataLabel}>
              Credit Card: 4532 1234 5678 9012
            </Text>
            <Text style={styles.dataLabel}>
              Address: 123 Main St, Anytown, USA 12345
            </Text>
          </View>
        </MixpanelSessionReplayView>

        <MixpanelSessionReplayView sensitive={false}>
          <View style={styles.dataCard}>
            <Text style={styles.cardTitle}>
              👁️ Visible Financial Information
            </Text>
            <Text style={styles.dataLabel}>Account Balance: $12,345.67</Text>
            <Text style={styles.dataLabel}>Account Number: 98765432101</Text>
            <Text style={styles.dataLabel}>Routing Number: 021000021</Text>
          </View>
        </MixpanelSessionReplayView>
      </View>

      {/* Hierarchical Override Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hierarchical Masking Override</Text>
        <Text style={styles.description}>
          This section demonstrates the new hierarchical override feature. The
          parent wrapper is marked as sensitive=false, which overrides ALL
          children to be safe, even if they would normally be sensitive.
        </Text>

        <MixpanelSessionReplayView sensitive={false}>
          <View style={styles.dataCard}>
            <Text style={styles.cardTitle}>🛡️ Safe Zone - Parent Override</Text>
            <Text style={styles.dataLabel}>
              This entire area is safe because the parent is marked
              sensitive=false
            </Text>

            <MixpanelSessionReplayView sensitive={true}>
              <View style={styles.nestedCard}>
                <Text style={styles.nestedCardTitle}>
                  🔓 Nested Sensitive Component (Overridden)
                </Text>
                <Text style={styles.dataLabel}>
                  Even though this wrapper has sensitive=true, the parent's
                  sensitive=false setting overrides it, making this content
                  safe.
                </Text>
                <Text style={styles.dataLabel}>Secret Data: ABC123XYZ</Text>
              </View>
            </MixpanelSessionReplayView>

            <TextInput
              style={styles.textInput}
              placeholder="Password field (normally masked)"
              secureTextEntry={true}
            />

            <Text style={styles.dataLabel}>
              Credit Card: 9876 5432 1098 7654 (normally would be masked)
            </Text>
          </View>
        </MixpanelSessionReplayView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  caption: {
    fontSize: 12,
    color: '#888',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  rangeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  rangeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rangeTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    marginHorizontal: 12,
    borderRadius: 2,
  },
  rangeProgress: {
    width: '50%',
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  rangeValue: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  networkImage: {
    width: 150,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  bannerImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bannerSubtext: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  webViewPlaceholder: {
    height: 150,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  webViewText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  webViewSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  webViewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  webViewButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  webViewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  dataCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  nestedCard: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  nestedCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  sampleImage: {
    width: 150,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
});
