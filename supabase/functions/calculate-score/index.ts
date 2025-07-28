import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const { property_id } = await req.json();
  if (!property_id) {
    return new Response(JSON.stringify({ error: 'Property ID is required' }), { status: 400 });
  }

  try {
    const { data: ratings, error: ratingsError } = await supabase
      .from('user_property_ratings')
      .select('score, user_id')
      .eq('property_id', property_id)
      .in('user_id', (await supabase.from('users').select('id').eq('role', 'primary')).data?.map((u: any) => u.id) || []);

    if (ratingsError) throw ratingsError;

    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .select('vote')
      .eq('property_id', property_id);

    if (feedbackError) throw feedbackError;

    const primaryScores = ratings.reduce((sum: number, r: any) => sum + r.score * 0.5, 0);
    const feedbackScore = feedback.reduce((sum: number, f: any) => sum + (f.vote === 'up' ? 1 : f.vote === 'down' ? -1 : 0), 0);
    const combinedScore = Math.min(Math.max(primaryScores + feedbackScore, 0), 100);

    const { error: scoreError } = await supabase
      .from('property_scores')
      .upsert({ property_id, combined_score: combinedScore });

    if (scoreError) throw scoreError;

    return new Response(JSON.stringify({ combined_score: combinedScore }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to calculate score' }), { status: 500 });
  }
});