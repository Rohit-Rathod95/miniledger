import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createLoan } from '../api/loans';
import { uploadReceipt } from '../api/uploads';
import type { RootStackParamList } from '../types';

export type AddEntryScreenProps = NativeStackScreenProps<RootStackParamList, 'Add'>;

interface FieldErrors {
  friendName?: string;
  amount?: string;
  dueDate?: string;
}

function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidCalendarDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function AddEntryScreen({ navigation }: AddEntryScreenProps) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<string>(() => getTodayLocalDate());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please grant access to your photos to attach a receipt.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const errors: FieldErrors = {};

    const trimmedName = friendName.trim();
    if (!trimmedName) {
      errors.friendName = 'Friend name is required';
    } else if (trimmedName.length > 100) {
      errors.friendName = 'Friend name must be 100 characters or less';
    }

    const trimmedAmount = amount.trim();
    const parsedAmount = Number(trimmedAmount);
    if (!trimmedAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0 || !Number.isFinite(parsedAmount)) {
      errors.amount = 'Amount must be greater than 0';
    }

    const trimmedDueDate = dueDate.trim();
    if (!trimmedDueDate || !isValidCalendarDate(trimmedDueDate)) {
      errors.dueDate = 'Due date must match YYYY-MM-DD and be a real calendar date';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      let receiptUrl: string | undefined = undefined;
      if (imageUri) {
        setIsUploading(true);
        try {
          receiptUrl = await uploadReceipt(imageUri);
        } finally {
          setIsUploading(false);
        }
      }

      await createLoan({
        friendName: trimmedName,
        amount: parsedAmount,
        dueDate: trimmedDueDate,
        receiptUrl,
      });
      navigation.goBack();
    } catch (err: any) {
      setApiError(err?.message ?? 'Failed to save entry. Please try again.');
    } finally {
      setSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {apiError ? (
            <View style={styles.apiErrorBox}>
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          ) : null}

          {/* Friend Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Friend name</Text>
            <TextInput
              style={[styles.input, Boolean(fieldErrors.friendName) && styles.inputError]}
              placeholder="Friend name"
              placeholderTextColor="#94a3b8"
              value={friendName}
              onChangeText={(text) => {
                setFriendName(text);
                if (fieldErrors.friendName) {
                  setFieldErrors((prev) => ({ ...prev, friendName: undefined }));
                }
                if (apiError) setApiError(null);
              }}
              autoCapitalize="words"
              editable={!submitting}
              returnKeyType="next"
            />
            {fieldErrors.friendName ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.friendName}</Text>
            ) : null}
          </View>

          {/* Amount Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={[styles.input, Boolean(fieldErrors.amount) && styles.inputError]}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (fieldErrors.amount) {
                  setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                }
                if (apiError) setApiError(null);
              }}
              keyboardType="decimal-pad"
              editable={!submitting}
              returnKeyType="next"
            />
            {fieldErrors.amount ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.amount}</Text>
            ) : null}
          </View>

          {/* Due Date Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Due date</Text>
            <TextInput
              style={[styles.input, Boolean(fieldErrors.dueDate) && styles.inputError]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={dueDate}
              onChangeText={(text) => {
                setDueDate(text);
                if (fieldErrors.dueDate) {
                  setFieldErrors((prev) => ({ ...prev, dueDate: undefined }));
                }
                if (apiError) setApiError(null);
              }}
              autoCapitalize="none"
              editable={!submitting}
              returnKeyType="done"
            />
            {fieldErrors.dueDate ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.dueDate}</Text>
            ) : null}
          </View>

          {/* Receipt Photo */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Receipt photo</Text>
            {imageUri ? (
              <View style={styles.receiptPreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.receiptThumbnail} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setImageUri(null)}
                  disabled={submitting}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removePhotoText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handlePickImage}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <Text style={styles.addPhotoButtonText}>Add receipt photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.saveButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.saveButtonText}>
                    {isUploading ? 'Uploading…' : 'Saving…'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save entry</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  fieldErrorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 6,
  },
  addPhotoButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  addPhotoButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  receiptPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  removePhotoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  removePhotoText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  apiErrorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  apiErrorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submittingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
});
