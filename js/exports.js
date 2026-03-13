import { supabase } from './app.js';

window.exportData = async (format) => {
    const { data: movements } = await supabase
        .from('movimientos')
        .select('*, categorias(nombre)')
        .order('fecha', { ascending: true });

    if (!movements || movements.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    let runningBalance = 0;
    const exportData = movements.map(m => {
        const val = parseFloat(m.valor);
        if (m.tipo === 'ingreso') runningBalance += val;
        else runningBalance -= val;

        return {
            Fecha: m.fecha,
            Tipo: m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
            Categoría: m.categorias.nombre,
            Descripción: m.descripcion,
            Valor: val,
            'Balance Acumulado': runningBalance
        };
    });

    if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
        XLSX.writeFile(wb, "Finanzly_Reporte_Completo.xlsx");
    } else if (format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Reporte de Movimientos - Finanzly", 14, 22);

        const rows = exportData.map(d => [
            d.Fecha,
            d.Tipo,
            d.Categoría,
            d.Descripción,
            d.Valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
            d['Balance Acumulado'].toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
        ]);

        doc.autoTable({
            startY: 30,
            head: [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Valor', 'Balance']],
            body: rows
        });

        doc.save("Finanzly_Reporte.pdf");
    }
};

window.exportMonthlyReport = async () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data } = await supabase
        .from('movimientos')
        .select('*, categorias(nombre)')
        .gte('fecha', firstDay);

    if (!data) return;

    let csv = "Mes,Total Ingresos,Total Egresos,Balance\n";
    let inc = 0, exp = 0;
    data.forEach(m => {
        if (m.tipo === 'ingreso') inc += parseFloat(m.valor);
        else exp += parseFloat(m.valor);
    });

    csv += `${now.toLocaleString('default', { month: 'long' })},${inc},${exp},${inc - exp}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Reporte_Mensual.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
