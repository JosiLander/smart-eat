import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showArrow?: boolean;
  onShow?: () => void;
  onHide?: () => void;
  accessibilityLabel?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  showArrow = true,
  onShow,
  onHide,
  accessibilityLabel,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const showTooltip = () => {
    setIsVisible(true);
    onShow?.();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideTooltip = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onHide?.();
    });
  };

  const getTooltipStyle = () => {
    const baseStyle = {
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
    };

    switch (position) {
      case 'top':
        return [baseStyle, styles.tooltipTop];
      case 'bottom':
        return [baseStyle, styles.tooltipBottom];
      case 'left':
        return [baseStyle, styles.tooltipLeft];
      case 'right':
        return [baseStyle, styles.tooltipRight];
      default:
        return [baseStyle, styles.tooltipTop];
    }
  };

  const getArrowStyle = () => {
    switch (position) {
      case 'top':
        return styles.arrowTop;
      case 'bottom':
        return styles.arrowBottom;
      case 'left':
        return styles.arrowLeft;
      case 'right':
        return styles.arrowRight;
      default:
        return styles.arrowTop;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPressIn={showTooltip}
        onPressOut={hideTooltip}
        onLongPress={showTooltip}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || "Tap and hold for help"}
        accessibilityHint="Shows helpful information about this feature"
      >
        {children}
      </TouchableOpacity>

      {isVisible && (
        <Animated.View style={[styles.tooltip, getTooltipStyle()]}>
          {showArrow && <View style={[styles.arrow, getArrowStyle()]} />}
          <Text style={styles.tooltipText}>{content}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    padding: 12,
    maxWidth: 250,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipTop: {
    bottom: '100%',
    left: '50%',
    marginLeft: -125,
    marginBottom: 8,
  },
  tooltipBottom: {
    top: '100%',
    left: '50%',
    marginLeft: -125,
    marginTop: 8,
  },
  tooltipLeft: {
    right: '100%',
    top: '50%',
    marginTop: -20,
    marginRight: 8,
  },
  tooltipRight: {
    left: '100%',
    top: '50%',
    marginTop: -20,
    marginLeft: 8,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  arrowTop: {
    top: '100%',
    left: '50%',
    marginLeft: -6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2c3e50',
  },
  arrowBottom: {
    bottom: '100%',
    left: '50%',
    marginLeft: -6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2c3e50',
  },
  arrowLeft: {
    left: '100%',
    top: '50%',
    marginTop: -6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#2c3e50',
  },
  arrowRight: {
    right: '100%',
    top: '50%',
    marginTop: -6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#2c3e50',
  },
  tooltipText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
