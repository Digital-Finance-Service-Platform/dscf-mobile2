import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";

type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_update";

export default function PendingApprovalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  const status = (Array.isArray(params.status) ? params.status[0] : params.status) as ApprovalStatus || "pending";
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;

  const roleTitle = role === "supplier" ? "Supplier" : "Agent";

  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return {
          icon: "check-circle" as const,
          iconColor: "#2e7d32",
          bgColor: "#e8f5e9",
          title: "Application Approved!",
          message:
            role === "agent"
              ? `Congratulations! Your agent application has been approved. Your Agent ID is: ${agentId || "AGT-" + Math.random().toString(36).substr(2, 9).toUpperCase()}`
              : "Congratulations! Your supplier application has been approved. You can now start listing products.",
        };
      case "rejected":
        return {
          icon: "cancel" as const,
          iconColor: "#b00020",
          bgColor: "#ffebee",
          title: "Application Rejected",
          message: reason || "Unfortunately, your application was not approved. Please review the requirements and try again.",
        };
      case "needs_update":
        return {
          icon: "error-outline" as const,
          iconColor: "#f57c00",
          bgColor: "#fff3e0",
          title: "Additional Information Required",
          message: reason || "We need some additional information to process your application. Please update your documents and resubmit.",
        };
      default:
        return {
          icon: "hourglass-empty" as const,
          iconColor: "#0a7ea4",
          bgColor: "#e3f2fd",
          title: "Waiting for Approval",
          message: `Your ${roleTitle.toLowerCase()} application is under review. We'll notify you once it's been processed.`,
        };
    }
  };

  const config = getStatusConfig();

  const renderActions = () => {
    if (status === "approved") {
      return (
        <>
          {role === "agent" && (
            <View style={styles.checklistBox}>
              <ThemedText type="defaultSemiBold" style={styles.checklistTitle}>
                Get Started Checklist
              </ThemedText>
              <ChecklistItem text="Onboard your first retailer" />
              <ChecklistItem text="Create order on behalf of retailer" />
              <ChecklistItem text="Track your commission" />
            </View>
          )}
          {role === "supplier" && (
            <View style={styles.checklistBox}>
              <ThemedText type="defaultSemiBold" style={styles.checklistTitle}>
                Next Steps
              </ThemedText>
              <ChecklistItem text="Request missing products" />
              <ChecklistItem text="Add your first product listing" />
              <ChecklistItem text="Set prices and quantities" />
            </View>
          )}
          <Pressable
            style={styles.continueButton}
            onPress={() => router.replace("/login")}
          >
            <ThemedText type="defaultSemiBold" style={styles.continueText}>
              Continue to Login
            </ThemedText>
          </Pressable>
        </>
      );
    }

    if (status === "needs_update") {
      return (
        <Pressable
          style={styles.continueButton}
          onPress={() => router.back()}
        >
          <ThemedText type="defaultSemiBold" style={styles.continueText}>
            Update Application
          </ThemedText>
        </Pressable>
      );
    }

    if (status === "rejected") {
      return (
        <Pressable
          style={styles.continueButton}
          onPress={() => router.replace("/onboarding/role")}
        >
          <ThemedText type="defaultSemiBold" style={styles.continueText}>
            Start New Application
          </ThemedText>
        </Pressable>
      );
    }

    return (
      <Pressable
        style={styles.backButton}
        onPress={() => router.replace("/welcome")}
      >
        <ThemedText type="default" style={styles.backText}>
          Back to Home
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <PageShell
      title={`${roleTitle} Application`}
      subtitle="Application Status"
      style={styles.shell}
    >
      <View style={styles.content}>
        <View style={[styles.statusCard, { backgroundColor: config.bgColor }]}>
          <MaterialIcons name={config.icon} size={80} color={config.iconColor} />
          <ThemedText type="defaultSemiBold" style={styles.statusTitle}>
            {config.title}
          </ThemedText>
          <ThemedText type="default" style={styles.statusMessage}>
            {config.message}
          </ThemedText>
        </View>

        {status === "pending" && (
          <View style={styles.timelineBox}>
            <ThemedText type="defaultSemiBold" style={styles.timelineTitle}>
              What happens next?
            </ThemedText>
            <TimelineItem
              icon="assignment"
              text="Application submitted"
              completed
            />
            <TimelineItem
              icon="search"
              text="Document verification in progress"
              active
            />
            <TimelineItem
              icon="approval"
              text="Admin approval pending"
            />
            <TimelineItem
              icon="notifications-active"
              text="You'll be notified via SMS"
            />
          </View>
        )}

        {renderActions()}
      </View>
    </PageShell>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <View style={styles.checklistItem}>
      <MaterialIcons name="radio-button-unchecked" size={18} color="#6b6b6b" />
      <ThemedText type="default" style={styles.checklistText}>
        {text}
      </ThemedText>
    </View>
  );
}

function TimelineItem({
  icon,
  text,
  completed,
  active,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
  completed?: boolean;
  active?: boolean;
}) {
  return (
    <View style={styles.timelineItem}>
      <View
        style={[
          styles.timelineIcon,
          completed && styles.timelineIconCompleted,
          active && styles.timelineIconActive,
        ]}
      >
        <MaterialIcons
          name={completed ? "check" : icon}
          size={20}
          color={completed ? "#fff" : active ? "#0a7ea4" : "#9a9a9a"}
        />
      </View>
      <ThemedText
        type="default"
        style={[
          styles.timelineText,
          (completed || active) && styles.timelineTextActive,
        ]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  content: { flex: 1 },
  statusCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 22,
    color: "#0a2f4a",
    marginTop: 16,
    textAlign: "center",
  },
  statusMessage: {
    fontSize: 15,
    color: "#55656d",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 22,
  },
  timelineBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.12)",
    marginBottom: 24,
  },
  timelineTitle: {
    fontSize: 16,
    color: "#0a2f4a",
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  timelineIconCompleted: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  timelineIconActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#0a7ea4",
  },
  timelineText: {
    marginLeft: 12,
    color: "#6b6b6b",
    flex: 1,
  },
  timelineTextActive: {
    color: "#0a2f4a",
    fontWeight: "500",
  },
  checklistBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.12)",
    marginBottom: 24,
  },
  checklistTitle: {
    fontSize: 16,
    color: "#0a2f4a",
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checklistText: {
    marginLeft: 10,
    color: "#6b6b6b",
  },
  continueButton: {
    backgroundColor: "#0a2f4a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  backText: {
    color: "#0a7ea4",
    fontSize: 16,
  },
});
