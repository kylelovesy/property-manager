import { supabase } from './supabase';
import { Property, UserPriority, UserRating } from '../types';

export async function populateInitialRatings(propertyId: string, userId: string) {
  try {
    // Fetch property features
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('features')
      .eq('id', propertyId)
      .single();

    if (propertyError) throw propertyError;

    // Fetch user priorities and ratings
    const { data: priorities, error: prioritiesError } = await supabase
      .from('user_priorities')
      .select('*')
      .eq('user_id', userId);

    const { data: ratings, error: ratingsError } = await supabase
      .from('user_ratings')
      .select('*')
      .eq('user_id', userId);

    if (prioritiesError || ratingsError) throw prioritiesError || ratingsError;

    // Calculate initial scores
    for (const rating of ratings) {
      let score = 0;
      const matchingPriority = priorities.find((p) => p.name.toLowerCase() === rating.name.toLowerCase());
      if (matchingPriority && property.features.some((f: string) => f.toLowerCase().includes(rating.name.toLowerCase()))) {
        score = matchingPriority.weight * rating.points;
      }

      await supabase.from('user_property_ratings').insert({
        user_id: userId,
        property_id: propertyId,
        rating_id: rating.id,
        score: Math.min(score, 100),
      });
    }
  } catch (error) {
    console.error('Failed to populate initial ratings:', error);
  }
}