import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Promotion = {
  id: string;
  product_id: string;
  promotional_price: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
};

export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Promotion[];
    },
    refetchInterval: 60000,
  });
};

export const useAllPromotions = () => {
  return useQuery({
    queryKey: ['promotions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select(`*, products(id, name, brand, price)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
