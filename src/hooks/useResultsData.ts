
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ElectoralAct } from '@/types/acta';

interface Discrepancy {
  municipality: string;
  district: string;
  section: string;
  table_letter: string;
  sources: string[];
  differences: string[];
}

interface Filters {
  municipality: string;
  district: string;
  section: string;
  table: string;
  sourceType: string;
}

export const useResultsData = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [electoralActs, setElectoralActs] = useState<ElectoralAct[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    municipality: searchParams.get('municipality') || '',
    district: searchParams.get('district') || '',
    section: searchParams.get('section') || '',
    table: searchParams.get('table') || '',
    sourceType: 'all'
  });

  const parseMesaIdentifier = (mesaIdentifier: string) => {
    const parts = mesaIdentifier.split('-');
    return {
      district: parts[0] || '',
      section: parts[1] || '',
      table: parts[2] || ''
    };
  };

  const fetchElectoralActs = async () => {
    try {
      console.log('Fetching electoral acts with filters:', filters);
      setLoading(true);
      
      let query = supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          *,
          party_votes (
            votes,
            political_parties (
              name,
              siglas,
              color
            )
          )
        `);

      // Apply filters only if they have values
      if (filters.municipality.trim()) {
        query = query.ilike('municipio', `%${filters.municipality.trim()}%`);
      }
      
      // For mesa_identifier filtering, we need to construct the identifier
      let mesaIdentifierFilter = '';
      if (filters.district.trim()) {
        mesaIdentifierFilter += filters.district.trim();
      }
      if (filters.section.trim()) {
        if (mesaIdentifierFilter) mesaIdentifierFilter += '-';
        mesaIdentifierFilter += filters.section.trim();
      }
      if (filters.table.trim()) {
        if (mesaIdentifierFilter) mesaIdentifierFilter += '-';
        mesaIdentifierFilter += filters.table.trim();
      }
      
      if (mesaIdentifierFilter) {
        query = query.ilike('mesa_identifier', `%${mesaIdentifierFilter}%`);
      }
      
      if (filters.sourceType.trim() && filters.sourceType !== 'all') {
        query = query.eq('source_type', filters.sourceType.trim());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching electoral acts:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las actas electorales.",
        });
        setElectoralActs([]);
      } else {
        console.log('Electoral acts fetched:', data?.length || 0);
        
        // Transform the data to match the ElectoralAct interface with proper null handling
        const transformedData: ElectoralAct[] = data?.map(act => ({
          ...act,
          party_votes: act.party_votes?.map((pv: any) => ({
            party: pv.political_parties || { name: 'N/A', siglas: 'N/A', color: '#6B7280' },
            votes: pv.votes || 0
          })) || []
        })) || [];
        
        setElectoralActs(transformedData);
      }
    } catch (error) {
      console.error('Error fetching electoral acts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cargar las actas electorales.",
      });
      setElectoralActs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscrepancies = async () => {
    try {
      // This is a simplified mock for discrepancies
      // In a real implementation, you would query for actual discrepancies
      const mockDiscrepancies: Discrepancy[] = [
        {
          municipality: 'Madrid',
          district: '01',
          section: '001',
          table_letter: 'A',
          sources: ['indra', 'escrutinio'],
          differences: ['Total de votantes: INDRA: 745, Escrutinio: 747']
        }
      ];
      setDiscrepancies(mockDiscrepancies);
    } catch (error) {
      console.error('Error fetching discrepancies:', error);
    }
  };

  return {
    electoralActs,
    discrepancies,
    loading,
    filters,
    setFilters,
    fetchElectoralActs,
    fetchDiscrepancies
  };
};
