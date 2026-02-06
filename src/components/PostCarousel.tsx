import React, { useRef, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  Dimensions,
  FlatList,
  ViewToken,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface PostCarouselProps {
  imageUrls: Array<string | null>;
  height?: number;
  onDoubleTap?: () => void;
}

const ZoomableImage = memo(function ZoomableImage({
  url,
  height,
  onDoubleTap,
}: {
  url: string | null;
  height: number;
  onDoubleTap?: () => void;
}) {
  const imageScale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Heart overlay animation
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const fireDoubleTap = useCallback(() => {
    onDoubleTap?.();
  }, [onDoubleTap]);

  // Pinch to zoom (2 fingers only)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      imageScale.value = savedScale.value * e.scale;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onEnd(() => {
      if (imageScale.value < 1) {
        imageScale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
      } else if (imageScale.value > 3) {
        imageScale.value = withSpring(3);
        savedScale.value = 3;
      } else {
        savedScale.value = imageScale.value;
      }
    });

  // Pan with 2 fingers while zoomed
  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      }
    })
    .onEnd(() => {
      if (savedScale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  // Double tap to like
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      // Show heart overlay
      heartScale.value = withSequence(
        withSpring(1.2, { damping: 4, stiffness: 300 }),
        withDelay(400, withTiming(0, { duration: 200 }))
      );
      heartOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(400, withTiming(0, { duration: 200 }))
      );

      // Reset zoom on double tap if zoomed
      if (savedScale.value > 1) {
        imageScale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
      }

      runOnJS(triggerHaptic)();
      runOnJS(fireDoubleTap)();
    });

  const composed = Gesture.Simultaneous(
    pinchGesture,
    panGesture
  );
  const finalGesture = Gesture.Exclusive(doubleTapGesture, composed);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: imageScale.value },
    ],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  if (!url) {
    return (
      <View
        className="flex-1 items-center justify-center bg-default"
        style={{ width: SCREEN_WIDTH, height }}
      >
        <Text className="text-muted">Imagen no disponible</Text>
      </View>
    );
  }

  return (
    <GestureDetector gesture={finalGesture}>
      <Animated.View style={{ width: SCREEN_WIDTH, height, overflow: "hidden" }}>
        <Animated.View style={[{ width: SCREEN_WIDTH, height }, animatedImageStyle]}>
          <Image
            source={{ uri: url }}
            style={{ width: SCREEN_WIDTH, height }}
            contentFit="cover"
            transition={200}
          />
        </Animated.View>
        {/* Heart overlay */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
            },
            heartAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          <Ionicons name="heart" size={80} color="white" />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

export default function PostCarousel({
  imageUrls,
  height = SCREEN_WIDTH,
  onDoubleTap,
}: PostCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  if (imageUrls.length === 1) {
    return <ZoomableImage url={imageUrls[0]} height={height} onDoubleTap={onDoubleTap} />;
  }

  return (
    <View>
      <FlatList
        data={imageUrls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item }) => (
          <ZoomableImage url={item} height={height} onDoubleTap={onDoubleTap} />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      {/* Pagination dots */}
      <View className="flex-row justify-center items-center py-2 gap-1.5">
        {imageUrls.map((_, index) => (
          <View
            key={index}
            className={`rounded-full ${
              index === activeIndex
                ? "w-2 h-2 bg-accent"
                : "w-1.5 h-1.5 bg-muted"
            }`}
          />
        ))}
      </View>
    </View>
  );
}
