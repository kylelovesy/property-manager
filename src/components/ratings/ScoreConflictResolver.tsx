import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from "sonner"
import { supabase } from '../../lib/supabase';
import { useUser } from '../../hooks/useUser';

interface ScoreConflictResolverProps {
  propertyId: string;
}

export default function ScoreConflictResolver({ propertyId }: ScoreConflictResolverProps) {
  const { user } = useUser();
  // const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<{ user_id: string; score: number }[]>([]);

  useEffect(() => {
    if (user?.role !== 'power') return;
    checkConflicts();
  }, [user, propertyId]);

  async function checkConflicts() {
    const { data: ratings, error } = await supabase
      .from('user_property_ratings')
      .select('user_id, score')
      .eq('property_id', propertyId)
      .in('user_id', (await supabase.from('users').select('id').eq('role', 'primary')).data?.map(row => row.id) || []);

    if (error) {
      toast.error('Failed to check conflicts.');
      return;
    }

    if (ratings.length === 2 && Math.abs(ratings[0].score - ratings[1].score) > 20) {
      setScores(ratings);
      setOpen(true);
    }
  }

  async function handleResolve() {
    // Trigger score recalculation
    try {
      const response = await fetch(`/api/calculate-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId }),
      });
      if (!response.ok) throw new Error('Failed to recalculate score');
      toast.success('Score recalculated.');
      setOpen(false);
    } catch (error) {
      toast.error('Failed to resolve conflict.');
    }
  }

  if (user?.role !== 'power') return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Score Conflict Detected</DialogTitle>
        </DialogHeader>
        <p>Primary user ratings differ by more than 20 points:</p>
        <ul>
          {scores.map((s, index) => (
            <li key={index}>User {index + 1}: {s.score}</li>
          ))}
        </ul>
        <Button onClick={handleResolve}>Recalculate Combined Score</Button>
      </DialogContent>
    </Dialog>
  );
}