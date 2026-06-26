export const ORDERS = [
  {
    id: "KG-8924",
    date: "Oct 24, 2023",
    status: "DELIVERED",
    items: [
      {
        id: "p1",
        title: "Nike Air Max & Premium",
        price: 145.0,
        image: require("@/assets/images/logo1.png"),
      },
      {
        id: "p2",
        title: "Coffee Pack",
        price: 100.0,
        image: require("@/assets/images/logo1.png"),
      },
    ],
    total: 245.0,
  },
  {
    id: "KG-9102",
    date: "Nov 02, 2023",
    status: "PROCESSING",
    items: [
      {
        id: "p3",
        title: "Apple Watch Series 6",
        price: 399.0,
        image: require("@/assets/images/logo1.png"),
      },
    ],
    total: 399.0,
  },
  {
    id: "KG-9055",
    date: "Oct 28, 2023",
    status: "SHIPPED",
    items: [
      {
        id: "p4",
        title: "Artisan Coffee",
        price: 45.5,
        image: require("@/assets/images/logo1.png"),
      },
    ],
    total: 45.5,
  },
];

// Add an order to the in-memory orders list (used by demo/demo data).
// This is intentionally simple: it prepends the order so newest appear first.
export function addOrder(order: any) {
  ORDERS.unshift(order);
}
