import React from "react";
import { StyleSheet, View, TextInput, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
}

export function SearchBar({
  placeholder = "Search products, categories",
  value,
  onChangeText,
  showFilterButton = true,
  onFilterPress,
}: SearchBarProps) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInput}>
        <MaterialIcons name="search" size={28} color="#5A413D" />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#000000"
          style={styles.searchText}
          value={value}
          onChangeText={onChangeText}
          accessible
          accessibilityLabel="Search"
        />
      </View>
      {showFilterButton && (
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onFilterPress}
          accessibilityLabel="Filters"
        >
          <MaterialIcons name="tune" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
    height: 44,
    backgroundColor: "#e3e2e1",
    borderRadius: 28,
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingRight: 64,
    height: 56,
  },
  searchText: { marginLeft: 8, flex: 1, color: "#333", fontSize: 15 },
  filterButton: {
    position: "absolute",
    right: 12,
    top: 7,
    backgroundColor: "#8a1d1d",
    height: 30,
    width: 30,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
});