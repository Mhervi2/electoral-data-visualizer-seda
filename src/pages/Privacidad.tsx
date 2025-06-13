
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield } from 'lucide-react';

const Privacidad = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
            Política de Privacidad
          </h1>
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Política de Privacidad y Protección de Datos</CardTitle>
          <CardDescription>
            SEDA Electoral - Software Electoral de Datos Abiertos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full pr-4">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Información General</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  La presente Política de Privacidad describe cómo Constituyentes 
                  recopila, utiliza, almacena y protege la información personal de 
                  los usuarios de SEDA Electoral (en adelante, "la Aplicación"), 
                  en cumplimiento del Reglamento General de Protección de Datos (RGPD) 
                  y la Ley Orgánica de Protección de Datos Personales y garantía de 
                  los derechos digitales (LOPDGDD).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Responsable del Tratamiento</h2>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <p><strong>Responsable:</strong> Constituyentes</p>
                  <p><strong>Sitio web:</strong> <a href="https://www.constituyentes.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">www.constituyentes.es</a></p>
                  <p><strong>Email de contacto:</strong> info@seda.es</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Datos que Recopilamos</h2>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <div>
                    <h3 className="font-medium mb-2">3.1 Datos de Navegación</h3>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Dirección IP</li>
                      <li>Tipo de navegador y versión</li>
                      <li>Sistema operativo</li>
                      <li>Páginas visitadas y tiempo de permanencia</li>
                      <li>Fecha y hora de acceso</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">3.2 Datos de Actas Electorales</h3>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Información de ubicación (municipio, provincia, distrito, sección, mesa)</li>
                      <li>Datos numéricos de votación</li>
                      <li>Imágenes de actas electorales (si se proporcionan)</li>
                      <li>Metadatos de archivos subidos</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">3.3 Datos de Administradores</h3>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Credenciales de acceso</li>
                      <li>Registro de actividades administrativas</li>
                      <li>Logs de modificaciones</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Finalidades del Tratamiento</h2>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <p className="mb-2">Los datos personales se utilizan para:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Facilitar la verificación ciudadana de procesos electorales</li>
                    <li>Proporcionar herramientas de análisis electoral</li>
                    <li>Mantener la seguridad y funcionalidad de la aplicación</li>
                    <li>Cumplir con obligaciones legales</li>
                    <li>Mejorar la experiencia del usuario</li>
                    <li>Generar estadísticas anónimas</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Base Legal</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  El tratamiento de datos se basa en el interés legítimo para 
                  promover la transparencia electoral y el control ciudadano de 
                  los procesos democráticos, así como en el consentimiento expreso 
                  del usuario para funcionalidades específicas que requieran datos 
                  personales adicionales.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Conservación de Datos</h2>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>Los períodos de conservación son:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Datos de navegación:</strong> 12 meses</li>
                    <li><strong>Actas electorales:</strong> 10 años (valor histórico)</li>
                    <li><strong>Logs administrativos:</strong> 5 años</li>
                    <li><strong>Datos de análisis:</strong> Indefinidamente en forma anonimizada</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Destinatarios de los Datos</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Los datos pueden ser compartidos con proveedores de servicios 
                  técnicos necesarios para el funcionamiento de la aplicación, 
                  siempre bajo acuerdos de confidencialidad y tratamiento de datos. 
                  No se ceden datos a terceros con fines comerciales.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Transferencias Internacionales</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Los datos se almacenan en servidores ubicados en la Unión Europea. 
                  En caso de transferencias a terceros países, se garantizará un 
                  nivel de protección adecuado mediante las salvaguardias apropiadas.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Derechos del Usuario</h2>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>Usted tiene derecho a:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Acceso:</strong> Consultar qué datos tenemos sobre usted</li>
                    <li><strong>Rectificación:</strong> Corregir datos inexactos</li>
                    <li><strong>Supresión:</strong> Eliminar sus datos ("derecho al olvido")</li>
                    <li><strong>Limitación:</strong> Restringir el tratamiento</li>
                    <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
                    <li><strong>Oposición:</strong> Oponerse al tratamiento</li>
                    <li><strong>Retirada de consentimiento:</strong> En cualquier momento</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Medidas de Seguridad</h2>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>Implementamos medidas técnicas y organizativas para proteger sus datos:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Cifrado de datos en tránsito y en reposo</li>
                    <li>Controles de acceso basados en roles</li>
                    <li>Auditorías de seguridad regulares</li>
                    <li>Copias de seguridad cifradas</li>
                    <li>Protocolos de respuesta a incidentes</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Cookies y Tecnologías Similares</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilizamos cookies técnicas necesarias para el funcionamiento de 
                  la aplicación. Puede configurar su navegador para rechazar cookies, 
                  aunque esto puede afectar la funcionalidad de ciertos servicios.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Menores de Edad</h2>
                <p className="text-sm text-muted-foreground leading-relaxe">
                  La aplicación no está dirigida a menores de 16 años. No recopilamos 
                  intencionadamente datos de menores sin el consentimiento parental 
                  correspondiente.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">13. Modificaciones</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nos reservamos el derecho a modificar esta política de privacidad. 
                  Los cambios significativos serán comunicados a través de la aplicación 
                  o por email cuando sea posible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">14. Contacto y Reclamaciones</h2>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>Para ejercer sus derechos o realizar consultas:</p>
                  <div className="ml-4">
                    <p><strong>Email:</strong> info@seda.es</p>
                    <p><strong>Web:</strong> <a href="https://www.constituyentes.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">www.constituyentes.es</a></p>
                  </div>
                  <p className="mt-3">
                    También puede presentar una reclamación ante la Agencia Española 
                    de Protección de Datos (AEPD) si considera que sus derechos han 
                    sido vulnerados.
                  </p>
                </div>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacidad;
