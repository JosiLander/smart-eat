import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import {
  FamilyService,
  FamilyProfile,
  FamilyMember,
  DietaryRestriction,
  FamilyPreferences,
} from '../services/FamilyService';

interface FamilyProfileScreenProps {
  navigation: any;
}

const DIETARY_RESTRICTIONS = [
  { type: 'vegan', label: 'Vegan', description: 'No animal products' },
  { type: 'vegetarian', label: 'Vegetarian', description: 'No meat products' },
  { type: 'gluten-free', label: 'Gluten-Free', description: 'No gluten-containing foods' },
  { type: 'dairy-free', label: 'Dairy-Free', description: 'No dairy products' },
  { type: 'nut-free', label: 'Nut-Free', description: 'No nuts or nut products' },
  { type: 'soy-free', label: 'Soy-Free', description: 'No soy products' },
  { type: 'shellfish-free', label: 'Shellfish-Free', description: 'No shellfish' },
  { type: 'egg-free', label: 'Egg-Free', description: 'No eggs' },
];

export const FamilyProfileScreen: React.FC<FamilyProfileScreenProps> = ({ navigation }) => {
  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    age: '',
    type: 'adult' as 'adult' | 'child',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    await FamilyService.initialize();
    const familyProfile = await FamilyService.getFamilyProfile();
    setProfile(familyProfile);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const success = await FamilyService.updateFamilyProfile(profile);
    if (success) {
      setIsEditing(false);
      Alert.alert('Success', 'Family profile updated successfully!');
    } else {
      Alert.alert('Error', 'Failed to update family profile');
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.age) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const age = parseInt(newMember.age);
    if (isNaN(age) || age < 0 || age > 120) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    const success = await FamilyService.addFamilyMember({
      name: newMember.name,
      age,
      type: newMember.type,
      dietaryRestrictions: [],
    });

    if (success) {
      setNewMember({ name: '', age: '', type: 'adult' });
      setShowAddMemberModal(false);
      loadProfile();
      Alert.alert('Success', 'Family member added successfully!');
    } else {
      Alert.alert('Error', 'Failed to add family member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    Alert.alert(
      'Remove Family Member',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await FamilyService.removeFamilyMember(memberId);
            if (success) {
              loadProfile();
              Alert.alert('Success', 'Family member removed successfully!');
            } else {
              Alert.alert('Error', 'Failed to remove family member');
            }
          },
        },
      ]
    );
  };

  const handleToggleDietaryRestriction = async (restrictionType: DietaryRestriction['type']) => {
    if (!profile) return;

    const existingRestriction = profile.dietaryRestrictions.find(r => r.type === restrictionType);
    
    if (existingRestriction) {
      await FamilyService.removeDietaryRestriction(restrictionType);
    } else {
      await FamilyService.addDietaryRestriction({
        type: restrictionType,
        severity: 'preference',
      });
    }
    
    loadProfile();
  };

  const handleUpdatePreferences = async (updates: Partial<FamilyPreferences>) => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      preferences: { ...profile.preferences, ...updates },
    };
    setProfile(updatedProfile);
  };

  const handleSavePreferences = async () => {
    if (!profile) return;

    const success = await FamilyService.updateFamilyProfile({
      preferences: profile.preferences,
    });

    if (success) {
      setShowPreferencesModal(false);
      Alert.alert('Success', 'Preferences updated successfully!');
    } else {
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading family profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Profile</Text>
        <TouchableOpacity
          style={[styles.button, isEditing ? styles.saveButton : styles.editButton]}
          onPress={() => {
            if (isEditing) {
              handleSaveProfile();
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Text style={styles.buttonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* Family Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family Summary</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Adults</Text>
            <Text style={styles.summaryValue}>{profile.adults}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Children</Text>
            <Text style={styles.summaryValue}>{profile.children}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{profile.adults + profile.children}</Text>
          </View>
        </View>
      </View>

      {/* Family Members */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddMemberModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {profile.familyMembers.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberDetails}>
                {member.type === 'adult' ? 'Adult' : 'Child'} • {member.age} years old
              </Text>
              {member.dietaryRestrictions.length > 0 && (
                <Text style={styles.dietaryInfo}>
                  Dietary: {member.dietaryRestrictions.map(r => r.type).join(', ')}
                </Text>
              )}
            </View>
            {isEditing && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMember(member.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Dietary Restrictions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
        <Text style={styles.sectionDescription}>
          These restrictions will apply to all family members and affect recipe suggestions
        </Text>

        {DIETARY_RESTRICTIONS.map((restriction) => {
          const isActive = profile.dietaryRestrictions.some(r => r.type === restriction.type);
          return (
            <TouchableOpacity
              key={restriction.type}
              style={[styles.restrictionItem, isActive && styles.activeRestriction]}
              onPress={() => handleToggleDietaryRestriction(restriction.type)}
            >
              <View style={styles.restrictionInfo}>
                <Text style={[styles.restrictionLabel, isActive && styles.activeRestrictionText]}>
                  {restriction.label}
                </Text>
                <Text style={[styles.restrictionDescription, isActive && styles.activeRestrictionText]}>
                  {restriction.description}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={() => handleToggleDietaryRestriction(restriction.type)}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={isActive ? '#fff' : '#f4f3f4'}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowPreferencesModal(true)}
          >
            <Text style={styles.addButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.preferencesContainer}>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Meal Size</Text>
            <Text style={styles.preferenceValue}>{profile.preferences.mealSize}</Text>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Cooking Frequency</Text>
            <Text style={styles.preferenceValue}>{profile.preferences.cookingFrequency}</Text>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Shopping Frequency</Text>
            <Text style={styles.preferenceValue}>{profile.preferences.shoppingFrequency}</Text>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Budget Conscious</Text>
            <Text style={styles.preferenceValue}>{profile.preferences.budgetConscious ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      </View>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Family Member</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newMember.name}
              onChangeText={(text) => setNewMember({ ...newMember, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={newMember.age}
              onChangeText={(text) => setNewMember({ ...newMember, age: text })}
              keyboardType="numeric"
            />
            
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newMember.type === 'adult' && styles.selectedTypeOption,
                ]}
                onPress={() => setNewMember({ ...newMember, type: 'adult' })}
              >
                <Text style={[
                  styles.typeOptionText,
                  newMember.type === 'adult' && styles.selectedTypeOptionText,
                ]}>
                  Adult
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newMember.type === 'child' && styles.selectedTypeOption,
                ]}
                onPress={() => setNewMember({ ...newMember, type: 'child' })}
              >
                <Text style={[
                  styles.typeOptionText,
                  newMember.type === 'child' && styles.selectedTypeOptionText,
                ]}>
                  Child
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handleAddMember}
              >
                <Text style={styles.saveModalButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preferences Modal */}
      <Modal
        visible={showPreferencesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreferencesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Preferences</Text>
            
            <View style={styles.preferenceModalItem}>
              <Text style={styles.preferenceModalLabel}>Meal Size</Text>
              <View style={styles.optionSelector}>
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.optionButton,
                      profile.preferences.mealSize === size && styles.selectedOptionButton,
                    ]}
                    onPress={() => handleUpdatePreferences({ mealSize: size })}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      profile.preferences.mealSize === size && styles.selectedOptionButtonText,
                    ]}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.preferenceModalItem}>
              <Text style={styles.preferenceModalLabel}>Cooking Frequency</Text>
              <View style={styles.optionSelector}>
                {(['daily', 'every-other-day', 'weekly'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.optionButton,
                      profile.preferences.cookingFrequency === freq && styles.selectedOptionButton,
                    ]}
                    onPress={() => handleUpdatePreferences({ cookingFrequency: freq })}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      profile.preferences.cookingFrequency === freq && styles.selectedOptionButtonText,
                    ]}>
                      {freq.replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.preferenceModalItem}>
              <Text style={styles.preferenceModalLabel}>Shopping Frequency</Text>
              <View style={styles.optionSelector}>
                {(['daily', 'twice-weekly', 'weekly', 'bi-weekly'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.optionButton,
                      profile.preferences.shoppingFrequency === freq && styles.selectedOptionButton,
                    ]}
                    onPress={() => handleUpdatePreferences({ shoppingFrequency: freq })}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      profile.preferences.shoppingFrequency === freq && styles.selectedOptionButtonText,
                    ]}>
                      {freq.replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.preferenceModalItem}>
              <Text style={styles.preferenceModalLabel}>Budget Conscious</Text>
              <Switch
                value={profile.preferences.budgetConscious}
                onValueChange={(value) => handleUpdatePreferences({ budgetConscious: value })}
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={profile.preferences.budgetConscious ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPreferencesModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handleSavePreferences}
              >
                <Text style={styles.saveModalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dietaryInfo: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  restrictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  activeRestriction: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  restrictionInfo: {
    flex: 1,
  },
  restrictionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activeRestrictionText: {
    color: '#2E7D32',
  },
  restrictionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  preferencesContainer: {
    gap: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
  },
  preferenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedTypeOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTypeOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveModalButton: {
    backgroundColor: '#007AFF',
  },
  saveModalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  preferenceModalItem: {
    marginBottom: 20,
  },
  preferenceModalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optionSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
  },
  selectedOptionButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
