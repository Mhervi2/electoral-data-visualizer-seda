
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Upload, Users, FileText, Settings, Eye, Calculator, Shield, Download, Github, MapPin, BarChart2 } from 'lucide-react';
import { useDataExport } from '@/hooks/useDataExport';
import { useDeleteRecentActs } from '@/hooks/useDeleteRecentActs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SystemSettingsManager } from '@/components/admin/SystemSettingsManager';

const AdminDashboard = () => {
  const { exportData, isExporting } = useDataExport();
  const { deleteRecentActs, isDeleting } = useDeleteRecentActs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona todos los aspectos del sistema electoral.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Elecciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Crear y gestionar procesos electorales
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/admin/elections">Gestionar Elecciones</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Ficheros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Subir archivos de resultados oficiales
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/admin/files">Gestionar Ficheros</Link>
            </Button>
          </CardContent>
        </Card>


        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Partidos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Gestionar partidos políticos del sistema
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/political-parties">Ver Partidos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Escaños</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Configurar escaños por provincia
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/admin/provincial-seats">Gestionar Escaños</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Gestionar Actas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Editar y revisar actas enviadas por usuarios
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/admin/electoral-acts">Gestionar Actas</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Códigos Territoriales</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Gestionar códigos de comunidades autónomas y provincias
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/admin/territorial-codes">Gestionar Códigos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Comparación Electoral</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Comparar resultados entre diferentes elecciones
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/electoral-comparison">Ver Comparaciones</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Configuration Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold font-space-grotesk">Configuración del Sistema</h2>
        </div>
        
        <SystemSettingsManager />
      </div>

      {/* Security & Backup Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold font-space-grotesk">Seguridad y Backup</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Data Export Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Exportar Datos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Descargar backup completo de la base de datos en formato CSV con logs de auditoría
              </CardDescription>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Base de Datos
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ Confirmar Exportación de Datos</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>Estás a punto de exportar <strong>TODOS</strong> los datos de la base de datos, incluyendo:</p>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                        <li>Actas electorales y votos</li>
                        <li>Datos de usuarios y perfiles</li>
                        <li>Logs de auditoría completos</li>
                        <li>Configuraciones del sistema</li>
                      </ul>
                      <p className="text-red-600 font-medium mt-3">
                        Esta operación se registrará en los logs de seguridad.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={exportData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmar Exportación
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Delete Recent Acts Card */}
          <Card className="hover:shadow-lg transition-shadow border-destructive">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg">Eliminar Actas Recientes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Eliminar las 500 actas electorales más recientes y sus datos relacionados
              </CardDescription>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar 500 Actas Recientes"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ ADVERTENCIA: Operación Irreversible</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p className="text-red-600 font-bold">Esta operación NO puede deshacerse.</p>
                      <p>Se eliminarán permanentemente:</p>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                        <li>Las 500 actas electorales más recientes</li>
                        <li>Todos sus votos por partido</li>
                        <li>Todos sus votos por correo</li>
                        <li>Todos los registros de auditoría</li>
                      </ul>
                      <p className="text-red-600 font-medium mt-3">
                        ¿Estás seguro de que deseas continuar?
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={deleteRecentActs}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmar Eliminación
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* GitHub Backup Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Github className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Backup de Código</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Conecta con GitHub para backup automático del código fuente y restauración completa
              </CardDescription>
              <div className="space-y-3">
                <Button asChild className="w-full" variant="outline">
                  <a 
                    href="https://docs.lovable.dev/features/github-integration" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    Configurar GitHub
                  </a>
                </Button>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Sincronización automática bidireccional</p>
                  <p>• Historial completo de versiones</p>
                  <p>• Restauración con un clic</p>
                  <p>• Backup en tiempo real</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Actas Recibidas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Datos en tiempo real</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Elecciones Activas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Procesos en curso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Total de usuarios</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
