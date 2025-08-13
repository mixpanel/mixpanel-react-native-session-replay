import { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
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
        <Text style={styles.sectionTitle}>Images</Text>

        <View style={styles.imageContainer}>
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Sample Image 1</Text>
            <Text style={styles.placeholderSubtext}>200x150</Text>
          </View>

          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Sample Image 2</Text>
            <Text style={styles.placeholderSubtext}>200x150</Text>
          </View>
        </View>

        <View style={styles.profileImageContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>Avatar</Text>
          </View>
          <Text style={styles.profileName}>John Doe</Text>
          <Text style={styles.profileEmail}>john.doe@company.com</Text>
        </View>
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
  placeholderImage: {
    width: 150,
    height: 100,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
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
});
