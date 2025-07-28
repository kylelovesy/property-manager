import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { useUser } from '../../hooks/useUser';
import { Property, UserFeedback } from '../../types';
import { toast } from "sonner"
import { supabase } from '../../lib/supabase';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PropertyCardProps {
  property: Property;
  onDelete?: () => void;
}

export default function PropertyCard({ property, onDelete }: PropertyCardProps) {
  const { user } = useUser();
  // const { toast } = useToast();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<UserFeedback[]>(property.feedback || []);

  const handleVote = async (vote: 'up' | 'down') => {
    if (!user) {
      toast.error('Please log in to provide feedback.');
      return;
    }
    const { error } = await supabase
      .from('user_feedback')
      .upsert({ user_id: user.id, property_id: property.id, vote });
    if (error) {
      toast.error('Failed to submit feedback.');
    } else {
      setFeedback([...feedback, { user_id: user.id, vote, created_at: new Date().toISOString() }]);
      toast.success('Feedback submitted!');
    }
  };

  return (
    <Card className="w-full max-w-[250px] m-2">
      <CardHeader>
        <img src={property.image_url} alt="Property" className="w-full h-[200px] object-cover rounded-t-lg" />
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-bold">${property.price.toLocaleString()}</h3>
        <p className="text-sm">{property.location}</p>
        <p className="text-sm">{property.bedrooms} Bedrooms</p>
        <p className="text-sm truncate">{property.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <p className="text-xs italic">Added by {property.added_by_email}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleVote('up')}>
            <span className="material-icons">thumb_up</span>
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleVote('down')}>
            <span className="material-icons">thumb_down</span>
          </Button>
          {user?.role === 'primary' && (
            <Button size="sm" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button size="sm" onClick={() => navigate(`/properties/${property.id}`)}>
            Details
          </Button>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {feedback.map((fb, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{fb.user_email}</AccordionTrigger>
              <AccordionContent>
                <span className={`material-icons ${fb.vote === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {fb.vote === 'up' ? 'thumb_up' : 'thumb_down'}
                </span>
                <p className="text-sm">{fb.notes}</p>
                <p className="text-xs italic">{new Date(fb.created_at).toLocaleString()}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardFooter>
    </Card>
  );
}