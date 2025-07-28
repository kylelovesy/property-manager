import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Property } from '../types';
import PropertyCard from '../components/properties/PropertyCard';
import AddPropertyForm from '../components/properties/AddPropertyForm';
import PropertyFilters from '../components/dashboard/PropertyFilters';
import { useUser } from '../hooks/useUser';
import { toast } from "sonner"
import { useStore } from '../lib/store';

export default function DashboardPage() {
  const { user } = useUser();
  // const { toast } = useToast();
  const { properties, setProperties } = useStore();
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetchProperties();
    const subscription = supabase
      .channel('properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => fetchProperties())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchProperties() {
    const { data, error } = await supabase.from('properties').select(`
      *,
      user_feedback (id, user_id, vote, notes, created_at, users(email)),
      property_scores (combined_score)
    `);
    if (error) {
      toast.error('Failed to retrieve properties.');
    } else {
      const mappedProperties = data.map((p: any) => ({
        ...p,
        feedback: p.user_feedback.map((f: any) => ({ ...f, user_email: f.users.email })),
        combined_score: p.property_scores?.[0]?.combined_score || 0,
      }));
      setProperties(mappedProperties);
      setFilteredProperties(mappedProperties);
    }
  }

  async function handleDelete(propertyId: string) {
    if (user?.role !== 'primary') return;
    const { error } = await supabase.from('properties').delete().eq('id', propertyId);
    if (error) {
      toast.error('Failed to remove property.');
    } else {
      toast.success('Property deleted successfully!');
      fetchProperties();
    }
  }

  function handleFilter(filters: { location?: string; bedrooms?: number; priceMin?: number; priceMax?: number }) {
    let filtered = [...properties];
    if (filters.location) {
      filtered = filtered.filter((p) => p.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters.bedrooms) {
      filtered = filtered.filter((p) => (filters.bedrooms === 3 ? p.bedrooms >= 3 : p.bedrooms === filters.bedrooms));
    }
    if (filters.priceMin) {
      filtered = filtered.filter((p) => p.price >= filters.priceMin!);
    }
    if (filters.priceMax) {
      filtered = filtered.filter((p) => p.price <= filters.priceMax!);
    }
    setFilteredProperties(filtered);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Property Dashboard</h1>
      <AddPropertyForm onSuccess={fetchProperties} />
      <PropertyFilters onFilter={handleFilter} />
      {filteredProperties.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg">No properties added yet. Click 'Add Property' to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProperties
            .sort((a, b) => (b.combined_score || 0) - (a.combined_score || 0))
            .map((property, index) => (
              <div key={property.id} className={index === 0 ? 'lg:col-span-4' : index < 3 ? 'lg:col-span-2' : ''}>
                <PropertyCard property={property} onDelete={() => handleDelete(property.id)} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}