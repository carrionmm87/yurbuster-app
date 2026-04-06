import React from 'react';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';

const Contact = () => {
  return (
    <div className="container animate-fade-in section">
      <div className="terms-content">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Mail size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h1 className="text-4xl font-bold">Contáctenos</h1>
          <p className="text-muted text-lg">Estamos aquí para resolver sus dudas y asistirlo</p>
        </div>

        <div className="card p-12 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-12">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                  <Mail size={24} color="var(--primary)" /> Correo Electrónico
                </h3>
                <p className="text-muted">
                  Para soporte técnico, problemas de pago o consultas generales:<br />
                  <strong className="text-2xl mt-4 block">soporte@yurbuster.com</strong>
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                  <MapPin size={24} color="var(--primary)" /> Oficina Central
                </h3>
                <p className="text-muted">
                  YurBuster Inc. / [TU NOMBRE O EMPRESA]<br />
                  Santiago de Chile, Región Metropolitana<br />
                  [Tu dirección aquí - Requerido por CCBill]
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                  <Phone size={24} color="var(--primary)" /> Soporte Telefónico
                </h3>
                <p className="text-muted">
                  Disponible de Lunes a Viernes (09:00 - 18:00 CLT):<br />
                  <strong>+56 9 [Tu teléfono aquí]</strong>
                </p>
              </div>
            </div>

            <div className="p-8 rounded-lg" style={{ backgroundColor: 'rgba(99, 102, 241, 0.03)', border: '1px solid var(--border)' }}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <MessageSquare size={24} color="var(--primary)" /> Envíenos un mensaje
              </h3>
              <form className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium">Nombre Completo</label>
                  <input type="text" className="input w-full" placeholder="Su nombre" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">Correo Electrónico</label>
                  <input type="email" className="input w-full" placeholder="email@ejemplo.com" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">Mensaje</label>
                  <textarea className="input w-full h-32" placeholder="¿En qué podemos ayudarle?"></textarea>
                </div>
                <button type="button" className="btn btn-primary w-full">Enviar Mensaje</button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-12 p-8 text-center bg-card rounded-lg border border-border">
          <p className="text-muted text-sm italic">
            * Todas las consultas se responden en un plazo máximo de 24 a 48 horas hábiles.
            Agradecemos su paciencia y le garantizamos nuestra total dedicación a su seguridad y satisfacción.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
