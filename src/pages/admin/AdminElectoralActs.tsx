
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Edit, History, FileText, Flag } from 'lucide-react';
import { useElectoralActsAdmin, ElectoralActAdmin, ActAuditLog } from '@/hooks/useElectoralActsAdmin';
import { AdminActEditForm } from '@/components/admin/AdminActEditForm';
import { AdminActAuditLog } from '@/components/admin/AdminActAuditLog';
import { ActErrorReportsList } from '@/components/admin/ActErrorReportsList';
import { DuplicateActsList } from '@/components/admin/DuplicateActsList';
import { ActErrorReport } from '@/hooks/useActErrorReports';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AdminElectoralActs = () => {
  const {
    acts,
    loading,
    searchTerm,
    setSearchTerm,
    municipalityFilter,
    setMunicipalityFilter,
    updateAct,
    updatePartyVotes,
    updateMailVotes,
    getActAuditLog,
    deleteAct
  } = useElectoralActsAdmin();

  const [selectedAct, setSelectedAct] = useState<ElectoralActAdmin | null>(null);
  const [selectedErrorReport, setSelectedErrorReport] = useState<ActErrorReport | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<ActAuditLog[]>([]);
  const { toast } = useToast();

  const handleEditAct = (act: ElectoralActAdmin, errorReport?: ActErrorReport) => {
    setSelectedAct(act);
    setSelectedErrorReport(errorReport || null);
    setShowEditDialog(true);
  };

  const handleEditActFromErrorReport = async (errorReport: ActErrorReport) => {
    if (!errorReport.electoral_act_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se encontró el ID del acta electoral"
      });
      return;
    }

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
        .eq('id', errorReport.electoral_act_id)
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
      const completeAct: ElectoralActAdmin = {
        ...actData,
        municipio: actData.mpca?.municipio || 'Sin municipio',
        provincia: actData.mpca?.provincia || 'Sin provincia',
        comunidad_autonoma: actData.mpca?.ca || 'Sin comunidad autónoma'
      };

      setSelectedAct(completeAct);
      setSelectedErrorReport(errorReport);
      setShowEditDialog(true);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al cargar el acta"
      });
    }
  };

  const handleViewAudit = async (act: ElectoralActAdmin) => {
    setSelectedAct(act);
    const logs = await getActAuditLog(act.id);
    setAuditLogs(logs);
    setShowAuditDialog(true);
  };

  const handleSaveAct = async (
    updates: Partial<ElectoralActAdmin>,
    partyVotes: { party_id: string; votes: number }[],
    mailVotes: { dni: string }[]
  ) => {
    if (!selectedAct) return false;

    const success = await updateAct(selectedAct.id, updates);
    if (success) {
      await updatePartyVotes(selectedAct.id, partyVotes);
      await updateMailVotes(selectedAct.id, mailVotes);
      setShowEditDialog(false);
      setSelectedAct(null);
      setSelectedErrorReport(null);
      return true;
    }
    return false;
  };

  const handleDeleteAct = async (actId: string) => {
    const success = await deleteAct(actId);
    if (success) {
      setShowEditDialog(false);
      setSelectedAct(null);
      setSelectedErrorReport(null);
      return true;
    }
    return false;
  };

  const getStatusBadge = (act: ElectoralActAdmin) => {
    if (act.version > 1) {
      return <Badge variant="secondary">Modificada v{act.version}</Badge>;
    }
    return <Badge variant="outline">Original</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
          Gestión de Actas Electorales
        </h1>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {acts.length} actas totales
          </span>
        </div>
      </div>

      <Tabs defaultValue="acts" className="w-full">
        <TabsList>
          <TabsTrigger value="acts">Actas</TabsTrigger>
          <TabsTrigger value="error-reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reportes de Errores
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Actas Duplicadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="acts" className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por identificador de mesa o completo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Filtrar por municipio..."
                value={municipalityFilter}
                onChange={(e) => setMunicipalityFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actas de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador completo</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Censo</TableHead>
                  <TableHead>Votantes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acts
                  .sort((a, b) => (a.municipio || '').localeCompare(b.municipio || ''))
                  .map((act) => (
                  <TableRow key={act.id}>
                    <TableCell className="font-medium font-mono text-sm">
                      {act.full_identifier || 'N/A'}
                    </TableCell>
                    <TableCell>{act.municipio || 'Sin municipio'}</TableCell>
                    <TableCell>{act.census_total}</TableCell>
                    <TableCell>{act.total_voters}</TableCell>
                    <TableCell>{getStatusBadge(act)}</TableCell>
                    <TableCell>
                      {format(new Date(act.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAct(act)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAudit(act)}
                        >
                          <History className="h-4 w-4 mr-1" />
                          Historial
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Acta - {selectedAct?.full_identifier || selectedAct?.mesa_identifier}
            </DialogTitle>
          </DialogHeader>
          
          {/* Show error report information if editing from error report */}
          {selectedErrorReport && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="font-semibold text-destructive mb-2">Información del Reporte de Error</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Tipos de error:</span> {selectedErrorReport.error_types.map(type => {
                  const labels = {
                    mesa_identification: 'ID Mesa',
                    census_data: 'Censo/Votos',
                    party_votes: 'Votos Partidos'
                  };
                  return labels[type as keyof typeof labels] || type;
                }).join(', ')}</p>
                {selectedErrorReport.observations && (
                  <p><span className="font-medium">Observaciones:</span> {selectedErrorReport.observations}</p>
                )}
                {selectedErrorReport.reporter_name && (
                  <p><span className="font-medium">Reportado por:</span> {selectedErrorReport.reporter_name}</p>
                )}
                {selectedErrorReport.reporter_email && (
                  <p><span className="font-medium">Email:</span> {selectedErrorReport.reporter_email}</p>
                )}
              </div>
            </div>
          )}
          
          {selectedAct && (
            <AdminActEditForm
              act={selectedAct}
              onSave={handleSaveAct}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedErrorReport(null);
              }}
              onDelete={handleDeleteAct}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Audit Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Historial de Cambios - Mesa {selectedAct?.mesa_identifier}
            </DialogTitle>
          </DialogHeader>
          {selectedAct && (
            <AdminActAuditLog
              act={selectedAct}
              auditLogs={auditLogs}
            />
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="error-reports">
          <ActErrorReportsList 
            onEditAct={handleEditActFromErrorReport}
          />
        </TabsContent>

        <TabsContent value="duplicates">
          <DuplicateActsList 
            onEditAct={handleEditAct}
            onViewAudit={handleViewAudit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminElectoralActs;
