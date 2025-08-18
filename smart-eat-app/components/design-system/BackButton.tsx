import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

interface BackButtonProps extends TouchableOpacityProps {
  title?: string;
  onPress: () => void;
  showIcon?: boolean;
  style?: any;
}

export const BackButton: React.FC<BackButtonProps> = ({
  title = 'Back',
  onPress,
  showIcon = true,
  style,
  ...props
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      {...props}
    >
      <View style={styles.content}>
        {showIcon && (
          <Text style={[styles.icon, { color: theme.colors.primary }]}>
            ←
          </Text>
        )}
        <Text
          variant="nav"
          color="primary"
          style={styles.text}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    fontSize: 18,
    marginRight: 4,
  },
  text: {
    fontSize: 14,
  },
});
