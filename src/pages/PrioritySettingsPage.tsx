import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from "sonner"
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { UserPriority, UserRating } from '../types';

const prioritySchema = z.object({
  name: z.string().min(1, 'Priority name is required').max(50, 'Priority name must be 50 characters or less'),
  weight: z.number().min(1, 'Weight must be between 1 and 10').max(10, 'Weight must be between 1 and 10'),
});

const ratingSchema = z.object({
  name: z.string().min(1, 'Rating name is required').max(50, 'Rating name must be 50 characters or less'),
  category: z.enum(['must_have', 'nice_to_have', 'would_like', 'not_important']),
});

export default function PrioritySettingsPage() {
  const { user } = useUser();
  // const { toast } = useToast();
  const [priorities, setPriorities] = useState<UserPriority[]>([]);
  const [ratings, setRatings] = useState<UserRating[]>([]);

  const priorityForm = useForm<z.infer<typeof prioritySchema>>({
    resolver: zodResolver(prioritySchema),
    defaultValues: { name: '', weight: 1 },
  });

  const ratingForm = useForm<z.infer<typeof ratingSchema>>({
    resolver: zodResolver(ratingSchema),
    defaultValues: { name: '', category: 'not_important' },
  });

  useEffect(() => {
    if (user?.role !== 'primary') return;
    fetchPriorities();
    fetchRatings();
  }, [user]);

  async function fetchPriorities() {
    const { data, error } = await supabase
      .from('user_priorities')
      .select('*')
      .eq('user_id', user?.id);
    if (error) {
      toast.error('Failed to fetch priorities.');
    } else {
      setPriorities(data);
    }
  }

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

  async function handlePrioritySubmit(values: z.infer<typeof prioritySchema>) {
    if (priorities.length >= 10) {
      toast.error('Maximum 10 priorities allowed.');
      return;
    }
    const { error } = await supabase.from('user_priorities').insert({
      user_id: user?.id,
      name: values.name,
      weight: values.weight,
    });
    if (error) {
      toast.error('Failed to add priority.');
    } else {
      toast.success('Priority added successfully!');
      fetchPriorities();
      priorityForm.reset();
    }
  }

  async function handleRatingSubmit(values: z.infer<typeof ratingSchema>) {
    if (ratings.length >= 5) {
      toast.error('Maximum 5 ratings allowed.');
      return;
    }
    const { error } = await supabase.from('user_ratings').insert({
      user_id: user?.id,
      name: values.name,
      category: values.category,
    });
    if (error) {
      toast.error('Failed to add rating.');
    } else {
      toast.success('Rating added successfully!');
      fetchRatings();
      ratingForm.reset();
    }
  }

  async function handleDeletePriority(id: string) {
    const { error } = await supabase.from('user_priorities').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete priority.');
    } else {
      toast.success('Priority deleted successfully!');
      fetchPriorities();
    }
  }

  if (user?.role !== 'primary') {
    return <div className="container mx-auto p-4">Access denied. Primary users only.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Priority & Rating Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Add Priority</h2>
          <Form {...priorityForm}>
            <form onSubmit={priorityForm.handleSubmit(handlePrioritySubmit)} className="space-y-4">
              <FormField
                control={priorityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kitchen Quality" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={priorityForm.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (1-10)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Priority</Button>
            </form>
          </Form>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorities.map((priority) => (
                <TableRow key={priority.id}>
                  <TableCell>{priority.name}</TableCell>
                  <TableCell>{priority.weight}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Delete</DialogTitle>
                        </DialogHeader>
                        <p>Are you sure you want to delete this priority?</p>
                        <Button onClick={() => handleDeletePriority(priority.id)}>Confirm</Button>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Add Rating</h2>
          <Form {...ratingForm}>
            <form onSubmit={ratingForm.handleSubmit(handleRatingSubmit)} className="space-y-4">
              <FormField
                control={ratingForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kitchen Quality" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ratingForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full p-2 border rounded">
                        <option value="must_have">Must Have (10 points)</option>
                        <option value="nice_to_have">Nice to Have (5 points)</option>
                        <option value="would_like">Would Like (2 points)</option>
                        <option value="not_important">Not Important (0 points)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Rating</Button>
            </form>
          </Form>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratings.map((rating) => (
                <TableRow key={rating.id}>
                  <TableCell>{rating.name}</TableCell>
                  <TableCell>{rating.category.replace('_', ' ')}</TableCell>
                  <TableCell>{rating.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}