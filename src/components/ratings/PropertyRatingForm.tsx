import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { toast } from "sonner"
import { supabase } from '../../lib/supabase';
import { useUser } from '../../hooks/useUser';
import { Property, UserRating } from '../../types';

const ratingSchema = z.object({
  rating_id: z.string().uuid(),
  score: z.number().min(0, 'Score must be between 0 and 100').max(100, 'Score must be between 0 and 100'),
});

interface PropertyRatingFormProps {
  property: Property;
}

export default function PropertyRatingForm({ property }: PropertyRatingFormProps) {
  const { user } = useUser();
  // const { toast } = useToast();
  const [ratings, setRatings] = useState<UserRating[]>([]);

  const form = useForm<z.infer<typeof ratingSchema>>({
    resolver: zodResolver(ratingSchema),
    defaultValues: { rating_id: '', score: 0 },
  });

  useEffect(() => {
    if (user?.role !== 'primary') return;
    fetchRatings();
  }, [user]);

  async function fetchRatings() {
    const { data, error } = await supabase
      .from('user_ratings')
      .select('*')
      .eq('user_id', user?.id);
    if (error) {
      toast.error('Failed to fetch ratings.');
    } else {
      setRatings(data);
    }
  }

  async function onSubmit(values: z.infer<typeof ratingSchema>) {
    const { error } = await supabase.from('user_property_ratings').upsert({
      user_id: user?.id,
      property_id: property.id,
      rating_id: values.rating_id,
      score: values.score,
    });
    if (error) {
      toast.error('Failed to submit rating.');
    } else {
      toast.success('Rating submitted successfully!');
      form.reset();
    }
  }

  if (user?.role !== 'primary') return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="rating_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <select {...field} className="w-full p-2 border rounded">
                  <option value="">Select a rating</option>
                  {ratings.map((rating) => (
                    <option key={rating.id} value={rating.id}>
                      {rating.name} ({rating.category.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Score (0-100)</FormLabel>
              <FormControl>
                <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit Rating</Button>
      </form>
    </Form>
  );
}