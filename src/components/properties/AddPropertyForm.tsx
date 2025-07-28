import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { toast } from "sonner"
import { supabase } from '../../lib/supabase';
import { useUser } from '../../hooks/useUser';
import ManualPropertyForm from './ManualPropertyForm';
import { populateInitialRatings } from '../../lib/ratingUtils';

const formSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  image_file: z.instanceof(File).optional(),
});

interface AddPropertyFormProps {
  onSuccess: () => void;
}

export default function AddPropertyForm({ onSuccess }: AddPropertyFormProps) {
  // const { toast } = useToast();
  const { user } = useUser();
  const [showManualForm, setShowManualForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
  try {
    // First, try to scrape the data from the URL
    const response = await fetch(`https://upeiqhxmbwrnsdiibkmx.supabase.co/functions/v1/scrape?url=${encodeURIComponent(values.url)}`);
    const data = await response.json();

    if (!response.ok) {
      toast.error('Please enter details manually.');
      setShowManualForm(true);
      return;
    }

    // Insert the new property WITHOUT the image URL to get an ID first
    const { data: newProperty, error: insertError } = await supabase
      .from('properties')
      .insert({
        url: values.url,
        image_url: '', // Leave empty for now
        price: data.price,
        description: data.description,
        location: data.location,
        bedrooms: data.bedrooms,
        date_on_sale: data.date_on_sale,
        estate_agent: data.estate_agent,
        reduced: data.reduced,
        views: data.views,
        gardens: data.gardens,
        outbuildings: data.outbuildings,
        condition: data.condition,
        features: data.features,
        added_by: user?.id,
      })
      .select('id')
      .single();

    // Correctly handle the insertion error
    if (insertError) {
      throw insertError;
    }

    const propertyId = newProperty.id;
    let imageUrl = data.image_url; // Use scraped image URL as a fallback

    // If the user uploaded a file, handle it now
    if (values.image_file) {
      const fileName = `${propertyId}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('property_images')
        .upload(fileName, values.image_file);

      if (uploadError) {
        toast.error(' Image Upload Error');
      } else {
        // If upload is successful, get the public URL
        imageUrl = `${supabase.storage.from('property_images').getPublicUrl(fileName).data.publicUrl}?resize=300x200`;
      }
    }

    // Now, update the property with the final image URL
    if (imageUrl) {
        await supabase
            .from('properties')
            .update({ image_url: imageUrl })
            .eq('id', propertyId);
    }

    // Populate initial ratings for Primary Users
    const { data: primaryUsers } = await supabase.from('users').select('id').eq('role', 'primary');
    for (const primaryUser of primaryUsers || []) {
      await populateInitialRatings(propertyId, primaryUser.id);
    }

    toast.success('Property added successfully!');
    onSuccess();
    form.reset();
  } catch (error: any) {
    toast.error('Failed to add property. Please check the URL or try again.');
    setShowManualForm(true);
  }
}

  // async function onSubmit(values: z.infer<typeof formSchema>) {
  //   try {
  //     let imageUrl = '';
  //     if (values.image_file) {
  //       const fileName = `${propertyId}_${Date.now()}.jpg`;
  //       const { error: uploadError } = await supabase.storage
  //         .from('property_images')
  //         .upload(fileName, values.image_file);
  //       if (uploadError) throw uploadError;
  //       imageUrl = `${supabase.storage.from('property_images').getPublicUrl(fileName).data.publicUrl}?resize=300x200`;
  //     }

  //     const response = await fetch(`/api/scrape?url=${encodeURIComponent(values.url)}`);
  //     const data = await response.json();
  //     if (!response.ok) {
  //       toast.error('Please enter details manually.');
  //       setShowManualForm(true);
  //       return;
  //     }

  //     const { data: propertyId, error: insertError } = await supabase
  //       .from('properties')
  //       .insert({
  //         url: values.url,
  //         image_url: imageUrl || data.image_url,
  //         price: data.price,
  //         description: data.description,
  //         location: data.location,
  //         bedrooms: data.bedrooms,
  //         date_on_sale: data.date_on_sale,
  //         estate_agent: data.estate_agent,
  //         reduced: data.reduced,
  //         views: data.views,
  //         gardens: data.gardens,
  //         outbuildings: data.outbuildings,
  //         condition: data.condition,
  //         features: data.features,
  //         added_by: user?.id,
  //       })
  //       .select('id')
  //       .single();

  //     if (insertError) throw insertError('Failed to insert property');

  //     // Populate initial ratings for Primary Users
  //     const primaryUsers = await supabase.from('users').select('id').eq('role', 'primary');
  //     for (const primaryUser of primaryUsers.data || []) {
  //       await populateInitialRatings(propertyId.id, primaryUser.id);
  //     }

  //     toast.success('Property added successfully!');
  //     onSuccess();
  //     form.reset();
  //   } catch (error) {
  //     toast.error('Failed to add property. Please check the URL or try again.');
  //     setShowManualForm(true);
  //   }
  // }

  if (showManualForm) {
    return <ManualPropertyForm onSuccess={onSuccess} />;
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
                <Input placeholder="https://www.zillow.com/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image_file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Image (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => field.onChange(e.target.files?.[0])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit">Add Property</Button>
          <Button type="button" variant="outline" onClick={() => setShowManualForm(true)}>
            Enter Manually
          </Button>
        </div>
      </form>
    </Form>
  );
}