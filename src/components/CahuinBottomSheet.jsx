import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback, Animated, PanResponder, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const CahuinBottomSheet = ({ visible, children, onClose, style }) => {
  const { theme, isDarkMode } = useTheme();
  const panY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, panY, fadeAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only claim the gesture if the user is swiping down significantly
        return gestureState.dy > 10;
      },
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 1.5) {
          // Swipe down threshold met, close modal
          Animated.timing(panY, {
            toValue: 800,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            if (onClose) onClose();
          });
        } else {
          // Snap back
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  const defaultBackgroundStyle = {
    backgroundColor: theme?.bg || (isDarkMode ? '#1a1a1a' : '#ffffff'),
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          {...panResponder.panHandlers}
          style={[
            styles.sheet, 
            defaultBackgroundStyle, 
            style,
            { maxHeight: '80%' },
            { transform: [{ translateY: panY.interpolate({ inputRange: [0, 1000], outputRange: [0, 1000], extrapolate: 'clamp' }) }] }
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]} />
          </View>
          <View style={{ paddingBottom: Platform.OS === 'ios' ? 20 : 30, flexShrink: 1 }}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
});

export default CahuinBottomSheet;
