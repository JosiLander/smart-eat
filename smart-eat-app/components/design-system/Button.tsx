import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  children,
  style,
  textStyle,
  ...props
}) => {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles = {
      small: {
        paddingHorizontal: theme.spacing.button.paddingSmall.paddingHorizontal,
        paddingVertical: theme.spacing.button.paddingSmall.paddingVertical,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: theme.spacing.button.paddingHorizontal,
        paddingVertical: theme.spacing.button.paddingVertical,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: theme.spacing.button.paddingLarge.paddingHorizontal,
        paddingVertical: theme.spacing.button.paddingLarge.paddingVertical,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: isDisabled ? theme.colors.textTertiary : theme.colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: isDisabled ? theme.colors.textTertiary : theme.colors.secondary,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: isDisabled ? theme.colors.textTertiary : theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      danger: {
        backgroundColor: isDisabled ? theme.colors.textTertiary : theme.colors.error,
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextColor = (): keyof typeof theme.colors => {
    if (isDisabled) return 'textTertiary';
    
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return 'textInverse';
      case 'outline':
        return 'primary';
      case 'ghost':
        return 'primary';
      default:
        return 'textPrimary';
    }
  };

  const getTextVariant = () => {
    switch (size) {
      case 'small':
        return 'buttonSmall' as const;
      case 'medium':
      case 'large':
        return 'button' as const;
      default:
        return 'button' as const;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      <Text
        variant={getTextVariant()}
        color={getTextColor()}
        style={textStyle}
      >
        {loading ? 'Loading...' : children}
      </Text>
    </TouchableOpacity>
  );
};

// Convenience components for common button variants
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
);

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="danger" {...props} />
);
