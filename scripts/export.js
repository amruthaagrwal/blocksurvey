// scripts/export.js

function prepareExportData(respondents) {
    const dimensionKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    return respondents.map(r => {
        const row = {
            "Full Name": r.full_name,
            "Employee ID": r.employee_id,
            "Total Score": r.total_score,
            "Top 3 Strengths": r.top_strengths,
            "Top 3 Blockages": r.top_blockages,
            "Quality Flag": r.quality_flag,
            "Date Submitted": new Date(r.created_at).toLocaleString()
        };

        // Add dimension scores
        dimensionKeys.forEach(k => {
            row[`Dim ${k} Score`] = r[`Dim_${k}`] || 0;
            row[`Dim ${k} Interpretation`] = r[`Dim_${k}_Interp`] || 'N/A';
        });

        // Add all 110 answers
        for (let i = 1; i <= 110; i++) {
            row[`Question ${i} Answer`] = r[`Q${i}`] || 'N/A';
        }

        return row;
    });
}

export function exportToCSV(respondents) {
    if (!respondents || respondents.length === 0) {
        alert("No data available to export.");
        return;
    }

    const data = prepareExportData(respondents);
    const headers = Object.keys(data[0]);
    
    const rows = data.map(rowObj => {
        return headers.map(header => escapeCSV(rowObj[header])).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    triggerDownload(csvContent, 'csv');
}

export async function exportToExcel(respondents) {
    if (!respondents || respondents.length === 0) {
        alert("No data available to export.");
        return;
    }

    if (typeof XLSX === 'undefined') {
        await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    }

    const data = prepareExportData(respondents);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Survey Data");
    XLSX.writeFile(wb, `Research_Export_${Date.now()}.xlsx`);
}

function triggerDownload(content, type) {
    const mime = type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Export_${Date.now()}.${type}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    const stringVal = String(val);
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
}

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
    });
}
