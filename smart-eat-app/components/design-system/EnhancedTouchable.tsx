import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  Animated,
  View,
} from 'react-native';
import { useTheme } from '../../theme';

interface EnhancedTouchableProps extends TouchableOpacityProps {
  children: React.ReactNode;
  minTouchTarget?: number;
  feedbackType?: 'opacity' | 'scale' | 'highlight';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const EnhancedTouchable: React.FC<EnhancedTouchableProps> = ({
  children,
  minTouchTarget = 44,
  feedbackType = 'opacity',
  style,
  contentStyle,
  ...props
}) => {
  const theme = useTheme();

  const getTouchTargetStyle = (): ViewStyle => {
    return {
      minHeight: minTouchTarget,
      minWidth: minTouchTarget,
      justifyContent: 'center',
      alignItems: 'center',
    };
  };

  const getFeedbackStyle = (): ViewStyle => {
    switch (feedbackType) {
      case 'scale':
        return {
          transform: [{ scale: 0.95 }],
        };
      case 'highlight':
        return {
          backgroundColor: theme.colors.overlayLight,
        };
      case 'opacity':
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity
      style={[
        getTouchTargetStyle(),
        style,
      ]}
      activeOpacity={feedbackType === 'opacity' ? 0.7 : 1}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      {...props}
    >
      <View style={[contentStyle, getFeedbackStyle()]}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

// Specialized touchable components
export const TouchableCard: React.FC<Omit<EnhancedTouchableProps, 'feedbackType'>> = (props) => (
  <EnhancedTouchable
    feedbackType="highlight"
    style={[
      {
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      props.style,
    ]}
    {...props}
  />
);

export const TouchableIcon: React.FC<Omit<EnhancedTouchableProps, 'feedbackType' | 'minTouchTarget'>> = (props) => (
  <EnhancedTouchable
    feedbackType="scale"
    minTouchTarget={44}
    style={[
      {
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
      },
      props.style,
    ]}
    {...props}
  />
);

export const TouchableListItem: React.FC<Omit<EnhancedTouchableProps, 'feedbackType'>> = (props) => (
  <EnhancedTouchable
    feedbackType="highlight"
    style={[
      {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E7',
      },
      props.style,
    ]}
    {...props}
  />
);
