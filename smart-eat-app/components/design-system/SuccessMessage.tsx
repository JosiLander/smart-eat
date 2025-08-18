import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

interface SuccessMessageProps {
  message: string;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
  style?: ViewStyle;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  visible,
  onHide,
  duration = 3000,
  style,
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideMessage();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideMessage();
    }
  }, [visible, duration]);

  const hideMessage = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.success,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, { color: theme.colors.textInverse }]}>
          ✓
        </Text>
        <Text
          variant="body"
          color="textInverse"
          style={styles.message}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  message: {
    flex: 1,
  },
});

// Convenience component for settings success
export const SettingsSuccessMessage: React.FC<{ visible: boolean; onHide?: () => void }> = ({ visible, onHide }) => (
  <SuccessMessage
    message="Settings saved successfully!"
    visible={visible}
    onHide={onHide}
    duration={2000}
  />
);
