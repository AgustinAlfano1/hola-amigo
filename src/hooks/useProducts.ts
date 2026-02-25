import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type DBProduct = Tables<'products'>;

export const useProducts = (search?: string) => {
  return useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as DBProduct[];
    },
  });
};
