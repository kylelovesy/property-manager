import { useEffect, useState } from 'react';
import { Bar, Radar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
// import { Button } from '../components/ui/button';
import { toast } from "sonner"
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { Property } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, Title, Tooltip, Legend);

export default function AnalyticsPage() {
  const { user } = useUser();
  // const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (user?.role !== 'power' && user?.role !== 'primary') return;
    fetchProperties();
  }, [user]);

  async function fetchProperties() {
    const { data, error } = await supabase.from('properties').select(`
      *,
      property_scores (combined_score),
      user_property_ratings (score, user_id, rating_id, user_ratings(name, points))
    `);
    if (error) {
      toast.error('Failed to fetch properties.');
    } else {
      setProperties(data.map((p: any) => ({
        ...p,
        combined_score: p.property_scores?.combined_score || 0,
        ratings: p.user_property_ratings,
      })));
    }
  }

  if (user?.role !== 'power' && user?.role !== 'primary') {
    return <div className="container mx-auto p-4">Access denied. Power or Primary users only.</div>;
  }

  const barData = {
    labels: properties.map((p) => p.id.slice(0, 8)),
    datasets: [{
      label: 'Combined Score',
      data: properties.map((p) => p.combined_score || 0),
      backgroundColor: '#3f51b5',
    }],
  };

  const radarData = {
    labels: properties[0]?.ratings?.map((r: any) => r.user_ratings.name) || [],
    datasets: properties.map((p) => ({
      label: p.id.slice(0, 8),
      data: p.ratings?.map((r: any) => r.score) || [],
      borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      fill: false,
    })),
  };

  const scatterData = {
    datasets: [{
      label: 'Price vs Score',
      data: properties.map((p) => ({
        x: p.price,
        y: p.combined_score || 0,
      })),
      backgroundColor: '#3f51b5',
    }],
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Property Analytics</DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Combined Scores</h2>
            <Bar data={barData} options={{ responsive: true }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Priority Scores</h2>
            <Radar data={radarData} options={{ responsive: true }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Price vs Score</h2>
            <Scatter data={scatterData} options={{ responsive: true, scales: { x: { title: { display: true, text: 'Price' } }, y: { title: { display: true, text: 'Score' } } } }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}