import React, { useState } from 'react';
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
import { HouseholdSettings } from '../../services/SettingsService';

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  type: 'adult' | 'child';
}

interface HouseholdManagementSectionProps {
  settings: HouseholdSettings;
  onSettingsChange: (settings: HouseholdSettings) => void;
}

export const HouseholdManagementSection: React.FC<HouseholdManagementSectionProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [newMemberType, setNewMemberType] = useState<'adult' | 'child'>('adult');

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: '1', name: 'John', age: 35, type: 'adult' },
    { id: '2', name: 'Sarah', age: 32, type: 'adult' },
    { id: '3', name: 'Emma', age: 8, type: 'child' },
    { id: '4', name: 'Liam', age: 5, type: 'child' },
  ]);

  const updateHouseholdCounts = (members: FamilyMember[]) => {
    const adults = members.filter(m => m.type === 'adult').length;
    const children = members.filter(m => m.type === 'child').length;
    const childAges = members.filter(m => m.type === 'child').map(m => m.age);

    onSettingsChange({
      ...settings,
      adults,
      children,
      childAges,
    });
  };

  const addFamilyMember = () => {
    if (!newMemberName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const age = parseInt(newMemberAge);
    if (isNaN(age) || age < 0 || age > 120) {
      Alert.alert('Error', 'Please enter a valid age (0-120)');
      return;
    }

    if (newMemberType === 'child' && age > 18) {
      Alert.alert('Error', 'Children must be 18 or younger');
      return;
    }

    if (newMemberType === 'adult' && age < 18) {
      Alert.alert('Error', 'Adults must be 18 or older');
      return;
    }

    const newMember: FamilyMember = {
      id: `member_${Date.now()}`,
      name: newMemberName.trim(),
      age,
      type: newMemberType,
    };

    const updatedMembers = [...familyMembers, newMember];
    setFamilyMembers(updatedMembers);
    updateHouseholdCounts(updatedMembers);

    setNewMemberName('');
    setNewMemberAge('');
    setNewMemberType('adult');
    setShowAddMemberModal(false);
  };

  const editFamilyMember = () => {
    if (!editingMember) return;

    if (!newMemberName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const age = parseInt(newMemberAge);
    if (isNaN(age) || age < 0 || age > 120) {
      Alert.alert('Error', 'Please enter a valid age (0-120)');
      return;
    }

    if (newMemberType === 'child' && age > 18) {
      Alert.alert('Error', 'Children must be 18 or younger');
      return;
    }

    if (newMemberType === 'adult' && age < 18) {
      Alert.alert('Error', 'Adults must be 18 or older');
      return;
    }

    const updatedMembers = familyMembers.map(member =>
      member.id === editingMember.id
        ? { ...member, name: newMemberName.trim(), age, type: newMemberType }
        : member
    );

    setFamilyMembers(updatedMembers);
    updateHouseholdCounts(updatedMembers);

    setNewMemberName('');
    setNewMemberAge('');
    setNewMemberType('adult');
    setEditingMember(null);
    setShowEditMemberModal(false);
  };

  const removeFamilyMember = (memberId: string) => {
    Alert.alert(
      'Remove Family Member',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedMembers = familyMembers.filter(m => m.id !== memberId);
            setFamilyMembers(updatedMembers);
            updateHouseholdCounts(updatedMembers);
          },
        },
      ]
    );
  };

  const startEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setNewMemberName(member.name);
    setNewMemberAge(member.age.toString());
    setNewMemberType(member.type);
    setShowEditMemberModal(true);
  };

  const toggleAutoAdjustPortions = () => {
    onSettingsChange({
      ...settings,
      autoAdjustPortions: !settings.autoAdjustPortions,
    });
  };

  const renderFamilyMember = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberDetails}>
          {item.type === 'adult' ? 'Adult' : 'Child'} • Age {item.age}
        </Text>
      </View>
      <View style={styles.memberActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => startEditMember(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFamilyMember(item.id)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddModal = () => (
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
            style={styles.textInput}
            placeholder="Enter name"
            value={newMemberName}
            onChangeText={setNewMemberName}
            maxLength={50}
          />
          
          <TextInput
            style={styles.textInput}
            placeholder="Enter age"
            value={newMemberAge}
            onChangeText={setNewMemberAge}
            keyboardType="numeric"
            maxLength={3}
          />
          
          <View style={styles.typeSelector}>
            <Text style={styles.typeSelectorTitle}>Member Type:</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMemberType === 'adult' && styles.typeButtonSelected,
                ]}
                onPress={() => setNewMemberType('adult')}
              >
                <Text style={[
                  styles.typeButtonText,
                  newMemberType === 'adult' && styles.typeButtonTextSelected,
                ]}>
                  Adult (18+)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMemberType === 'child' && styles.typeButtonSelected,
                ]}
                onPress={() => setNewMemberType('child')}
              >
                <Text style={[
                  styles.typeButtonText,
                  newMemberType === 'child' && styles.typeButtonTextSelected,
                ]}>
                  Child (0-18)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddMemberModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={addFamilyMember}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditMemberModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditMemberModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Family Member</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Enter name"
            value={newMemberName}
            onChangeText={setNewMemberName}
            maxLength={50}
          />
          
          <TextInput
            style={styles.textInput}
            placeholder="Enter age"
            value={newMemberAge}
            onChangeText={setNewMemberAge}
            keyboardType="numeric"
            maxLength={3}
          />
          
          <View style={styles.typeSelector}>
            <Text style={styles.typeSelectorTitle}>Member Type:</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMemberType === 'adult' && styles.typeButtonSelected,
                ]}
                onPress={() => setNewMemberType('adult')}
              >
                <Text style={[
                  styles.typeButtonText,
                  newMemberType === 'adult' && styles.typeButtonTextSelected,
                ]}>
                  Adult (18+)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMemberType === 'child' && styles.typeButtonSelected,
                ]}
                onPress={() => setNewMemberType('child')}
              >
                <Text style={[
                  styles.typeButtonText,
                  newMemberType === 'child' && styles.typeButtonTextSelected,
                ]}>
                  Child (0-18)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditMemberModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={editFamilyMember}
            >
              <Text style={styles.addButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Household Management</Text>
        <Text style={styles.sectionSubtitle}>Configure your family setup</Text>
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Adults:</Text>
          <Text style={styles.summaryValue}>{settings.adults}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Children:</Text>
          <Text style={styles.summaryValue}>{settings.children}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={styles.summaryValue}>{settings.adults + settings.children}</Text>
        </View>
      </View>

      <View style={styles.autoAdjustSection}>
        <View style={styles.autoAdjustContent}>
          <Text style={styles.autoAdjustLabel}>Auto-adjust portions</Text>
          <Text style={styles.autoAdjustDescription}>
            Automatically scale recipe quantities based on household size
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, settings.autoAdjustPortions && styles.toggleActive]}
          onPress={toggleAutoAdjustPortions}
        >
          <View style={[styles.toggleThumb, settings.autoAdjustPortions && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>

      <View style={styles.membersSection}>
        <Text style={styles.membersTitle}>Family Members</Text>
        <FlatList
          data={familyMembers}
          renderItem={renderFamilyMember}
          keyExtractor={(item) => item.id}
          style={styles.membersList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <TouchableOpacity
        style={styles.addMemberButton}
        onPress={() => setShowAddMemberModal(true)}
      >
        <Text style={styles.addMemberButtonText}>+ Add Family Member</Text>
      </TouchableOpacity>

      {renderAddModal()}
      {renderEditModal()}
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
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 20,
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
    color: '#27ae60',
  },
  autoAdjustSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  autoAdjustContent: {
    flex: 1,
    marginRight: 16,
  },
  autoAdjustLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  autoAdjustDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#27ae60',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: 'white',
    borderRadius: 13,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  membersSection: {
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  membersList: {
    maxHeight: 200,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addMemberButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addMemberButtonText: {
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
    marginBottom: 16,
  },
  typeSelector: {
    marginBottom: 20,
  },
  typeSelectorTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: '#27ae60',
    backgroundColor: '#f0f8f0',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#27ae60',
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
  addButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HouseholdManagementSection;
