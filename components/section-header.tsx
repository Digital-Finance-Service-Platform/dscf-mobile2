import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: any;
}

export function SectionHeader({ title, actionText, onActionPress, style }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <ThemedText type="title">{title}</ThemedText>
      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress}>
          <ThemedText type="view">{actionText}</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
  },
});