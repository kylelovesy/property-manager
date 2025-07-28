import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { toast } from "sonner"
import { supabase } from '../../lib/supabase';
import { useUser } from '../../hooks/useUser';

const manualPropertySchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  price: z.number().min(0, 'Price must be non-negative'),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be 100 characters or less'),
  bedrooms: z.number().min(0, 'Bedrooms must be non-negative'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  date_on_sale: z.string().optional(),
  estate_agent: z.string().max(100, 'Estate agent must be 100 characters or less').optional(),
  reduced: z.boolean().default(false),
  views: z.boolean().default(false),
  gardens: z.boolean().default(false),
  outbuildings: z.boolean().default(false),
  condition: z.string().max(50, 'Condition must be 50 characters or less').optional(),
  features: z.string().optional(),
});

interface ManualPropertyFormProps {
  onSuccess: () => void;
}

export default function ManualPropertyForm({ onSuccess }: ManualPropertyFormProps) {
  // const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<z.infer<typeof manualPropertySchema>>({
    resolver: zodResolver(manualPropertySchema),
    defaultValues: {
      url: '',
      price: 0,
      location: '',
      bedrooms: 0,
      description: '',
      date_on_sale: '',
      estate_agent: '',
      reduced: false,
      views: false,
      gardens: false,
      outbuildings: false,
      condition: '',
      features: '',
    },
  });

  async function onSubmit(values: z.infer<typeof manualPropertySchema>) {
    try {
      const { error } = await supabase.from('properties').insert({
        url: values.url,
        price: values.price,
        location: values.location,
        bedrooms: values.bedrooms,
        description: values.description,
        date_on_sale: values.date_on_sale || null,
        estate_agent: values.estate_agent,
        reduced: values.reduced,
        views: values.views,
        gardens: values.gardens,
        outbuildings: values.outbuildings,
        condition: values.condition,
        features: values.features ? values.features.split(',').map((f) => f.trim()) : [],
        added_by: user?.id,
      });
      if (error) throw error;
      toast.success('Property added successfully!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to add property. Please try again.');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property URL</FormLabel>
              <FormControl>
                <Input placeholder="https://www.example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bedrooms</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date_on_sale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date on Sale</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="estate_agent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estate Agent</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="reduced"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reduced</FormLabel>
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="views"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Views</FormLabel>
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gardens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gardens</FormLabel>
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="outbuildings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outbuildings</FormLabel>
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condition</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Good" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Fireplace, Garage" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Add Property</Button>
      </form>
    </Form>
  );
}