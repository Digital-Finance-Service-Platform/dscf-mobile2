import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { formatCurrency } from "@/lib/formatters";

interface OrderSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  showShipping?: boolean;
  shippingText?: string;
  compact?: boolean;
}

export function OrderSummary({
  subtotal,
  tax,
  total,
  showShipping = true,
  shippingText = "Calculated at checkout",
  compact = false,
}: OrderSummaryProps) {
  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <View style={compact ? styles.summaryRowCompact : styles.summaryRow}>
      <ThemedText type="default" lightColor="#6b6b6b">
        {label}
      </ThemedText>
      <ThemedText type="default" lightColor="#6b6b6b">
        {value}
      </ThemedText>
    </View>
  );

  const SummaryTotal = ({ label, value }: { label: string; value: string }) => (
    <View style={compact ? styles.summaryTotalCompact : styles.summaryTotal}>
      <ThemedText type={compact ? "defaultSemiBold" : "title"}>
        {label}
      </ThemedText>
      <ThemedText
        type={compact ? "defaultSemiBold" : "defaultSemiBold2"}
        lightColor="#8a1d1d"
      >
        {value}
      </ThemedText>
    </View>
  );

  return (
    <View style={compact ? styles.summaryMini : styles.summaryCard}>
      {!compact && (
        <ThemedText type="default" style={{ marginBottom: 8 }}>
          Order Summary
        </ThemedText>
      )}

      <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />

      {showShipping && <SummaryRow label="Shipping" value={shippingText} />}

      <SummaryRow label="Tax" value={formatCurrency(tax)} />

      <SummaryTotal label="Total" value={formatCurrency(total)} />
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryMini: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  summaryRowCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    alignItems: "center",
  },
  summaryTotalCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    alignItems: "center",
  },
});
