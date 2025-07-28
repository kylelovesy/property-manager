import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors';

interface Database {
  public: {
    Tables: {
      user_property_ratings: {
        Row: { score: number; user_id: string; property_id: string };
      };
      users: {
        Row: { id: string; role: string };
      };
      user_feedback: {
        Row: { vote: string; property_id: string };
      };
      property_scores: {
        Row: { property_id: string; combined_score: number };
        Insert: { property_id: string; combined_score: number };
        Update: { property_id?: string; combined_score?: number };
      };
    };
  };
}

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { property_id } = body;
    
    if (!property_id) {
      return new Response(
        JSON.stringify({ error: 'Property ID is required' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // First, get primary users
    const { data: primaryUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'primary');

    if (usersError) {
      console.error('Error fetching primary users:', usersError);
      throw usersError;
    }

    if (!primaryUsers || primaryUsers.length === 0) {
      console.log('No primary users found');
      return new Response(
        JSON.stringify({ combined_score: 0, message: 'No primary users found' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const primaryUserIds = primaryUsers.map(u => u.id);

    // Fetch primary users' ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from('user_property_ratings')
      .select('score, user_id')
      .eq('property_id', property_id)
      .in('user_id', primaryUserIds);

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      throw ratingsError;
    }

    // Fetch feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .select('vote')
      .eq('property_id', property_id);

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      throw feedbackError;
    }

    // Calculate combined score
    const primaryScores = (ratings || []).reduce((sum: number, r) => {
      return sum + (r.score * 0.5);
    }, 0);

    const feedbackScore = (feedback || []).reduce((sum: number, f) => {
      if (f.vote === 'up') return sum + 1;
      if (f.vote === 'down') return sum - 1;
      return sum;
    }, 0);

    const combinedScore = Math.min(Math.max(primaryScores + feedbackScore, 0), 100);

    // Store combined score
    const { error: scoreError } = await supabase
      .from('property_scores')
      .upsert({ 
        property_id, 
        combined_score: combinedScore 
      });

    if (scoreError) {
      console.error('Error storing score:', scoreError);
      throw scoreError;
    }

    console.log(`Calculated score for property ${property_id}: ${combinedScore}`);

    return new Response(
      JSON.stringify({ 
        combined_score: combinedScore,
        ratings_count: ratings?.length || 0,
        feedback_count: feedback?.length || 0
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate score',
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});