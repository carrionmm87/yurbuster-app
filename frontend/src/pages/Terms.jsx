import React, { useEffect } from 'react';
import { Shield, Check } from 'lucide-react';

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container animate-fade-in section">
      <div className="terms-content">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h1 className="text-4xl font-bold">Términos y Condiciones Legales</h1>
          <p className="text-muted text-lg">Actualizado conforme a la legislación chilena - Marzo 2026</p>
        </div>

        <section className="card p-8 mb-8" style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--primary)' }}>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Check size={20} className="text-primary" /> Verificación de Mayoría de Edad (18+)
          </h2>
          <p>
            Al acceder a YurBuster, usted declara bajo juramento ser mayor de 18 años. El contenido de este sitio es exclusivo para adultos y su acceso por menores de edad está estrictamente prohibido, de acuerdo con la Ley N° 20.084 y normativas de protección a la infancia en Chile.
          </p>
        </section>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold">1. Derechos del Consumidor (Ley 19.496)</h2>
            <p>
              YurBuster cumple estrictamente con la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores. Nos comprometemos a entregar información veraz y oportuna sobre nuestros servicios de arriendo de video. 
              Cualquier consulta o reclamo puede ser dirigido a nuestro soporte técnico, sin perjuicio de los derechos que le asisten ante el SERNAC.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Derecho de Retracto</h2>
            <p>
              Conforme al Artículo 3 bis, letra b) de la Ley 19.496, por la naturaleza del servicio digital (contenido que se consume de forma inmediata tras el pago), <strong>no opera el derecho de retracto</strong> una vez que el usuario ha iniciado la visualización del contenido arrendado o ha recibido el código de acceso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">3. Protección de Datos Personales (Ley 19.628)</h2>
            <p>
              El tratamiento de sus datos personales se rige por la Ley N° 19.628. Sus datos (email, hábitos de navegación y transacciones) son tratados con la más estricta confidencialidad y solo con el fin de gestionar su acceso y mejorar la experiencia del servicio. Usted podrá ejercer sus derechos de acceso, rectificación, cancelación y oposición enviando un correo a soporte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Propiedad Intelectual (Ley 17.336)</h2>
            <p>
              Todo el contenido, diseños, logos y software de esta plataforma están protegidos por la Ley N° 17.336 de Propiedad Intelectual. Queda prohibida la reproducción, distribución, comunicación pública o transformación de cualquier contenido sin la autorización expresa de los titulares de los derechos. El arriendo otorga una licencia de uso personal, privado e intransferible por 24 horas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">5. Responsabilidad del Usuario</h2>
            <p>
              El usuario es responsable de mantener la confidencialidad de su cuenta. YurBuster no se hace responsable por el uso indebido de los accesos por parte de terceros. Así mismo, el usuario garantiza que no utilizará la plataforma para actividades ilícitas según la ley chilena.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">6. Jurisdicción</h2>
            <p>
              Cualquier controversia derivada del presente contrato será sometida a las leyes de la República de Chile y a la jurisdicción de los Tribunales Ordinarios de Justicia de la ciudad de Santiago.
            </p>
          </section>
        </div>

        <div className="mt-12 p-8 text-center border-t border-border">
          <p className="text-muted text-sm">
            Para asistencia legal o técnica: <strong>soporte@yurbuster.cl</strong>
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
