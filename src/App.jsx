import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';

const defaultProjects = [
  {
    id: 1,
    client: 'María López',
    phone: '8325551234',
    address: 'Houston, TX',
    type: 'Kitchen Cabinets',
    materials: 'Gabinetes shaker blancos y herrajes suaves',
    labor: 'Fabricación e instalación',
    installation: 'Instalación completa en cocina',
    amount: 8500,
    downPaymentPercent: 50,
    timeline: '2-3 semanas',
    warranty: 'Garantía incluida en instalación',
  },
];

const emptyForm = {
  client: '',
  phone: '',
  address: '',
  type: '',
  materials: '',
  labor: '',
  installation: '',
  amount: '',
  downPaymentPercent: 50,
  timeline: '2-3 semanas',
  warranty: 'Garantía incluida en instalación',
};

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('smp-pdf-projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed);
      setSelectedProjectId(parsed[0]?.id ?? null);
    } else {
      setProjects(defaultProjects);
      setSelectedProjectId(defaultProjects[0].id);
    }
  }, []);

  useEffect(() => {
    if (projects.length) {
      localStorage.setItem('smp-pdf-projects', JSON.stringify(projects));
    }
  }, [projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  const currency = (value) => `$${Number(value || 0).toLocaleString()}`;

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.client || !form.type || !form.amount) return;

    const normalizedProject = {
      id: editingId || Date.now(),
      client: form.client,
      phone: form.phone,
      address: form.address,
      type: form.type,
      materials: form.materials,
      labor: form.labor,
      installation: form.installation,
      amount: Number(form.amount),
      downPaymentPercent: Number(form.downPaymentPercent || 50),
      timeline: form.timeline,
      warranty: form.warranty,
    };

    if (editingId) {
      setProjects((prev) => prev.map((project) => (project.id === editingId ? normalizedProject : project)));
      setSelectedProjectId(editingId);
      setEditingId(null);
    } else {
      setProjects((prev) => [normalizedProject, ...prev]);
      setSelectedProjectId(normalizedProject.id);
    }

    setForm(emptyForm);
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setSelectedProjectId(project.id);
    setForm({
      client: project.client || '',
      phone: project.phone || '',
      address: project.address || '',
      type: project.type || '',
      materials: project.materials || '',
      labor: project.labor || '',
      installation: project.installation || '',
      amount: String(project.amount || ''),
      downPaymentPercent: String(project.downPaymentPercent || 50),
      timeline: project.timeline || '2-3 semanas',
      warranty: project.warranty || 'Garantía incluida en instalación',
    });
  };

  const handleDelete = (id) => {
    const updated = projects.filter((project) => project.id !== id);
    setProjects(updated);
    if (selectedProjectId === id) setSelectedProjectId(updated[0]?.id ?? null);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  };

  const generatePDF = (project) => {
    if (!project) return;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const materialsCost = Math.round(project.amount * 0.6);
    const laborCost = Math.round(project.amount * 0.3);
    const installationCost = project.amount - materialsCost - laborCost;
    const downPaymentAmount = Math.round(project.amount * (project.downPaymentPercent / 100));
    const finalPayment = project.amount - downPaymentAmount;

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 792, 'F');

    doc.setDrawColor(201, 169, 97);
    doc.setLineWidth(1.2);
    doc.line(40, 42, pageWidth - 40, 42);
    doc.line(40, 750, pageWidth - 40, 750);

    doc.setTextColor(29, 47, 84);
    doc.setFont('times', 'bold');
    doc.setFontSize(34);
    doc.text('SMP', pageWidth / 2, 95, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('SERVICES &', pageWidth / 2, 120, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(26);
    doc.text('CONSTRUCTION', pageWidth / 2, 152, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('CABINETS • COUNTERTOPS • REMODELING', pageWidth / 2, 176, { align: 'center' });

    // House mark
    doc.setDrawColor(29, 47, 84);
    doc.setLineWidth(2);
    doc.line(pageWidth / 2 - 70, 62, pageWidth / 2, 24);
    doc.line(pageWidth / 2 + 70, 62, pageWidth / 2, 24);
    doc.line(pageWidth / 2 - 62, 62, pageWidth / 2 - 8, 35);
    doc.line(pageWidth / 2 + 62, 62, pageWidth / 2 + 8, 35);
    doc.rect(pageWidth / 2 - 13, 38, 10, 10);
    doc.rect(pageWidth / 2 + 3, 38, 10, 10);
    doc.setFillColor(29, 47, 84);
    doc.rect(pageWidth / 2 + 70, 28, 8, 16, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.text('Cotización', 56, 235);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Cliente:', 56, 282);
    doc.text('Teléfono:', 56, 312);
    doc.text('Dirección:', 56, 342);
    doc.text('Proyecto:', 56, 372);

    doc.setFont('helvetica', 'normal');
    doc.text(project.client || '-', 140, 282);
    doc.text(project.phone || '-', 140, 312);
    doc.text(project.address || '-', 140, 342);
    doc.text(project.type || '-', 140, 372);

    const tableX = 56;
    const tableY = 410;
    const tableW = pageWidth - 112;
    const conceptW = 430;
    const priceW = tableW - conceptW;

    doc.setFillColor(244, 239, 227);
    doc.rect(tableX, tableY, tableW, 34, 'F');
    doc.setDrawColor(215, 215, 215);
    doc.rect(tableX, tableY, tableW, 136);
    doc.line(tableX + conceptW, tableY, tableX + conceptW, tableY + 136);
    doc.line(tableX, tableY + 34, tableX + tableW, tableY + 34);
    doc.line(tableX, tableY + 68, tableX + tableW, tableY + 68);
    doc.line(tableX, tableY + 102, tableX + tableW, tableY + 102);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 47, 84);
    doc.text('Concepto', tableX + 16, tableY + 22);
    doc.text('Precio', tableX + conceptW + priceW / 2, tableY + 22, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(35, 35, 35);
    doc.text(project.materials || 'Materiales', tableX + 16, tableY + 57);
    doc.text(currency(materialsCost), tableX + conceptW + priceW / 2, tableY + 57, { align: 'center' });
    doc.text(project.labor || 'Mano de obra', tableX + 16, tableY + 91);
    doc.text(currency(laborCost), tableX + conceptW + priceW / 2, tableY + 91, { align: 'center' });
    doc.text(project.installation || 'Instalación', tableX + 16, tableY + 125);
    doc.text(currency(installationCost), tableX + conceptW + priceW / 2, tableY + 125, { align: 'center' });

    doc.setFillColor(244, 239, 227);
    doc.rect(tableX, tableY + 136, tableW, 34, 'F');
    doc.line(tableX + conceptW, tableY + 136, tableX + conceptW, tableY + 170);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 47, 84);
    doc.setFontSize(12);
    doc.text('TOTAL', tableX + conceptW - 16, tableY + 158, { align: 'right' });
    doc.setFontSize(18);
    doc.text(currency(project.amount), tableX + conceptW + priceW / 2, tableY + 158, { align: 'center' });

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Condiciones:', 56, 625);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(35, 35, 35);
    doc.text(`• Tiempo estimado: ${project.timeline || '2-3 semanas'}`, 70, 652);
    doc.text(`• Pago: ${project.downPaymentPercent}% anticipo / ${100 - project.downPaymentPercent}% al finalizar`, 70, 676);
    doc.text(`• Anticipo estimado: ${currency(downPaymentAmount)} / Saldo final: ${currency(finalPayment)}`, 70, 700);
    doc.text(`• ${project.warranty || 'Garantía incluida en instalación'}`, 70, 724);

    doc.setDrawColor(220, 220, 220);
    doc.line(56, 736, pageWidth - 56, 736);
    doc.setFontSize(11);
    doc.text('Gracias por su confianza. No dude en contactarnos si necesita más información.', pageWidth / 2, 768, { align: 'center' });

    const safeClient = (project.client || 'Cliente').replace(/\s+/g, '_');
    doc.save(`Cotizacion_${safeClient}.pdf`);
  };

  return (
    <div className="app-shell">
      <div className="page-grid">
        <section className="card form-card">
          <h1>Cotización automática</h1>
          <p className="subtle">Guarda clientes y genera el PDF final con un clic.</p>

          <div className="field-stack">
            <input value={form.client} onChange={(e) => updateForm('client', e.target.value)} placeholder="Nombre del cliente" />
            <input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="Teléfono" />
            <input value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Dirección" />
            <input value={form.type} onChange={(e) => updateForm('type', e.target.value)} placeholder="Tipo de trabajo" />
            <input value={form.materials} onChange={(e) => updateForm('materials', e.target.value)} placeholder="Materiales" />
            <input value={form.labor} onChange={(e) => updateForm('labor', e.target.value)} placeholder="Mano de obra" />
            <input value={form.installation} onChange={(e) => updateForm('installation', e.target.value)} placeholder="Instalación" />
            <input value={form.amount} onChange={(e) => updateForm('amount', e.target.value)} placeholder="Monto total" />
            <input value={form.downPaymentPercent} onChange={(e) => updateForm('downPaymentPercent', e.target.value)} placeholder="Porcentaje de anticipo" />
            <input value={form.timeline} onChange={(e) => updateForm('timeline', e.target.value)} placeholder="Tiempo estimado" />
            <input value={form.warranty} onChange={(e) => updateForm('warranty', e.target.value)} placeholder="Garantía" />

            <div className="two-col">
              <button className="primary" onClick={handleSave}>{editingId ? 'Guardar cambios' : 'Guardar proyecto'}</button>
              <button className="secondary" onClick={() => { setForm(emptyForm); setEditingId(null); }}>Limpiar</button>
            </div>
          </div>
        </section>

        <section className="content-stack">
          <div className="card">
            <div className="header-row">
              <div>
                <h2>Proyectos guardados</h2>
                <p className="subtle">Selecciona uno y genera el PDF final.</p>
              </div>
              <div className="pill">{projects.length} proyectos</div>
            </div>

            <div className="project-grid">
              {projects.map((project) => (
                <div key={project.id} className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}>
                  <p className="project-name">{project.client}</p>
                  <p className="subtle">{project.type}</p>
                  <p className="subtle">{currency(project.amount)}</p>
                  <div className="three-col">
                    <button className="primary small" onClick={() => setSelectedProjectId(project.id)}>Abrir</button>
                    <button className="secondary small" onClick={() => handleEdit(project)}>Editar</button>
                    <button className="secondary small" onClick={() => handleDelete(project.id)}>Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedProject && (
            <div className="card">
              <div className="header-row mobile-stack">
                <div>
                  <h2>Vista previa del proyecto</h2>
                  <p className="subtle">{selectedProject.client} · {selectedProject.type}</p>
                </div>
                <button className="primary" onClick={() => generatePDF(selectedProject)}>Generar PDF final</button>
              </div>

              <div className="preview-grid">
                <div className="preview-box"><span>Cliente</span><strong>{selectedProject.client}</strong></div>
                <div className="preview-box"><span>Monto total</span><strong>{currency(selectedProject.amount)}</strong></div>
                <div className="preview-box"><span>Anticipo</span><strong>{selectedProject.downPaymentPercent}%</strong></div>
                <div className="preview-box"><span>Tiempo estimado</span><strong>{selectedProject.timeline}</strong></div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
