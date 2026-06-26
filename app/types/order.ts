/**
 * Order Types aligned with DSCF Marketplace Orders API
 * Includes Sprint 2 fields for validation and source tracking
 */

export type OrderStatus =
  | "pending"
  | "validating"
  | "splitting"
  | "waiting_supplier_confirmation"
  | "waiting_retailer_confirmation"
  | "confirmed"
  | "processing"
  | "completed"
  | "cancelled";

export type ValidationStatus =
  | "validated"
  | "no_longer_listed"
  | "price_changed"
  | "low_quantity";

export type OrderType = "rfq_based" | "direct_listing";
export type FulfillmentType = "delivery" | "self_pickup";
export type PaymentMethod = "cash" | "credit" | "transfer";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  unit_id: number;
  quantity: string | number;
  unit_price: string | number;
  status: string;
  subtotal?: string | number;
  product_name?: string;
  unit_name?: string;
  thumbnail_url?: string;
  images_urls?: string[];

  // Sprint 2: Validation fields
  validation_status?: ValidationStatus;
  validation_note?: string;
  resolved_unit_price?: number;
  resolved_quantity?: number;
  source_type?: string;
  source_id?: number;
  source_name?: string;
}

export interface Order {
  id: number;
  quotation_id?: number | null;
  listing_id?: number | null;
  user_id: number;
  ordered_by_id: number;
  ordered_to_id?: number;
  delivery_order_id?: number | null;
  dropoff_address_id?: number | null;
  order_type: OrderType;
  status: OrderStatus;
  fulfillment_type: FulfillmentType;
  payment_method: PaymentMethod;
  total_amount: string | number;
  buyer_phone?: string;
  buyer_email?: string;
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];

  // Sprint 2: Workflow and validation fields
  workflow_status?: OrderStatus;
  has_validation_issues?: boolean;
}

export interface CreateOrderPayload {
  quotation_id?: number | null;
  listing_id?: number | null;
  user_id?: number;
  ordered_by_id?: number;
  ordered_to_id?: number;
  delivery_order_id?: number | null;
  dropoff_address_id?: number | null;
  order_type: OrderType;
  status?: OrderStatus;
  fulfillment_type: FulfillmentType;
  payment_method: PaymentMethod;
  order_items_attributes: Array<{
    quotation_item_id?: number;
    listing_id?: number | null;
    product_id?: number;
    unit_id?: number;
    quantity: number;
    unit_price?: number;
    status?: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: string | string[];
  pagination?: {
    current_page: number;
    per_page: number;
    count: number;
    total_count: number;
    total_pages: number;
    links: {
      first: string;
      prev: string | null;
      next: string | null;
      last: string;
    };
  };
}
