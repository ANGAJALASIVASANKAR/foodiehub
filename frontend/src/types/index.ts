export interface User {
  id: number;
  fullName: string;
  email: string;
  mobile: string;
  roles: string[];
  enabled: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisine: string;
  address: string;
  city: string;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  rating: number;
  ratingCount: number;
  active: boolean;
  open: boolean;
  openingTime: string;
  closingTime: string;
  minOrderAmount: number;
  deliveryTimeMinutes: number;
  priceForTwo: number;
}

export interface RestaurantSummary {
  id: number;
  name: string;
  imageUrl: string | null;
  rating: number;
  deliveryTimeMinutes: number;
  minOrderAmount: number;
}

export interface RestaurantRequest {
  name: string;
  description: string;
  cuisineType: string;
  addressLine: string;
  city: string;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  minOrderAmount?: number;
  deliveryTimeMinutes?: number;
  priceForTwo?: number;
  openingTime?: string;
  closingTime?: string;
  active?: boolean;
  open?: boolean;
}

export interface Food {
  id: number;
  restaurantId: number;
  restaurantName: string | null;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  isBestseller: boolean;
  rating: number;
  ratingCount: number;
}

export interface FoodRequest {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isVeg?: boolean;
  isAvailable?: boolean;
  isBestseller?: boolean;
  categoryId: number;
}

export interface MenuSection {
  categoryId: number;
  name: string;
  items: Food[];
}

export interface CartItem {
  id: number;
  food: Food;
  quantity: number;
  itemTotal: number;
}

export interface Cart {
  id: number;
  restaurant: RestaurantSummary | null;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  itemCount: number;
  minOrderAmount: number;
}

export interface Address {
  id: number;
  label: string | null;
  fullName: string;
  phone: string;
  houseBuilding: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  instructions: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export interface AddressRequest {
  label?: string | null;
  fullName: string;
  phone: string;
  houseBuilding: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  instructions?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'COD' | 'RAZORPAY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'NOT_APPLICABLE';

export interface OrderItem {
  id: number;
  foodId: number | null;
  itemName: string;
  itemImage: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isVeg: boolean;
}

export interface Order {
  id: number;
  orderNumber: string;
  restaurant: RestaurantSummary;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  couponCode: string | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryInstructions: string | null;
  placedAt: string;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
}

export interface TrackingEvent {
  status: string;
  label: string;
  timestamp: string | null;
  done: boolean;
}

export interface DeliveryPartner {
  id: number;
  name: string;
  phone: string;
  vehicleType: string | null;
  rating: number | null;
}

export interface Tracking {
  order: Order;
  timeline: TrackingEvent[];
  deliveryPartner: DeliveryPartner | null;
  progressPercent: number;
  simulated: boolean;
  restaurantLatitude: number | null;
  restaurantLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationLabel: string | null;
}

export interface Coupon {
  id: number;
  code: string;
  title: string;
  description: string | null;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  imageUrl: string | null;
}

export interface GeoResult {
  label: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
}

export interface InspirationDish {
  name: string;
  imageUrl: string;
  category: string | null;
  area: string | null;
  instructions: string | null;
}

export interface RazorpayOrderResponse {
  orderId: number;
  orderNumber: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
}

export interface AdminDashboard {
  totalUsers: number;
  totalRestaurants: number;
  totalFoodItems: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  recentOrders: Order[];
}

export interface OwnerStats {
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalFoodItems: number;
  availableFoodItems: number;
  recentOrders: Order[];
}

export interface DeliveryOrder {
  order: Order;
  deliveryId: number | null;
  deliveryStatus: string | null;
  progressPercent: number;
  assignedToMe: boolean;
  pickupAddress: string;
  dropAddress: string;
}

export interface Review {
  id: number;
  userId: number;
  userName: string;
  restaurantId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ApiFieldError {
  [field: string]: string;
}
