import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button, TextArea, Label, TextField, Spinner, Dialog } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue, runOnJS } from "react-native-reanimated";
import { useSession } from "../../hooks/useSession";
import AppHeader from "../../components/AppHeader";
import {
  MAX_CAPTION_LENGTH,
  MAX_IMAGES_PER_POST,
  IMAGE_MAX_DIMENSION,
  IMAGE_COMPRESSION,
  PRIMARY_COLOR,
} from "../../lib/constants";
import { Id } from "../../../convex/_generated/dataModel";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CreateStep = "camera" | "preview" | "caption";

export default function CreateScreen() {
  const router = useRouter();
  const { session, userId } = useSession();
  const [permission, requestPermission] = useCameraPermissions();

  // Camera state
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [zoom, setZoom] = useState(0);
  const savedZoom = useSharedValue(0);
  const currentZoom = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newZoom = Math.min(1, Math.max(0, savedZoom.value + (e.scale - 1) * 0.5));
      currentZoom.value = newZoom;
      runOnJS(setZoom)(newZoom);
    })
    .onEnd(() => {
      savedZoom.value = currentZoom.value;
    });

  // Photos tray
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);

  // Step management
  const [step, setStep] = useState<CreateStep>("camera");

  // Caption
  const [caption, setCaption] = useState("");

  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<Id<"posts"> | null>(null);

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);
  const requestEmail = useAction(api.emailActions.requestPostPhotosEmail);

  // ─── Permission handling ───
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8 gap-4">
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
        <Text className="text-lg font-semibold text-foreground text-center">
          Se necesita acceso a la cámara
        </Text>
        <Text className="text-sm text-muted text-center">
          Para crear publicaciones necesitas permitir el acceso a la cámara.
        </Text>
        <Button variant="primary" onPress={requestPermission}>
          <Button.Label>Permitir Cámara</Button.Label>
        </Button>
      </View>
    );
  }

  // ─── Take photo ───
  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });
      if (photo?.uri) {
        setCurrentPreview(photo.uri);
        setStep("preview");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo tomar la foto. Intenta de nuevo.");
    }
  };

  // ─── Process & add photo ───
  const addPhotoToTray = async () => {
    if (!currentPreview) return;
    if (photos.length >= MAX_IMAGES_PER_POST) {
      Alert.alert("Límite", `Máximo ${MAX_IMAGES_PER_POST} fotos por publicación.`);
      return;
    }

    try {
      // Resize to 1080px max dimension, JPEG compression
      const manipulated = await ImageManipulator.manipulateAsync(
        currentPreview,
        [{ resize: { width: IMAGE_MAX_DIMENSION } }],
        {
          compress: IMAGE_COMPRESSION,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setPhotos((prev) => [...prev, manipulated.uri]);
      setCurrentPreview(null);
      setStep("camera");
    } catch (error) {
      Alert.alert("Error", "No se pudo procesar la foto.");
    }
  };

  // ─── Retake photo ───
  const retakePhoto = () => {
    setCurrentPreview(null);
    setStep("camera");
  };

  // ─── Remove photo from tray ───
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Publish ───
  const handlePublish = async () => {
    if (!userId || photos.length === 0) return;
    setIsPublishing(true);

    try {
      // Upload all photos
      const fileIds: Id<"_storage">[] = [];
      for (const photoUri of photos) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(photoUri);
        const blob = await response.blob();

        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: blob,
        });

        const { storageId } = await uploadResult.json();
        fileIds.push(storageId as Id<"_storage">);
      }

      // Create the post
      const postId = await createPost({
        authorUserId: userId,
        caption: caption.trim(),
        imageFileIds: fileIds,
      });

      setPublishedPostId(postId);
      setShowEmailDialog(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo publicar. Intenta de nuevo.");
    } finally {
      setIsPublishing(false);
    }
  };

  // ─── Send email ───
  const handleSendEmail = async () => {
    if (!publishedPostId || !session) return;
    setIsSendingEmail(true);

    try {
      await requestEmail({
        postId: publishedPostId,
        toEmail: session.email,
        username: session.username,
        caption: caption.trim(),
      });
      Alert.alert("✉️ Enviado", "Las fotos fueron enviadas a tu correo.");
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el email. Intenta de nuevo.");
    } finally {
      setIsSendingEmail(false);
      resetAndGoHome();
    }
  };

  const resetAndGoHome = () => {
    setPhotos([]);
    setCaption("");
    setCurrentPreview(null);
    setStep("camera");
    setShowEmailDialog(false);
    setPublishedPostId(null);
    router.replace("/(tabs)/feed");
  };

  // ─── Render: Camera step ───
  if (step === "camera") {
    return (
      <View className="flex-1 bg-black">
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
            flash={flash}
            zoom={zoom}
          />
          {/* Gesture overlay for pinch-to-zoom (absolute positioned over CameraView) */}
          <GestureDetector gesture={pinchGesture}>
            <View
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              collapsable={false}
            />
          </GestureDetector>
          {/* Top controls */}
          <View
            className="flex-row justify-between items-center px-4"
            style={{ position: "absolute", top: 56, left: 0, right: 0 }}
          >
            <Pressable
              onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
            >
              <Ionicons
                name={flash === "on" ? "flash" : "flash-off"}
                size={22}
                color="white"
              />
            </Pressable>
            <Pressable
              onPress={() =>
                setFacing((f) => (f === "back" ? "front" : "back"))
              }
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
            >
              <Ionicons name="camera-reverse" size={22} color="white" />
            </Pressable>
          </View>
          {/* Zoom indicator */}
          {zoom > 0.01 && (
            <View
              style={{
                position: "absolute",
                bottom: 12,
                alignSelf: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>
                {(1 + zoom * 9).toFixed(1)}x
              </Text>
            </View>
          )}
        </View>

        {/* Bottom area */}
        <View className="bg-black px-4 pb-28 pt-4">
          {/* Photo tray */}
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              {photos.map((uri, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri }}
                    style={{ width: 56, height: 56, borderRadius: 8 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 items-center justify-center"
                  >
                    <Ionicons name="close" size={12} color="white" />
                  </Pressable>
                </View>
              ))}
              <View className="w-14 h-14 rounded-lg border border-white/30 items-center justify-center">
                <Text className="text-white/60 text-xs">
                  {photos.length}/{MAX_IMAGES_PER_POST}
                </Text>
              </View>
            </ScrollView>
          ) : null}

          <View className="flex-row items-center justify-center gap-6">
            {photos.length > 0 ? <View className="w-24" /> : null}

            {/* Shutter button */}
            <Pressable onPress={takePhoto}>
              <View className="w-20 h-20 rounded-full border-4 border-white items-center justify-center">
                <View className="w-16 h-16 rounded-full bg-white" />
              </View>
            </Pressable>

            {/* Next step button (if photos exist) */}
            {photos.length > 0 ? (
              <Pressable
                onPress={() => setStep("caption")}
                className="px-6 py-3 bg-white/20 rounded-full"
              >
                <Text className="text-white font-semibold">
                  Siguiente →
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  // ─── Render: Preview step ───
  if (step === "preview" && currentPreview) {
    return (
      <View className="flex-1 bg-black">
        <Image
          source={{ uri: currentPreview }}
          style={{ flex: 1 }}
          contentFit="contain"
        />
        <View className="flex-row justify-between px-8 pb-28 pt-4 bg-black">
          <Pressable
            onPress={retakePhoto}
            className="px-6 py-3 bg-white/20 rounded-full"
          >
            <Text className="text-white font-semibold">Repetir</Text>
          </Pressable>
          <Pressable
            onPress={addPhotoToTray}
            className="px-6 py-3 rounded-full"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Text className="text-white font-semibold">Usar Foto</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Render: Caption step ───
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppHeader />
      <ScrollView
        contentContainerClassName="px-4 py-6 pb-28 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos preview */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {photos.map((uri, index) => (
            <View key={index} className="relative">
              <Image
                source={{ uri }}
                style={{
                  width: SCREEN_WIDTH * 0.4,
                  height: SCREEN_WIDTH * 0.4,
                  borderRadius: 12,
                }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
              >
                <Ionicons name="close" size={14} color="white" />
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <Text className="text-sm text-muted">
          {photos.length} foto{photos.length !== 1 ? "s" : ""} seleccionada
          {photos.length !== 1 ? "s" : ""}
        </Text>

        {/* Add more photos button */}
        {photos.length < MAX_IMAGES_PER_POST ? (
          <Pressable
            onPress={() => setStep("camera")}
            className="flex-row items-center gap-2"
          >
            <Ionicons name="add-circle-outline" size={20} color={PRIMARY_COLOR} />
            <Text style={{ color: PRIMARY_COLOR }} className="text-sm font-medium">
              Agregar más fotos
            </Text>
          </Pressable>
        ) : null}

        {/* Caption */}
        <TextField>
          <Label>Descripción</Label>
          <TextArea
            placeholder="Escribe una descripción para tu publicación..."
            value={caption}
            onChangeText={(text) => {
              if (text.length <= MAX_CAPTION_LENGTH) setCaption(text);
            }}
            className="min-h-[100]"
          />
          <Text className="text-xs text-muted text-right mt-1">
            {caption.length}/{MAX_CAPTION_LENGTH}
          </Text>
        </TextField>

        {/* Publish button */}
        <Button
          variant="primary"
          onPress={handlePublish}
          isDisabled={photos.length === 0 || isPublishing}
          className="mt-2"
        >
          {isPublishing ? (
            <Spinner size="sm" color="white" />
          ) : (
            <Button.Label>Publicar</Button.Label>
          )}
        </Button>
      </ScrollView>

      {/* Email Dialog */}
      <Dialog isOpen={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <View className="gap-4">
              <Dialog.Title>📸 ¡Publicación Creada!</Dialog.Title>
              <Dialog.Description>
                ¿Quieres recibir estas fotos por correo electrónico a{" "}
                {session?.email}?
              </Dialog.Description>
              <View className="flex-row justify-end gap-3 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={resetAndGoHome}
                  isDisabled={isSendingEmail}
                >
                  <Button.Label>No, gracias</Button.Label>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={handleSendEmail}
                  isDisabled={isSendingEmail}
                >
                  {isSendingEmail ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <Button.Label>Sí, enviar</Button.Label>
                  )}
                </Button>
              </View>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </KeyboardAvoidingView>
  );
}
