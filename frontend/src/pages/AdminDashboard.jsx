import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Video, ShoppingCart, DollarSign, PieChart, Activity, ShieldCheck, Briefcase, CheckCircle2, Ticket } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [creatorsEarnings, setCreatorsEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, earningsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/creators-earnings')
      ]);
      setStats(statsRes.data);
      setCreatorsEarnings(earningsRes.data);
    } catch (err) {
      setError('Acceso denegado o error de servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayout = async (userId) => {
    if (!window.confirm('¿Confirmas que ya has realizado la transferencia bancaria y quieres marcar este saldo como pagado?')) return;
    
    try {
      await axios.post(`/api/admin/payout/${userId}`);
      alert('Pago procesado exitosamente en el sistema.');
      fetchData(); // Refresh stats
    } catch (err) {
      alert('Error al procesar el pago');
    }
  };

  if (loading) return <div className="p-20 text-center text-muted animate-pulse">Cargando estadísticas globales...</div>;
  if (error) return (
    <div className="container p-20 text-center">
      <div className="card p-8 border-red-500/30 bg-red-500/5">
        <ShieldCheck size={48} className="mx-auto mb-4 text-red-500 opacity-50" />
        <h2 className="text-red-500 mb-2 font-bold">Error de Acceso</h2>
        <p className="text-muted">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="container animate-fade-in pb-20">
      <div className="page-header mb-8">
        <div>
          <h1 className="mb-1">Panel de Administración</h1>
          <p className="text-muted">Vista general del rendimiento del ecosistema</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-success-soft text-success rounded-lg flex items-center gap-2 text-sm font-medium">
            <Activity size={16} /> Sistema Online
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Usuarios" value={stats.totalUsers} icon={<Users size={20} />} color="var(--primary)" />
        <StatCard title="Creadores" value={stats.totalCreators} icon={<Briefcase size={20} />} color="var(--accent)" />
        <StatCard title="Videos Totales" value={stats.totalVideos} icon={<Video size={20} />} color="#f59e0b" />
        <StatCard title="Arriendos" value={stats.totalRentals} icon={<ShoppingCart size={20} />} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 card p-8 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(30, 41, 59, 0.4) 100%)' }}>
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <DollarSign size={20} className="text-success" /> Distribución de Ingresos
            </h3>
            <div className="space-y-6">
              <RevenueRow 
                label="Ingresos Totales (Bruto)" 
                value={stats.totalRevenue} 
                isBold 
                color="var(--text-main)" 
              />
              <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${(stats.totalCreatorsPending / stats.totalRevenue) * 100}%`, height: '100%', backgroundColor: 'var(--primary)' }}></div>
                <div style={{ width: `${(stats.totalCreatorsPaid / stats.totalRevenue) * 100}%`, height: '100%', backgroundColor: '#8b5cf6' }}></div>
                <div style={{ width: `${(stats.totalPlatformFee / stats.totalRevenue) * 100}%`, height: '100%', backgroundColor: 'var(--accent)' }}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RevenueRow 
                  label="Pendiente Creadores" 
                  value={stats.totalCreatorsPending} 
                  color="var(--primary)" 
                  subtext="Transferencias pendientes"
                />
                <RevenueRow 
                  label="Pagado Creadores" 
                  value={stats.totalCreatorsPaid} 
                  color="#8b5cf6" 
                  subtext="Liquidaciones realizadas"
                />
                <RevenueRow 
                  label="Comisión Plataforma" 
                  value={stats.totalPlatformFee} 
                  color="var(--accent)" 
                  subtext="Ganancia neta sistema"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-8 text-center flex flex-col items-center justify-center border-primary/20 bg-primary/5">
          <PieChart size={48} className="text-primary mb-4 opacity-50" />
          <h3 className="text-muted text-sm uppercase tracking-wider mb-2">Ticket Promedio</h3>
          <p className="text-4xl font-bold">
            ${stats.totalRentals > 0 ? (stats.totalRevenue / stats.totalRentals).toFixed(0) : 0}
          </p>
          <p className="text-muted text-xs mt-2">Basado en {stats.totalRentals} transacciones</p>
        </div>
      </div>

      <div className="card p-8 mb-8 border-primary/10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <Users size={24} className="text-primary" /> Pagos a Creadores
          </h3>
          <span className="text-xs text-muted uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
            Corte de caja actual
          </span>
        </div>

        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Creador</th>
                <th style={{ width: '35%' }}>Información Bancaria</th>
                <th className="text-center">Estado / Pendiente</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {creatorsEarnings.length > 0 ? (
                creatorsEarnings.map((creator) => (
                  <tr key={creator.id} className="zebra">
                    <td>
                        <div className="flex flex-col">
                          <div className="font-bold text-main flex items-center gap-2">
                            {creator.username}
                            {creator.pendingEarnings === 0 && creator.totalEarnings > 0 && (
                              <span className="text-success" title="Cuentas al día">
                                <ShieldCheck size={14} />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted" style={{ marginTop: '4px', opacity: 0.7 }}>
                            {creator.payout_email || 'Sin contacto'}
                          </div>
                        </div>
                    </td>

                    <td>
                        {creator.bank_name ? (
                          <div className="bank-info-card">
                            <div className="bank-info-header">
                                <span className="font-bold text-primary text-xs uppercase truncate">{creator.bank_name}</span>
                                <span className="bank-badge">{creator.account_type}</span>
                            </div>
                            <div className="account-number-box truncate">
                                {creator.account_number}
                            </div>
                            {(creator.bank_holder_name || creator.bank_holder_rut) && (
                                <div className="holder-info-grid" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex flex-col">
                                        <span style={{ opacity: 0.5, marginBottom: '2px' }}>Titular</span>
                                        <span className="font-bold truncate" title={creator.bank_holder_name}>{creator.bank_holder_name || '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span style={{ opacity: 0.5, marginBottom: '2px' }}>RUT</span>
                                        <span className="font-bold">{creator.bank_holder_rut || '-'}</span>
                                    </div>
                                </div>
                            )}
                          </div>
                        ) : (
                          <div className="bank-info-card bg-amber-soft" style={{ borderStyle: 'dashed', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
                            <div className="text-xs font-bold uppercase text-amber">Datos No Registrados</div>
                            <div className="text-xs opacity-60 mt-1">Legacy: {creator.legacy_bank_account || 'N/A'}</div>
                          </div>
                        )}
                    </td>
                    
                    <td className="text-center">
                      {creator.pendingEarnings > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-muted uppercase font-bold opacity-60">Por Liquidar</span>
                            <div className="text-success font-bold" style={{ fontSize: '1.8rem', letterSpacing: '-0.05em' }}>
                              ${(creator.pendingEarnings || 0).toLocaleString()}
                            </div>
                            {creator.paidEarnings > 0 && (
                                <span className="text-xs text-muted" style={{ opacity: 0.5 }}>Total Pagado: ${creator.paidEarnings.toLocaleString()}</span>
                            )}
                        </div>
                      ) : creator.totalEarnings > 0 ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="btn bg-success-soft" style={{ borderRadius: '20px', padding: '0.4rem 1rem' }}>
                              <Ticket size={14} style={{ transform: 'rotate(12deg)' }} />
                              <span className="text-xs font-bold uppercase">Pagado</span>
                            </div>
                            <span className="text-xs text-muted" style={{ opacity: 0.5 }}>Historial: ${creator.totalEarnings.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="text-muted text-xs opacity-30 uppercase font-bold">Sin Deuda</div>
                      )}
                    </td>

                    <td className="text-right">
                        {creator.pendingEarnings > 0 ? (
                          <button 
                              className="btn btn-primary" 
                              style={{ padding: '0.75rem 1.25rem', fontSize: '0.8rem' }}
                              onClick={() => handlePayout(creator.id)}
                          >
                              <DollarSign size={14} />
                              <span>Liquidar Saldo</span>
                          </button>
                        ) : creator.totalEarnings > 0 ? (
                          <div className="btn bg-success-soft" style={{ cursor: 'default', fontSize: '0.7rem' }}>
                            <CheckCircle2 size={14} />
                            <span>TRANSACCIÓN COMPLETA</span>
                          </div>
                        ) : (
                          <span className="text-muted text-xs opacity-20 uppercase font-bold">Inactivo</span>
                        )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '5rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-4 opacity-30">
                        <Users size={64} />
                        <p className="text-lg">No se encontraron creadores en el sistema.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6 border-dashed border-2 border-border/50 bg-transparent">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-muted p-3 rounded-full">
                    <Activity size={24} className="text-muted-foreground" />
                </div>
                <div>
                    <h4 className="font-semibold">Monitoreo de Actividad</h4>
                    <p className="text-sm text-muted">Todos los sistemas funcionando correctamente. No se reportan incidencias.</p>
                </div>
            </div>
            <button className="btn btn-secondary text-sm">Ver Logs</button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="card p-6 hover:border-primary/50 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
    </div>
    <p className="text-sm text-muted font-medium uppercase tracking-widest">{title}</p>
    <p className="text-3xl font-bold mt-1 text-main">{value}</p>
  </div>
);

const RevenueRow = ({ label, value, isBold, color, subtext }) => (
  <div>
    <div className="flex justify-between items-baseline">
      <span className="text-muted text-sm font-medium">{label}</span>
      <span className={`${isBold ? 'text-2xl' : 'text-xl'} font-bold`} style={{ color }}>
        ${(value || 0).toLocaleString()}
      </span>
    </div>
    {subtext && <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">{subtext}</p>}
  </div>
);

export default AdminDashboard;
