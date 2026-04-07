import React from 'react';
import { RotateCcw, AlertTriangle, ShieldOff } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="container animate-fade-in section">
      <div className="terms-content">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <RotateCcw size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h1 className="text-4xl font-bold">Política de Reembolsos y Cancelaciones</h1>
          <p className="text-muted text-lg">Información sobre su derecho a devolución YurBuster</p>
        </div>

        <div className="space-y-12">
          <section className="card p-8 mb-8" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle size={20} color="var(--destructive)" /> Garantía de Satisfacción 24h
            </h2>
            <p>
              En YurBuster, nos comprometemos a ofrecer la mejor experiencia de visualización. Si usted tiene problemas técnicos que le impiden disfrutar del contenido arrendado, cuenta con un plazo de **24 horas** desde el momento de la transacción para solicitar un reembolso completo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">1. Condiciones para el Reembolso</h2>
            <p>
              El reembolso se procesará de forma inmediata si se cumple alguna de las siguientes condiciones:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>El video presenta errores de reproducción constantes atribuibles a nuestro servidor.</li>
              <li>Hubo una duplicidad accidental en el cobro de la misma orden.</li>
              <li>El contenido no coincide con el título o descripción proporcionada.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Restricciones</h2>
            <p>
              Cumpliendo con la Ley 19.496 de Protección al Consumidor en Chile, no se realizarán reembolsos en los siguientes casos:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Si el usuario ya ha visualizado **más del 10%** del contenido arrendado.</li>
              <li>Errores de conexión de internet del usuario no relacionados con YurBuster.</li>
              <li>Si han pasado más de 24 horas desde la transacción sin que se haya reportado el problema técnico.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">3. Proceso para Solicitar un Reembolso</h2>
            <p>
              Para iniciar el proceso de revisión de su caso, envíe un correo electrónico a nuestro equipo de soporte corporativo con la siguiente información:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li>Número de orden o correo electrónico asociado a la transacción.</li>
              <li>ID o título del contenido digital arrendado.</li>
              <li>Descripción detallada o captura del error técnico reportado.</li>
            </ol>
            <p className="mt-4">
              Todos los reembolsos autorizados se procesarán a través de la misma pasarela de pago original (Flow) y los tiempos de acreditación dependerán de su entidad bancaria nacional, variando usualmente entre **3 y 10 días hábiles**.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Cancelación de Transacciones</h2>
            <p>
              Debido a que nuestro servicio opera bajo la modalidad de "Arriendo Instantáneo", la transacción no puede ser cancelada una vez que el acceso al video ha sido generado automáticamente por el sistema tras el pago.
            </p>
          </section>
        </div>

        <div className="mt-12 p-8 text-center border-t border-border">
          <p className="text-muted text-sm">
            Si tiene alguna duda sobre esta política: <strong>soporte@yurbuster.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
