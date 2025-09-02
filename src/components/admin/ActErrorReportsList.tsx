import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, Check, X, MessageSquare, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useActErrorReports, ActErrorReport } from '@/hooks/useActErrorReports';
import { ElectoralActAdmin } from '@/hooks/useElectoralActsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActErrorReportsListProps {
  onEditAct?: (act: ElectoralActAdmin) => void;
  onViewAudit?: (act: ElectoralActAdmin) => Promise<void>;
}

export const ActErrorReportsList = ({ onEditAct, onViewAudit }: ActErrorReportsListProps = {}) => {
  const { reports, loading, updateReportStatus } = useActErrorReports();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ActErrorReport | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed'>('resolved');

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'destructive' as const, label: 'Pendiente' },
      resolved: { variant: 'default' as const, label: 'Resuelto' },
      dismissed: { variant: 'secondary' as const, label: 'Descartado' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getErrorTypeLabels = (errorTypes: string[]) => {
    const labels = {
      mesa_identification: 'ID Mesa',
      census_data: 'Censo/Votos',
      party_votes: 'Votos Partidos'
    };
    
    return errorTypes.map(type => labels[type as keyof typeof labels] || type).join(', ');
  };

  const handleResolveReport = (report: ActErrorReport, action: 'resolved' | 'dismissed') => {
    setSelectedReport(report);
    setResolveAction(action);
    setAdminNotes('');
    setShowResolveDialog(true);
  };

  const handleEditActFromReport = async (report: ActErrorReport) => {
    if (!onEditAct || !report.electoral_act_id) return;

    try {
      // Fetch the complete electoral act data
      const { data: actData, error } = await supabase
        .from('electoral_acts')
        .select(`
          *,
          mpca(
            municipio,
            provincia,
            ca
          ),
          party_votes:party_votes(
            id,
            votes,
            party_id,
            political_parties:political_parties(name, siglas, color)
          ),
          mail_votes:mail_votes(dni)
        `)
        .eq('id', report.electoral_act_id)
        .single();

      if (error) {
        console.error('Error fetching electoral act:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el acta electoral"
        });
        return;
      }

      // Map the data to match ElectoralActAdmin interface
      const completeAct = {
        ...actData,
        municipio: actData.mpca?.municipio || 'Sin municipio',
        provincia: actData.mpca?.provincia || 'Sin provincia',
        comunidad_autonoma: actData.mpca?.ca || 'Sin comunidad autónoma'
      };

      onEditAct(completeAct);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al cargar el acta"
      });
    }
  };

  const handleConfirmResolve = async () => {
    if (!selectedReport) return;

    const success = await updateReportStatus(selectedReport.id, resolveAction, adminNotes);
    if (success) {
      setShowResolveDialog(false);
      setSelectedReport(null);
      setAdminNotes('');
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Reports */}
      {pendingReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Reportes Pendientes ({pendingReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador Completo</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Tipo de Error</TableHead>
                  <TableHead>Reportador</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReports.map((report) => (
                  <TableRow key={report.id} className="bg-destructive/5">
                    <TableCell className="font-medium font-mono text-sm">
                      {report.electoral_act?.full_identifier || report.electoral_act?.mesa_identifier || 'N/A'}
                    </TableCell>
                    <TableCell>{report.electoral_act?.municipio}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getErrorTypeLabels(report.error_types)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {report.reporter_name && <div>{report.reporter_name}</div>}
                        {report.reporter_email && (
                          <div className="text-muted-foreground">{report.reporter_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveReport(report, 'resolved')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveReport(report, 'dismissed')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Descartar
                        </Button>
                         {onEditAct && report.electoral_act && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditActFromReport(report)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar Acta
                          </Button>
                         )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Resolved Reports */}
      {resolvedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Historial de Reportes ({resolvedReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador Completo</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Tipo de Error</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Reporte</TableHead>
                  <TableHead>Fecha Resolución</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium font-mono text-sm">
                      {report.electoral_act?.full_identifier || report.electoral_act?.mesa_identifier || 'N/A'}
                    </TableCell>
                    <TableCell>{report.electoral_act?.municipio}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getErrorTypeLabels(report.error_types)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      {format(new Date(report.created_at), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {report.resolved_at && format(new Date(report.resolved_at), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay reportes de errores</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolveAction === 'resolved' ? 'Resolver' : 'Descartar'} Reporte de Error
            </DialogTitle>
            <DialogDescription>
              Identificador: {selectedReport?.electoral_act?.full_identifier || selectedReport?.electoral_act?.mesa_identifier} - {selectedReport?.electoral_act?.municipio}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Detalles del reporte:</p>
                <p className="text-sm"><strong>Tipos de error:</strong> {getErrorTypeLabels(selectedReport.error_types)}</p>
                {selectedReport.observations && (
                  <p className="text-sm mt-2"><strong>Observaciones:</strong> {selectedReport.observations}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Notas del administrador (opcional)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={`Explique las acciones tomadas para ${resolveAction === 'resolved' ? 'resolver' : 'descartar'} este reporte...`}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmResolve}>
                  {resolveAction === 'resolved' ? 'Resolver' : 'Descartar'} Reporte
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};