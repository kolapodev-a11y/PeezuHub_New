export interface ListingUser {
  _id?: string;
  id?: string;
  name?: string;
  avatar?: string;
  role?: 'user' | 'admin' | string;
  email?: string;
  premiumStatus?: string;
  premiumExpiresAt?: string;
}

export interface ListingReview {
  _id?: string;
  user?: string;
  name: string;
  rating: number;
  comment: string;
}

export interface ListingContact {
  whatsapp?: string;
  email?: string;
  phone?: string;
}

export interface Listing {
  _id: string;
  title: string;
  category: string;
  description: string;
  state: string;
  city: string;
  locationLabel?: string;
  startingPrice: number;
  priceLabel: string;
  photos: string[];
  contact?: ListingContact;
  status?: 'pending' | 'approved' | 'rejected' | string;
  saleStatus?: 'available' | 'sold' | string;
  soldAt?: string | null;
  isFeatured?: boolean;
  isVerified?: boolean;
  featuredUntil?: string | null;
  premiumPaymentStatus?: 'unpaid' | 'pending' | 'paid' | string;
  averageRating?: number;
  reviewsCount?: number;
  reviews?: ListingReview[];
  user?: ListingUser;
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface StateCount {
  name: string;
  count: number;
}

export interface ListingMetaOptions {
  categories: CategoryCount[];
  states: StateCount[];
  disclaimer?: string;
}

export interface CategoryCard {
  name: string;
  icon?: string;
  count?: number;
}

export interface ListingEditorFormValues {
  title: string;
  category: string;
  description: string;
  state: string;
  city: string;
  locationLabel: string;
  startingPrice: number | string;
  priceLabel: string;
  whatsapp: string;
  email: string;
  phone: string;
}
