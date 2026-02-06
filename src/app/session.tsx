import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Button, Input, Label, TextField } from "heroui-native";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { saveSession } from "../lib/session";
import { PRIMARY_COLOR } from "../lib/constants";

export default function SessionScreen() {
  const router = useRouter();
  const upsertUser = useMutation(api.users.upsertUserFromSession);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

  const isValid =
    username.trim().length > 0 &&
    isValidEmail(email) &&
    phone.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsLoading(true);

    try {
      const userId = await upsertUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });

      await saveSession({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        userId: userId as string,
      });

      router.replace("/(tabs)/feed");
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la sesión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo area */}
        <View className="items-center mb-10">
          <Image
            source={require("../../cicc.png")}
            style={{ width: 100, height: 100, borderRadius: 16 }}
            contentFit="contain"
            className="mb-4"
          />
          <Text className="text-2xl font-bold text-foreground text-center">
            OpenHouse 2026
          </Text>
          <Text className="text-base text-muted text-center mt-2">
            Social App
          </Text>
          <Text className="text-sm text-muted text-center mt-4 px-4">
            Ingresa tus datos para comenzar a publicar y compartir fotos del
            evento.
          </Text>
        </View>

        {/* Form */}
        <View className="gap-5">
          <TextField isRequired>
            <Label>Nombre de usuario</Label>
            <Input
              placeholder="juanperez"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </TextField>

          <TextField isRequired>
            <Label>Correo electrónico</Label>
            <Input
              placeholder="tu@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </TextField>

          <TextField isRequired>
            <Label>Número de celular</Label>
            <Input
              placeholder="809-555-1234"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </TextField>

          <Button
            variant="primary"
            onPress={handleSubmit}
            isDisabled={!isValid || isLoading}
            className="mt-4"
          >
            <Button.Label>
              {isLoading ? "Creando sesión..." : "Comenzar"}
            </Button.Label>
          </Button>
        </View>

        <Text className="text-xs text-muted text-center mt-8 px-4">
          No se requiere contraseña. Tu sesión se guardará localmente en este
          dispositivo.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
