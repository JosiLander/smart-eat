import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { DietaryPreference } from '../../services/SettingsService';

interface DietaryPreferencesSectionProps {
  preferences: DietaryPreference[];
  onPreferencesChange: (preferences: DietaryPreference[]) => void;
}

const DIETARY_ICONS = ['🌱', '🥬', '🌾', '🥛', '🥜', '🫘', '🦐', '🥚', '🍎', '🥕', '🥑', '🥩', '🐟', '🥥', '🌰', '🫛'];

export const DietaryPreferencesSection: React.FC<DietaryPreferencesSectionProps> = ({
  preferences,
  onPreferencesChange,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [newPreferenceName, setNewPreferenceName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🌱');
  const [familyMembers, setFamilyMembers] = useState([
    { id: '1', name: 'John', preferences: [] },
    { id: '2', name: 'Sarah', preferences: [] },
  ]);

  const defaultPreferences = [
    { id: 'vegan', name: 'Vegan', icon: '🌱', isCustom: false },
    { id: 'vegetarian', name: 'Vegetarian', icon: '🥬', isCustom: false },
    { id: 'gluten-free', name: 'Gluten-free', icon: '🌾', isCustom: false },
    { id: 'dairy-free', name: 'Dairy-free', icon: '🥛', isCustom: false },
    { id: 'nut-free', name: 'Nut-free', icon: '🥜', isCustom: false },
    { id: 'soy-free', name: 'Soy-free', icon: '🫘', isCustom: false },
    { id: 'shellfish-free', name: 'Shellfish-free', icon: '🦐', isCustom: false },
    { id: 'egg-free', name: 'Egg-free', icon: '🥚', isCustom: false },
  ];

  const togglePreference = (preferenceId: string) => {
    const updatedPreferences = preferences.map(pref => 
      pref.id === preferenceId 
        ? { ...pref, enabled: !pref.enabled }
        : pref
    );
    onPreferencesChange(updatedPreferences);
  };

  const addCustomPreference = () => {
    if (!newPreferenceName.trim()) {
      Alert.alert('Error', 'Please enter a preference name');
      return;
    }

    const newPreference: DietaryPreference = {
      id: `custom_${Date.now()}`,
      name: newPreferenceName.trim(),
      icon: selectedIcon,
      isCustom: true,
      enabled: true,
    };

    const updatedPreferences = [...preferences, newPreference];
    onPreferencesChange(updatedPreferences);
    
    setNewPreferenceName('');
    setSelectedIcon('🌱');
    setShowAddModal(false);
  };

  const removeCustomPreference = (preferenceId: string) => {
    Alert.alert(
      'Remove Preference',
      'Are you sure you want to remove this dietary preference?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedPreferences = preferences.filter(p => p.id !== preferenceId);
            onPreferencesChange(updatedPreferences);
          },
        },
      ]
    );
  };

  const toggleFamilyMemberPreference = (memberId: string, preferenceId: string) => {
    const updatedMembers = familyMembers.map(member => {
      if (member.id === memberId) {
        const hasPreference = member.preferences.includes(preferenceId);
        const updatedPreferences = hasPreference
          ? member.preferences.filter(p => p !== preferenceId)
          : [...member.preferences, preferenceId];
        
        return { ...member, preferences: updatedPreferences };
      }
      return member;
    });
    setFamilyMembers(updatedMembers);
  };

  const renderPreferenceItem = ({ item }: { item: DietaryPreference }) => (
    <View style={styles.preferenceItem}>
      <TouchableOpacity
        style={styles.preferenceContent}
        onPress={() => togglePreference(item.id)}
      >
        <Text style={styles.preferenceIcon}>{item.icon}</Text>
        <View style={styles.preferenceTextContainer}>
          <Text style={styles.preferenceName}>{item.name}</Text>
          {item.isCustom && (
            <Text style={styles.customLabel}>Custom</Text>
          )}
        </View>
        <View style={[styles.checkbox, item.enabled && styles.checkboxChecked]}>
          {item.enabled && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
      
      {item.isCustom && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeCustomPreference(item.id)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderIconSelector = () => (
    <View style={styles.iconSelector}>
      <Text style={styles.iconSelectorTitle}>Choose an icon:</Text>
      <FlatList
        data={DIETARY_ICONS}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.iconOption,
              selectedIcon === item && styles.iconOptionSelected,
            ]}
            onPress={() => setSelectedIcon(item)}
          >
            <Text style={styles.iconOptionText}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.iconSelectorContent}
      />
    </View>
  );

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Custom Dietary Restriction</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Enter restriction name (e.g., Keto, Paleo)"
            value={newPreferenceName}
            onChangeText={setNewPreferenceName}
            maxLength={50}
          />
          
          {renderIconSelector()}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={addCustomPreference}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderFamilyModal = () => (
    <Modal
      visible={showFamilyModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFamilyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Family Member Preferences</Text>
          
          <ScrollView style={styles.familyScrollView}>
            {familyMembers.map(member => (
              <View key={member.id} style={styles.familyMemberSection}>
                <Text style={styles.familyMemberName}>{member.name}</Text>
                <View style={styles.familyPreferences}>
                  {defaultPreferences.map(preference => (
                    <TouchableOpacity
                      key={preference.id}
                      style={[
                        styles.familyPreferenceItem,
                        member.preferences.includes(preference.id) && styles.familyPreferenceSelected,
                      ]}
                      onPress={() => toggleFamilyMemberPreference(member.id, preference.id)}
                    >
                      <Text style={styles.familyPreferenceIcon}>{preference.icon}</Text>
                      <Text style={styles.familyPreferenceName}>{preference.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFamilyModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
        <Text style={styles.sectionSubtitle}>Select your food restrictions</Text>
      </View>

      <FlatList
        data={preferences}
        renderItem={renderPreferenceItem}
        keyExtractor={(item) => item.id}
        style={styles.preferencesList}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Custom Restriction</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.familyButton}
        onPress={() => setShowFamilyModal(true)}
      >
        <Text style={styles.familyButtonText}>👨‍👩‍👧‍👦 Family Member Overrides</Text>
      </TouchableOpacity>

      {renderAddModal()}
      {renderFamilyModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  preferencesList: {
    maxHeight: 300,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  customLabel: {
    fontSize: 12,
    color: '#27ae60',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  familyButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  familyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  iconSelector: {
    marginBottom: 20,
  },
  iconSelectorTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  iconSelectorContent: {
    paddingHorizontal: 8,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  iconOptionSelected: {
    borderColor: '#27ae60',
    backgroundColor: '#f0f8f0',
  },
  iconOptionText: {
    fontSize: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  familyScrollView: {
    maxHeight: 400,
  },
  familyMemberSection: {
    marginBottom: 20,
  },
  familyMemberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  familyPreferences: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  familyPreferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  familyPreferenceSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#27ae60',
    borderWidth: 1,
  },
  familyPreferenceIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  familyPreferenceName: {
    fontSize: 14,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DietaryPreferencesSection;
