
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

const Terminos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
            Términos de Servicio
          </h1>
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Términos y Condiciones de Uso</CardTitle>
          <CardDescription>
            SEDA Electoral - Software Electoral de Datos Abiertos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full pr-4">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Aceptación de los Términos</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Al acceder y utilizar SEDA Electoral (en adelante, "la Aplicación"), 
                  usted acepta cumplir con estos Términos de Servicio y todas las leyes 
                  y regulaciones aplicables. Si no está de acuerdo con alguno de estos 
                  términos, no debe utilizar esta aplicación.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Descripción del Servicio</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SEDA Electoral es una plataforma desarrollada por Constituyentes para 
                  la verificación y gestión de actas electorales. La aplicación permite 
                  a los usuarios consultar resultados electorales, enviar actas, y 
                  realizar análisis de datos electorales de forma transparente y abierta.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Registro y Cuenta de Usuario</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para ciertas funcionalidades de la aplicación, puede ser necesario 
                  crear una cuenta. Usted es responsable de mantener la confidencialidad 
                  de su información de cuenta y de todas las actividades que ocurran 
                  bajo su cuenta.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Uso Permitido</h2>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>Usted se compromete a utilizar la aplicación únicamente para:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Consultar información electoral pública</li>
                    <li>Enviar actas electorales de forma veraz y precisa</li>
                    <li>Realizar análisis estadísticos con fines educativos o informativos</li>
                    <li>Contribuir a la transparencia del proceso electoral</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Uso Prohibido</h2>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>Está prohibido utilizar la aplicación para:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Enviar información falsa o manipulada</li>
                    <li>Interferir con el funcionamiento de la aplicación</li>
                    <li>Acceder sin autorización a datos restringidos</li>
                    <li>Utilizar la información para fines ilegales o fraudulentos</li>
                    <li>Difamar o atacar a personas, partidos políticos o instituciones</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Privacidad y Protección de Datos</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  El tratamiento de sus datos personales se rige por nuestra Política 
                  de Privacidad, que forma parte integral de estos términos. Consulte 
                  la Política de Privacidad para obtener información detallada sobre 
                  cómo recopilamos, utilizamos y protegemos su información.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Propiedad Intelectual</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Todo el contenido, diseño, código fuente y funcionalidades de SEDA 
                  Electoral son propiedad de Constituyentes y están protegidos por las 
                  leyes de propiedad intelectual aplicables. Los datos electorales 
                  proporcionados son de dominio público.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Limitación de Responsabilidad</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SEDA Electoral se proporciona "tal como está" sin garantías de ningún 
                  tipo. No nos hacemos responsables de la exactitud completa de los datos, 
                  interrupciones del servicio, o cualquier daño directo o indirecto que 
                  pueda resultar del uso de la aplicación.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Modificaciones</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier 
                  momento. Las modificaciones entrarán en vigor inmediatamente después 
                  de su publicación en la aplicación. El uso continuado de la aplicación 
                  constituye la aceptación de los términos modificados.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Terminación</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Podemos suspender o terminar su acceso a la aplicación en cualquier 
                  momento, sin previo aviso, por cualquier motivo, incluyendo la 
                  violación de estos términos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Ley Aplicable</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Estos términos se rigen por las leyes de España. Cualquier disputa 
                  relacionada con estos términos estará sujeta a la jurisdicción 
                  exclusiva de los tribunales españoles.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Contacto</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Si tiene preguntas sobre estos Términos de Servicio, puede contactarnos a 
                  través de:
                </p>
                <div className="ml-4 mt-2 text-sm text-muted-foreground">
                  <p>Email: info@seda.es</p>
                  <p>Web: <a href="https://www.constituyentes.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">www.constituyentes.es</a></p>
                </div>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terminos;
