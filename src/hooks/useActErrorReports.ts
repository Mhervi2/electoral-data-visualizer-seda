import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ActErrorReport {
  id: string;
  electoral_act_id: string;
  reporter_name: string | null;
  reporter_email: string | null;
  error_types: string[];
  observations: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  admin_notes: string | null;
  // Related data
  electoral_act?: {
    mesa_identifier: string;
    full_identifier?: string;
    municipio: string;
    census_total: number;
    total_voters: number;
    blank_votes: number;
    null_votes: number;
  };
}

export const useActErrorReports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<ActErrorReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('act_error_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching error reports:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los reportes de errores",
          variant: "destructive"
        });
        return;
      }

      // Fetch electoral act details separately
      const reportsWithActs = await Promise.all(
        (data || []).map(async (report) => {
          const { data: actData, error: actError } = await supabase
            .from('electoral_acts')
            .select(`
              mesa_identifier, 
              full_identifier, 
              census_total, 
              total_voters, 
              blank_votes, 
              null_votes,
              mpca(municipio)
            `)
            .eq('id', report.electoral_act_id)
            .maybeSingle();

          return {
            ...report,
            electoral_act: actData ? {
              mesa_identifier: actData.mesa_identifier,
              full_identifier: actData.full_identifier,
              municipio: actData.mpca?.municipio || 'Sin municipio',
              census_total: actData.census_total,
              total_voters: actData.total_voters,
              blank_votes: actData.blank_votes,
              null_votes: actData.null_votes
            } : null
          };
        })
      );

      setReports(reportsWithActs as ActErrorReport[]);
    } catch (error) {
      console.error('Error fetching error reports:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes de errores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (
    reportId: string, 
    status: 'resolved' | 'dismissed',
    adminNotes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('act_error_reports')
        .update({
          status,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          admin_notes: adminNotes || null
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error updating report status:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del reporte",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Reporte actualizado",
        description: `El reporte ha sido marcado como ${status === 'resolved' ? 'resuelto' : 'descartado'}`
      });

      // Refresh reports
      await fetchReports();
      return true;
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del reporte",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    fetchReports,
    updateReportStatus
  };
};