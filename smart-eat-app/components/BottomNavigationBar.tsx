import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

export type TabType = 'scan' | 'recipes' | 'inventory' | 'grocery';

interface BottomNavigationBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs = [
    {
      id: 'scan' as TabType,
      label: 'Scan',
      icon: '📷',
    },
    {
      id: 'recipes' as TabType,
      label: 'Recipes',
      icon: '🍳',
    },
    {
      id: 'inventory' as TabType,
      label: 'Inventory',
      icon: '📦',
    },
    {
      id: 'grocery' as TabType,
      label: 'Grocery',
      icon: '🛒',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab,
          ]}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabIcon,
            activeTab === tab.id && styles.activeTabIcon,
          ]}>
            {tab.icon}
          </Text>
          <Text style={[
            styles.tabLabel,
            activeTab === tab.id && styles.activeTabLabel,
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Active state styling
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#27ae60',
    fontWeight: '600',
  },
});
