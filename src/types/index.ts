export interface User {
  id: string;
  email?: string;
  role: 'power' | 'primary' | 'secondary';
}

export interface Property {
  id: string;
  url: string;
  image_url: string;
  price: number;
  description: string;
  location: string;
  bedrooms: number;
  date_on_sale: string;
  estate_agent: string;
  reduced: boolean;
  views: boolean;
  gardens: boolean;
  outbuildings: boolean;
  condition: string;
  features: string[];
  added_by: string;
  added_by_email?: string;
  feedback: UserFeedback[];
  combined_score?: number;
  ratings?: UserPropertyRating[];
}

export interface UserFeedback {
  id: string;
  user_id: string;
  user_email?: string;
  property_id: string;
  vote?: 'up' | 'down';
  notes?: string;
  created_at: string;
}

export interface UserPriority {
  id: string;
  user_id: string;
  name: string;
  weight: number;
  created_at: string;
}

export interface UserRating {
  id: string;
  user_id: string;
  name: string;
  category: 'must_have' | 'nice_to_have' | 'would_like' | 'not_important';
  points: number;
}

export interface UserPropertyRating {
  id: string;
  user_id: string;
  property_id: string;
  rating_id: string;
  score: number;
  created_at: string;
}