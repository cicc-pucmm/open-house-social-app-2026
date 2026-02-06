import React from "react";
import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PRIMARY_COLOR } from "../../lib/constants";

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={PRIMARY_COLOR}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="feed">
        <Label>Inicio</Label>
        <Icon
          sf={{ default: "house", selected: "house.fill" }}
          androidSrc={<VectorIcon family={Ionicons} name="home" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <Label>Crear</Label>
        <Icon
          sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
          androidSrc={<VectorIcon family={Ionicons} name="add-circle" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
