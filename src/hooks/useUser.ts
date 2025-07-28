import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapSupabaseUser = (supabaseUser: any): User | null => {
    if (!supabaseUser || !supabaseUser.email) {
      return null; // or handle missing email case
    }
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email, // Now guaranteed to be string
      // ... map other properties
    } as User;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
}

//     async function fetchUser() {
//       const { data: { user: authUser } } = await supabase.auth.getUser();
//       if (authUser) {
//         const { data, error } = await supabase
//           .from('users')
//           .select('id, email, role')
//           .eq('id', authUser.id)
//           .single();
//         if (!error) setUser(data);
//       }
//     }
//     fetchUser();

//     const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
//       if (session?.user) {
//         fetchUser();
//       } else {
//         setUser(null);
//       }
//     });

//     return () => {
//       authListener.subscription.unsubscribe();
//     };
//   }, []);

//   return { user };
// }