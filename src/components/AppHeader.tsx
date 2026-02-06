import React, { useCallback } from "react";
import { View, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { PRIMARY_COLOR } from "../lib/constants";
import { useSession } from "../hooks/useSession";

function AnimatedTitle() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(1.15, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 6, stiffness: 300 })
    );
  }, [scale]);

  return (
    <Animated.Text
      onPress={handlePress}
      style={[{ color: "#fff", fontSize: 20, fontWeight: "800" }, animatedStyle]}
    >
      OpenHouse 2026
    </Animated.Text>
  );
}

export default function AppHeader() {
  const insets = useSafeAreaInsets();
  const { logout } = useSession();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar tu sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/session");
          },
        },
      ]
    );
  };

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: PRIMARY_COLOR,
      }}
    >
      <View
        style={{
          height: 52,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
        }}
      >
        <Image
          source={require("../../cicc.png")}
          style={{ width: 32, height: 32, borderRadius: 8 }}
          contentFit="contain"
        />
        <AnimatedTitle />
        <Pressable
          onPress={handleLogout}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
