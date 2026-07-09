/**
 * Review Status Helper Module
 * 
 * Manages the document submission and review lifecycle for Business and Supplier entities.
 * 
 * Status machine:
 * draft → pending → approved
 *            ↓  ↑
 *          modify (admin requested changes; owner resubmits back to pending)
 *            ↓
 *         rejected (terminal)
 */

export type ReviewStatus = "draft" | "pending" | "approved" | "modify" | "rejected";
export type VerificationStatus = "pending" | "verified" | "rejected";

export interface ReviewState {
  status: ReviewStatus;
  reason: string | null;
  entityType: "business" | "supplier" | "agent";
  entityId: number | string;
}

export interface VerificationState {
  status: VerificationStatus;
  reason: string | null;
  entityType: "agent";
  entityId: number | string;
}

/**
 * Check if an entity can be edited directly (not through resubmit endpoint)
 */
export function canDirectEdit(status: ReviewStatus): boolean {
  return status === "draft";
}

/**
 * Check if an entity needs to use the resubmit endpoint
 */
export function needsResubmit(status: ReviewStatus): boolean {
  return status === "modify";
}

/**
 * Check if an entity is in a final state (cannot be changed)
 */
export function isFinalState(status: ReviewStatus): boolean {
  return status === "approved" || status === "rejected";
}

/**
 * Check if an entity is awaiting admin action
 */
export function isAwaitingReview(status: ReviewStatus): boolean {
  return status === "pending";
}

/**
 * Get a user-friendly status message
 */
export function getStatusMessage(status: ReviewStatus, entityType: string = "application"): string {
  switch (status) {
    case "draft":
      return `Your ${entityType} is not yet submitted. Complete it to submit for review.`;
    case "pending":
      return `Your ${entityType} is under review. We'll notify you once it's been processed.`;
    case "approved":
      return `Your ${entityType} has been approved! You can now proceed.`;
    case "modify":
      return `Changes have been requested for your ${entityType}. Please review the feedback and resubmit.`;
    case "rejected":
      return `Your ${entityType} was rejected. Please see the reason below.`;
    default:
      return `Status: ${status}`;
  }
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: ReviewStatus): {
  icon: string;
  iconColor: string;
  bgColor: string;
} {
  switch (status) {
    case "draft":
      return {
        icon: "edit",
        iconColor: "#6b6b6b",
        bgColor: "#f5f5f5",
      };
    case "pending":
      return {
        icon: "hourglass-empty",
        iconColor: "#0a7ea4",
        bgColor: "#e3f2fd",
      };
    case "approved":
      return {
        icon: "check-circle",
        iconColor: "#2e7d32",
        bgColor: "#e8f5e9",
      };
    case "modify":
      return {
        icon: "error-outline",
        iconColor: "#f57c00",
        bgColor: "#fff3e0",
      };
    case "rejected":
      return {
        icon: "cancel",
        iconColor: "#b00020",
        bgColor: "#ffebee",
      };
    default:
      return {
        icon: "help-outline",
        iconColor: "#6b6b6b",
        bgColor: "#f5f5f5",
      };
  }
}

/**
 * Extract review status from API response
 */
export function extractReviewStatus(
  data: any,
  entityType: "business" | "supplier" | "agent" = "business"
): ReviewState | null {
  if (!data) return null;

  // Handle different response structures
  const entity = data.data ?? data;
  
  const status = entity.review_status as ReviewStatus;
  const reason = entity.review_reason ?? null;
  const entityId = entity.id;

  if (!status || !entityId) return null;

  return {
    status,
    reason,
    entityType,
    entityId,
  };
}

/**
 * Extract verification status from agent response
 */
export function extractVerificationStatus(data: any): VerificationState | null {
  if (!data) return null;

  const entity = data.data ?? data;
  
  const status = entity.verification_status as VerificationStatus;
  const reason = entity.rejection_reason ?? null;
  const entityId = entity.id;

  if (!status || !entityId) return null;

  return {
    status,
    reason,
    entityType: "agent",
    entityId,
  };
}
