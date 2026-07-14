
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AnimatedSplash() {
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        })
      ),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.95, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [rotate, scale, fade]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient colors={["#fde7f2", "#fff"]} style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ rotate: spin }, { scale }], opacity: fade }]}>
        <Image
          source={require('../../assets/femvents-icon1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <View style={styles.shadow} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: width * 0.45,
    height: width * 0.45,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  shadow: {
    width: width * 0.28,
    height: 6,
    backgroundColor: '#00000020',
    borderRadius: 3,
    marginTop: 16,
  },
});

