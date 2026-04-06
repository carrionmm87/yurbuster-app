import React, { useEffect } from 'react';
import { Shield, Check, Info } from 'lucide-react';

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container animate-fade-in section">
      <div className="terms-content">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h1 className="text-4xl font-bold">Términos y Condiciones del Servicio</h1>
          <p className="text-muted text-lg">Actualizado conforme a estándares de comercio electrónico - Abril 2026</p>
        </div>

        <section className="card p-8 mb-8" style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--primary)' }}>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Check size={20} className="text-primary" /> Verificación de Mayoría de Edad (18+)
          </h2>
          <p>
            Al acceder a YurBuster, usted declara bajo juramento ser mayor de 18 años y tener la capacidad legal en su jurisdicción para consumir este tipo de contenido. YurBuster cumple con las regulaciones de cumplimiento 18 U.S.C. 2257. El contenido de este sitio es exclusivo para adultos y su acceso por menores de edad está estrictamente prohibido.
          </p>
        </section>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Info size={24} color="var(--primary)" /> 1. Descripción del Servicio</h2>
            <p>
              YurBuster es una plataforma de arriendo de video bajo demanda (VOD). Al realizar un pago, el usuario obtiene una licencia limitada, intransferible y privada para visualizar el contenido seleccionado durante un periodo de **24 horas**. Transcurrido este tiempo, el acceso expirará automáticamente. 
            </p>
            <p className="mt-4">
              <strong>Moneda de Transacción:</strong> Todos los precios indicados en la plataforma se expresan en **Dólares de los Estados Unidos (USD)**. Su banco emisor (ej. Santander Chile) realizará la conversión a pesos chilenos según el tipo de cambio vigente al momento de la compra.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Derechos del Consumidor (Ley 19.496)</h2>
            <p>
              YurBuster cumple estrictamente con la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores en Chile. Nos comprometemos a entregar información veraz y oportuna sobre nuestros servicios de arriendo de video. Para cualquier disputa, nuestra política de reembolsos está disponible de forma detallada en la sección correspondiente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">3. Entrega de Contenido (Delivery)</h2>
            <p>
              La entrega es inmediata. Una vez que la transacción es autorizada por CCBill, el sistema redireccionará al usuario automáticamente a la página de visualización. Asimismo, el usuario recibirá un correo electrónico con el enlace de acceso directo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Propiedad Intelectual (Ley 17.336)</h2>
            <p>
              Todo el contenido, diseños, logos y software de esta plataforma están protegidos por la Ley N° 17.336 de Propiedad Intelectual. El arriendo otorga una licencia de uso personal y privado; queda terminantemente prohibida la grabación, descarga o distribución de los archivos de video.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">5. Registro y Seguridad de Cuenta</h2>
            <p>
              El usuario es responsable de mantener la confidencialidad de su cuenta. Cualquier actividad realizada bajo su usuario será de su exclusiva responsabilidad. YurBuster se reserva el derecho de cancelar cuentas que presenten patrones de uso fraudulento o compartido.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">6. Jurisdicción y Ley Aplicable</h2>
            <p>
              Cualquier controversia derivada de este contrato será sometida a las leyes de la República de Chile y a la jurisdicción de los Tribunales Ordinarios de Justicia de Santiago.
            </p>
          </section>
        </div>

        <div className="mt-12 p-8 text-center border-t border-border">
          <p className="text-muted text-sm">
            Titular del Servicio: <strong>Manuel Carrión</strong><br />
            Representante Legal: Manuel Carrión<br />
            Dirección: Hamurabi #1526, Maipú, Santiago, Chile<br />
            Soporte Legal: <strong>soporte@yurbuster.com</strong>
          </p>
          <button onClick={() => window.history.back()} className="btn btn-primary mt-6">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default Terms;
