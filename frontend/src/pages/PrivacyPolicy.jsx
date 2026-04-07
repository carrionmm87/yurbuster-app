import React from 'react';
import { Lock, Eye, ShieldCheck } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="container animate-fade-in section">
      <div className="terms-content">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Lock size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h1 className="text-4xl font-bold">Política de Privacidad</h1>
          <p className="text-muted text-lg">Protección de Datos Personales (Ley N° 19.628)</p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold">1. Recopilación de Información de Identidad</h2>
            <p>
              YurBuster recopila únicamente los datos estrictamente necesarios para la validación y prestación del servicio solicitado: nombre de usuario, correo electrónico institucional o personal y registros de transacciones exitosas. No almacenamos datos financieros sensibles (como números de tarjetas); todo el procesamiento se delega a pasarelas certificadas (Flow/Webpay) mediante entornos cifrados externos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Uso de la Información</h2>
            <p>
              Sus datos se utilizan exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Gestionar sus arriendos y accesos a video.</li>
              <li>Prevenir fraudes y asegurar la integridad de la plataforma.</li>
              <li>Enviar notificaciones críticas sobre su cuenta o soporte técnico.</li>
              <li>Cumplir con requerimientos legales de la jurisdicción chilena e internacional.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">3. Cookies y Seguimiento</h2>
            <p>
              Utilizamos cookies fundamentales para mantener su sesión activa y recordar sus preferencias de visualización. No compartimos datos de navegación con terceros con fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Seguridad de los Datos</h2>
            <p>
              Implementamos protocolos SSL (Security Socket Layer) de última generación para cifrar toda la comunicación entre su navegador y nuestros servidores. Sus datos están protegidos en centros de datos con seguridad biométrica y vigilancia 24/7.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">5. Sus Derechos</h2>
            <p>
              En cualquier momento, usted puede solicitar el acceso, rectificación o eliminación definitiva de su cuenta de usuario contactando a nuestro equipo de soporte. Responderemos a su solicitud en un plazo máximo de 48 horas hábiles.
            </p>
          </section>
        </div>

        <div className="mt-12 p-8 text-center border-t border-border">
          <p className="text-muted text-sm">
            Para consultas sobre su privacidad: <strong>privacidad@yurbuster.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
