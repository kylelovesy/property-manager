import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { toast } from "sonner"
import { supabase } from '../../lib/supabase';
import { useUser } from '../../hooks/useUser';

const featureSchema = z.object({
  feature: z.string().min(1, 'Feature name is required').max(50, 'Feature name must be 50 characters or less'),
});

interface FeatureInputProps {
  propertyId: string;
  onSuccess: () => void;
}

export default function FeatureInput({ propertyId, onSuccess }: FeatureInputProps) {
  // const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<z.infer<typeof featureSchema>>({
    resolver: zodResolver(featureSchema),
    defaultValues: { feature: '' },
  });

  async function onSubmit(values: z.infer<typeof featureSchema>) {
    try {
      const { data: existingFeatures, error: fetchError } = await supabase
        .from('property_features')
        .select('features')
        .eq('property_id', propertyId)
        .eq('added_by', user?.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const updatedFeatures = existingFeatures?.features
        ? [...existingFeatures.features, values.feature]
        : [values.feature];

      const { error } = await supabase
        .from('property_features')
        .upsert({
          property_id: propertyId,
          features: updatedFeatures,
          added_by: user?.id,
        });

      if (error) throw error;
      toast.success("Feature added successfully!")
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error('Failed to add feature.');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField
          control={form.control}
          name="feature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Add Feature</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Pool" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm">Add</Button>
      </form>
    </Form>
  );
}