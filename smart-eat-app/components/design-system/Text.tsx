import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { TextVariant } from '../../theme/typography';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: keyof ReturnType<typeof useTheme>['colors'];
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  size?: number;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'textPrimary',
  align = 'left',
  weight,
  size,
  style,
  children,
  ...props
}) => {
  const theme = useTheme();
  const variantStyle = theme.textVariants[variant];
  
  const textStyle = [
    {
      color: theme.colors[color],
      textAlign: align,
      ...variantStyle,
    },
    weight && { fontWeight: theme.typography.weights[weight] },
    size && { fontSize: size },
    style,
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

// Convenience components for common text variants
export const Heading1: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h3" {...props} />
);

export const Heading4: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h4" {...props} />
);

export const BodyText: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="body" {...props} />
);

export const BodyLarge: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="bodyLarge" {...props} />
);

export const BodySmall: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="bodySmall" {...props} />
);

export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="caption" {...props} />
);

export const Label: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="label" {...props} />
);

export const ButtonText: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="button" {...props} />
);

export const NavText: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="nav" {...props} />
);
