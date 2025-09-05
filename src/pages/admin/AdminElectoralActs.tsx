
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Edit, History, FileText, Flag, AlertTriangle } from 'lucide-react';
import { useElectoralActsAdmin, ElectoralActAdmin, ActAuditLog } from '@/hooks/useElectoralActsAdmin';
import { AdminActEditForm } from '@/components/admin/AdminActEditForm';
import { AdminActAuditLog } from '@/components/admin/AdminActAuditLog';
import { ActErrorReportsList } from '@/components/admin/ActErrorReportsList';
import { DuplicateActsList } from '@/components/admin/DuplicateActsList';
import AdminDiscrepancyDetector from '@/components/admin/AdminDiscrepancyDetector';
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<ActAuditLog[]>([]);

  const handleEditAct = (act: ElectoralActAdmin) => {
    setSelectedAct(act);
    setShowEditDialog(true);
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
      return true;
    }
    return false;
  };

  const handleDeleteAct = async (actId: string) => {
    const success = await deleteAct(actId);
    if (success) {
      setShowEditDialog(false);
      setSelectedAct(null);
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
          <TabsTrigger value="discrepancies" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Discrepancias
          </TabsTrigger>
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
                placeholder="Buscar por identificador de mesa..."
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
                    <TableCell className="font-medium">
                      {act.full_identifier || act.mesa_identifier}
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

        </TabsContent>

        <TabsContent value="discrepancies">
          <AdminDiscrepancyDetector onEditAct={handleEditAct} />
        </TabsContent>

        <TabsContent value="error-reports">
          <ActErrorReportsList 
            onEditAct={handleEditAct}
            onShowErrorDetails={(report) => {
              // Additional context for error reports will be shown in the edit form
            }}
          />
        </TabsContent>

        <TabsContent value="duplicates">
          <DuplicateActsList 
            onEditAct={handleEditAct}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog - Available for all tabs */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Acta - Mesa {selectedAct?.mesa_identifier}
            </DialogTitle>
          </DialogHeader>
          {selectedAct && (
            <AdminActEditForm
              act={selectedAct}
              onSave={handleSaveAct}
              onCancel={() => setShowEditDialog(false)}
              onDelete={handleDeleteAct}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Audit Dialog - Available for all tabs */}
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
    </div>
  );
};

export default AdminElectoralActs;
