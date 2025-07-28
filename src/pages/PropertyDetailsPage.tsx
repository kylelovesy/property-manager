import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { toast } from "sonner"
import { Property, UserFeedback } from '../types';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import PropertyRatingForm from '../components/ratings/PropertyRatingForm';
import FeatureInput from '../components/properties/FeatureInput';
import ScoreConflictResolver from '../components/ratings/ScoreConflictResolver';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import AuthGuard from '../components/auth/AuthGuard';

export default function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  // const { toast } = useToast();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProperty();

    const subscription = supabase
      .channel('property-details')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties', filter: `id=eq.${id}` }, () => fetchProperty())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_feedback', filter: `property_id=eq.${id}` }, () => fetchProperty())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  async function fetchProperty() {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        user_feedback (id, user_id, vote, notes, created_at, users(email)),
        property_scores (combined_score),
        property_features (features)
      `)
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to retrieve property details.');
      navigate('/');
    } else {
      setProperty({
        ...data,
        feedback: data.user_feedback.map((f: any) => ({ ...f, user_email: f.users.email })),
        combined_score: data.property_scores?.combined_score || 0,
        features: data.property_features?.features || data.features,
      });
      setFeedback(data.user_feedback.map((f: any) => ({ ...f, user_email: f.users.email })));
    }
  }

  async function handleDelete() {
    if (!id || user?.role !== 'primary') return;
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      toast.error('Failed to remove property.');
    } else {
      toast.success('Property deleted successfully!');
      navigate('/');
    }
  }

  async function handleVote(vote: 'up' | 'down') {
    if (!user) {
      toast.error('Please log in to submit feedback.');
      return;
    }
    const { error } = await supabase
      .from('user_feedback')
      .upsert({ user_id: user.id, property_id: id, vote });
    if (error) {
      toast.error('Failed to provide feedback.');
    } else {
      toast.success('Feedback submitted!');
      fetchProperty();
    }
  }

  if (!property) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Property Details</h1>
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <img
              src={property.image_url}
              alt="Property"
              className="w-full h-[400px] object-cover rounded-t-lg"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-bold">${property.price.toLocaleString()}</h2>
            <p className="text-lg">{property.location}</p>
            <p className="text-md">{property.bedrooms} Bedrooms</p>
            <p className="text-md">{property.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <p><strong>Date on Sale:</strong> {property.date_on_sale}</p>
              <p><strong>Estate Agent:</strong> {property.estate_agent}</p>
              <p><strong>Reduced:</strong> {property.reduced ? 'Yes' : 'No'}</p>
              <p><strong>Views:</strong> {property.views ? 'Yes' : 'No'}</p>
              <p><strong>Gardens:</strong> {property.gardens ? 'Yes' : 'No'}</p>
              <p><strong>Outbuildings:</strong> {property.outbuildings ? 'Yes' : 'No'}</p>
              <p><strong>Condition:</strong> {property.condition}</p>
              <p><strong>Features:</strong> {property.features.join(', ')}</p>
            </div>
            <p className="text-sm italic">Added by {property.added_by_email}</p>
            <p className="text-md font-semibold">Combined Score: {property.combined_score}</p>
            <FeatureInput propertyId={property.id} onSuccess={fetchProperty} />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleVote('up')}>
                <span className="material-icons">thumb_up</span> Thumbs Up
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleVote('down')}>
                <span className="material-icons">thumb_down</span> Thumbs Down
              </Button>
              {user?.role === 'primary' && (
                <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">Delete Property</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Delete</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this property?</p>
                    <Button onClick={handleDelete}>Confirm</Button>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {user?.role === 'primary' && <PropertyRatingForm property={property} />}
            <ScoreConflictResolver propertyId={property.id} />
            <Accordion type="single" collapsible className="w-full">
              {feedback.map((fb, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{fb.user_email}</AccordionTrigger>
                  <AccordionContent>
                    <span className={`material-icons ${fb.vote === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {fb.vote === 'up' ? 'thumb_up' : 'thumb_down'}
                    </span>
                    <MarkdownRenderer content={fb.notes || 'No notes provided.'} />
                    <p className="text-xs italic">{new Date(fb.created_at).toLocaleString()}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}