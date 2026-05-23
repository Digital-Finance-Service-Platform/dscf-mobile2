import React from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";

interface FilterChip {
  key: string;
  label: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  active: string;
  onSelect: (key: string) => void;
  style?: any;
}

export function FilterChips({ filters, active, onSelect, style }: FilterChipsProps) {
  return (
    <View style={[styles.chips, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            onPress={() => onSelect(filter.key)}
            style={[styles.chip, active === filter.key && styles.chipActive]}
          >
            <ThemedText
              type={active === filter.key ? "defaultSemiBold" : "default"}
              style={active === filter.key ? styles.chipTextActive : styles.chipText}
            >
              {filter.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    marginVertical: 6,
  },
  chipsContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  chip: {
    backgroundColor: "#f0eeea",
    borderWidth: 1,
    borderColor: "#e6e2dc",
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 18,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: "#D9E2FF",
    borderColor: "#D9E2FF",
  },
  chipText: { color: "#4a372d", fontSize: 14, lineHeight: 20 },
  chipTextActive: { color: "#071b4f", fontSize: 14, lineHeight: 20, fontWeight: "700" },
});