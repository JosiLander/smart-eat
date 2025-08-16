import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';

interface ProgressiveDisclosureProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  title,
  children,
  initiallyExpanded = false,
  onToggle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const animatedHeight = useRef(new Animated.Value(initiallyExpanded ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);

    Animated.timing(animatedHeight, {
      toValue: newExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Announce to screen readers
    if (newExpanded) {
      AccessibilityInfo.announceForAccessibility(`${title} details expanded`);
    } else {
      AccessibilityInfo.announceForAccessibility(`${title} details collapsed`);
    }
  };

  const onContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `${title} toggle`}
        accessibilityHint={accessibilityHint || `Tap to ${isExpanded ? 'hide' : 'show'} details`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text style={styles.title}>{title}</Text>
        <Animated.View
          style={[
            styles.chevron,
            {
              transform: [
                {
                  rotate: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.chevronText}>▼</Text>
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, contentHeight],
            }),
            opacity: animatedHeight,
          },
        ]}
        onLayout={onContentLayout}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 12,
    color: '#6c757d',
  },
  content: {
    padding: 16,
  },
});
