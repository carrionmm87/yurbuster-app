import React, { useEffect } from 'react';
import { Shield, Check, Info, AlertTriangle } from 'lucide-react';

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container animate-fade-in section">
      <div className="terms-content">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h1 className="text-4xl font-bold">Términos y Condiciones Generales de Uso</h1>
          <p className="text-muted text-lg">Última actualización: Abril 2026</p>
        </div>

        <section className="card p-8 mb-8" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'var(--primary)' }}>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-primary" /> DECLARACIÓN DE MAYORÍA DE EDAD (+18)
          </h2>
          <p>
            YurBuster es una plataforma que aloja y distribuye contenido digital explícito clasificado exclusivamente para adultos. Al registrarse, acceder, usar los servicios o realizar transacciones en esta plataforma, usted <strong>declara y garantiza bajo juramento que tiene al menos 18 años de edad</strong> (o la mayoría de edad legal en su jurisdicción). El acceso de menores está estrictamente prohibido. Cualquier cuenta creada por una persona menor de edad será reportada y eliminada inmediatamente sin derecho a reembolso.
          </p>
        </section>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Info size={24} color="var(--primary)" /> 1. Naturaleza del Servicio</h2>
            <p>
              YurBuster opera como un intermediario tecnológico y plataforma de Video On Demand (VOD) transaccional. Facilitamos un espacio donde creadores de contenido pueden comercializar licencias de visualización temporal de material audiovisual a usuarios consumidores. Al realizar un pago exitoso mediante nuestro proveedor <strong>Flow.cl / Transbank</strong>, el Usuario adquiere el derecho de visualización en streaming del contenido durante un periodo continuo de <strong>24 horas</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Política Estricta Anti-Piratería y Propiedad Intelectual</h2>
            <p>
              Todo material audiovisual alojado en YurBuster es propiedad intelectual de sus respectivos Creadores. La licencia de visualización es <strong>personal, privada e intransferible</strong>. 
            </p>
            <ul className="list-disc pl-6 mt-4 opacity-80">
              <li>Queda estrictamente prohibido descargar, grabar la pantalla (screen record), reproducir, distribuir, exhibir públicamente o revender el contenido.</li>
              <li>El sistema monitorea activamente intentos de ripeo y conexiones simultáneas. Cualquier violación resultará en el banneo permanente de la IP, la suspensión de la cuenta, y la posible persecución bajo la Ley N° 17.336 de Propiedad Intelectual de Chile.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">3. Pagos, Tarifas y Facturación</h2>
            <p>
              Toda transacción realizada en la plataforma se procesa en <strong>Pesos Chilenos (CLP)</strong>. 
            </p>
            <ul className="list-disc pl-6 mt-4 opacity-80">
              <li>Los pagos son procesados de manera segura a través de pasarelas locales reguladas (Flow.cl, Webpay Plus, Mach, etc.).</li>
              <li>Al ser un producto digital de consumo y entrega inmediata una vez desbloqueado, <strong>no existen devoluciones ni derecho a retracto</strong> tras la confirmación del pago, en conformidad con la normativa actual sobre bienes digitales perecibles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Responsabilidad de los Creadores</h2>
            <p>
              Si usted se registra como "Creador", acepta que es legalmente responsable de la autoría y los derechos del contenido que sube. YurBuster aplica una política de **Tolerancia Cero** ante:
            </p>
            <ul className="list-disc pl-6 mt-4 opacity-80">
              <li>Material no consensuado ("Revenge Porn"). Toda persona que aparezca en los videos debe haber brindado su consentimiento documentado.</li>
              <li>Cualquier forma de Explotación Sexual Infantil (CSAM). Sufrirá denuncia inmediata ante PDI y autoridades internacionales.</li>
              <li>Zoofilia, violencia extrema no simulada, o actividades expresamente tipificadas como ilegales por la ley de la República de Chile.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">5. Liberación de Responsabilidad</h2>
            <p>
              YurBuster actúa como un proveedor de servicios de alojamiento y cobro. No dirigimos ni producimos el contenido de los Creadores. Si bien moderamos activamente la plataforma, no nos hacemos responsables por el contenido publicado por terceros. En caso de reclamos de DMCA (Derechos de Autor), actuaremos con prontitud para remover el material infractor.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">6. Suspensión de Cuentas y Jurisdicción</h2>
            <p>
              YurBuster se reserva el derecho de rechazar el servicio y suspender cuentas sin previo aviso y sin reembolso en caso de detectar fraudes de pago (Chargebacks maliciosos), uso indebido o violación de estos términos. La jurisdicción competente para resolver disputas serán los Tribunales de Santiago, Chile.
            </p>
          </section>
        </div>

        <div className="mt-12 p-8 text-center border-t border-border">
          <p className="text-muted text-sm">
            Titular del Servicio: <strong>Manuel Carrión Maldonado</strong><br />
            Plataforma Operada desde: Chile<br />
            Contacto de Soporte Legal y Compliance: <strong>soporte@yurbuster.com</strong>
          </p>
          <button onClick={() => window.history.back()} className="btn btn-primary mt-6">
            Aceptar y Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default Terms;
