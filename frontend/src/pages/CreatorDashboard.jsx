import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Film, DollarSign, PlayCircle, Upload, TrendingUp, CreditCard, Save, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreatorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bankParams, setBankParams] = useState({
    bank_name: '',
    account_type: 'Corriente',
    account_number: '',
    payout_email: '',
    bank_holder_name: '',
    bank_holder_rut: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, meRes] = await Promise.all([
          axios.get('/api/creator/stats'),
          axios.get('/api/auth/me')
        ]);
        setStats(statsRes.data);
        const user = meRes.data.user;
        if (user) {
          setBankParams({
            bank_name: user.bank_name || '',
            account_type: user.account_type || 'Corriente',
            account_number: user.account_number || '',
            payout_email: user.payout_email || '',
            bank_holder_name: user.bank_holder_name || '',
            bank_holder_rut: user.bank_holder_rut || ''
          });
        }
      } catch (err) {
        setError('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateMsg('');
    try {
      await axios.put('/api/creator/profile', bankParams);
      setUpdateMsg('Datos actualizados correctamente');
      setTimeout(() => setUpdateMsg(''), 3000);
    } catch (err) {
      alert('Error al actualizar datos bancarios');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="container text-center p-20 text-muted">Cargando dashboard de creador...</div>;
  if (error) return <div className="container text-danger text-center p-20">{error}</div>;

  return (
    <div className="container animate-fade-in pb-20">
      <div className="page-header mb-8">
        <div>
          <h1 className="mb-1 text-3xl font-bold">Panel de Creador</h1>
          <p className="text-muted">Gestiona tus contenidos y revisa tu saldo acumulado</p>
        </div>
        <Link to="/upload" className="btn btn-primary shadow-lg shadow-primary/20">
          <Upload size={20} /> Subir Nuevo Video
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Videos" value={stats.totalVideos} icon={<Film size={24} />} color="var(--primary)" />
        <StatCard title="Arriendos" value={stats.totalRentals} icon={<PlayCircle size={24} />} color="var(--accent)" />
        <StatCard 
          title="Por Liquidar" 
          value={Number(stats.totalPendingEarnings || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })} 
          icon={<DollarSign size={24} />} 
          color="#f59e0b" 
          subtext="Saldo pendiente de pago"
        />
        <StatCard 
          title="Cobrado" 
          value={Number(stats.totalPaidEarnings || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })} 
          icon={<CheckCircle size={24} />} 
          color="#8b5cf6" 
          subtext="Liquidado a tu cuenta"
        />
        <StatCard 
          title="Ganancias Totales" 
          value={Number(stats.totalEarnings || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })} 
          icon={<TrendingUp size={24} />} 
          color="#22c55e" 
          subtext="Histórico neto"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Column */}
        <div className="lg:col-span-2">
          <div className="page-header mb-4" style={{ justifyContent: 'flex-start', gap: '1rem', alignItems: 'center' }}>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Film size={24} className="text-primary" /> Mis Videos
            </h2>
            <span className="text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              {stats.videos.length} videos publicados
            </span>
          </div>

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Video & Contenido</th>
                  <th className="text-center">Vistas / Precio</th>
                  <th className="text-center">Liquidación</th>
                  <th className="text-right">Total Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {stats.videos.map(video => (
                  <tr key={video.id} className="zebra">
                    <td>
                      <div className="flex flex-col">
                        <div className="font-bold text-main" style={{ fontSize: '1.1rem' }}>{video.title}</div>
                        <div className="text-xs text-muted mt-1 uppercase tracking-tighter opacity-70">
                          ID: {video.id.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent uppercase tracking-widest">
                            {video.rentalCount} Arriendos
                          </span>
                          <span className="text-sm font-medium text-muted">
                            {Number(video.price).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })} / c.u.
                          </span>
                        </div>
                    </td>
                    <td className="text-center">
                        <div className="flex flex-col items-center">
                            {video.pendingEarnings > 0 ? (
                                <>
                                    <span className="text-[10px] text-amber font-bold uppercase tracking-tighter mb-1">Por Liquidar</span>
                                    <div className="text-amber font-bold" style={{ fontSize: '1.4rem', lineHeight: '1', letterSpacing: '-0.02em' }}>
                                        {Number(video.pendingEarnings || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
                                    </div>
                                </>
                            ) : video.paidEarnings > 0 ? (
                                <div className="bg-success-soft px-3 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle size={12} className="text-success" />
                                    <span className="text-[10px] font-bold text-success uppercase">Al día</span>
                                </div>
                            ) : (
                                <span className="text-[10px] text-muted opacity-30 font-bold uppercase">Sin ventas</span>
                            )}
                        </div>
                    </td>
                    <td className="text-right">
                       <div className="flex flex-col items-end">
                          <div className="font-bold text-success" style={{ fontSize: '1.1rem' }}>
                            {Number(video.totalEarnings || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
                          </div>
                          {video.paidEarnings > 0 && (
                            <span className="text-[9px] text-muted uppercase font-medium opacity-60">
                              Pagado: {Number(video.paidEarnings).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
                            </span>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
                {stats.videos.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-muted">
                      <div className="flex flex-col items-center gap-4">
                         <Film size={64} className="opacity-10" />
                         <p className="text-lg">Tu videoclub está vacío.</p>
                         <Link to="/upload" className="btn btn-secondary btn-sm">Subir mi primer video</Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank Account Settings Sidebar */}
        <div className="lg:col-span-1">
          <div className="card shadow-xl border-primary/20 bg-primary/5">
            <div className="p-6 border-b border-primary/20">
              <h2 className="text-xl font-bold m-0 flex items-center gap-2">
                <CreditCard size={20} className="text-primary" /> Datos de Pago
              </h2>
              <p className="text-xs text-muted mt-2">Introduce tu información bancaria chilena para recibir tus pagos.</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div className="form-group">
                <label className="text-xs font-bold text-muted uppercase mb-1 block">Banco</label>
                <select 
                  className="form-control" 
                  value={bankParams.bank_name}
                  onChange={(e) => setBankParams({...bankParams, bank_name: e.target.value})}
                  required
                >
                  <option value="">Seleccione Banco</option>
                  <option value="Banco Estado">Banco Estado</option>
                  <option value="Santander">Santander</option>
                  <option value="Banco de Chile">Banco de Chile</option>
                  <option value="BCI">BCI</option>
                  <option value="Itaú">Itaú</option>
                  <option value="Scotiabank">Scotiabank</option>
                  <option value="Banco Falabella">Banco Falabella</option>
                  <option value="Banco Ripley">Banco Ripley</option>
                  <option value="Tenpo">Tenpo / Prepago</option>
                </select>
              </div>
              <div className="form-group">
                <label className="text-xs font-bold text-muted uppercase mb-1 block">Tipo de Cuenta</label>
                <select 
                  className="form-control" 
                  value={bankParams.account_type}
                  onChange={(e) => setBankParams({...bankParams, account_type: e.target.value})}
                  required
                >
                  <option value="Corriente">Cuenta Corriente</option>
                  <option value="Vista">Cuenta Vista / RUT</option>
                  <option value="Ahorro">Cuenta de Ahorro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="text-xs font-bold text-muted uppercase mb-1 block">Nombre del Titular</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={bankParams.bank_holder_name}
                  onChange={(e) => setBankParams({...bankParams, bank_holder_name: e.target.value})}
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="form-group">
                <label className="text-xs font-bold text-muted uppercase mb-1 block">RUT del Titular</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={bankParams.bank_holder_rut}
                  onChange={(e) => setBankParams({...bankParams, bank_holder_rut: e.target.value})}
                  placeholder="12.345.678-9"
                  required
                />
              </div>
              <div className="form-group">
                <label className="text-xs font-bold text-muted uppercase mb-1 block">Número de Cuenta</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={bankParams.account_number}
                  onChange={(e) => setBankParams({...bankParams, account_number: e.target.value})}
                  placeholder="Ej: 12345678"
                  required
                />
              </div>
              <div className="form-group">
                <label className="text-xs font-bold text-muted uppercase mb-1 block">Email Notificación</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={bankParams.payout_email}
                  onChange={(e) => setBankParams({...bankParams, payout_email: e.target.value})}
                  placeholder="tu@email.com"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
                disabled={updating}
              >
                {updating ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
              </button>

              {updateMsg && (
                <div className="text-success text-center text-xs mt-2 animate-bounce flex items-center justify-center gap-1">
                  <CheckCircle size={14} /> {updateMsg}
                </div>
              )}
            </form>
          </div>
          
          <div className="mt-6 p-4 rounded-xl border border-dashed border-border/60 bg-muted/10 text-center">
            <p className="text-[10px] text-muted uppercase tracking-tighter">
              Liquidaciones semanales automáticas sobre el 90% de tus ventas netas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, subtext }) => (
  <div className="card p-6 shadow-lg border-border/40 hover:border-primary/40 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div style={{ color: color, backgroundColor: `${color}15`, padding: '12px', borderRadius: '14px' }}>
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-muted text-xs font-bold uppercase tracking-widest m-0">{title}</p>
      <p className="text-3xl font-extrabold m-0 text-main">{value}</p>
      {subtext && <p className="text-[10px] text-muted-foreground font-medium m-0">{subtext}</p>}
    </div>
  </div>
);

export default CreatorDashboard;
