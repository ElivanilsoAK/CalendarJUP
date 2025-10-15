import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Holiday, Day } from './calendarLogic';
import { getDaysInMonth } from './calendarLogic';

// Extend jsPDF with the autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportOptions {
  companyName: string;
  companyLogo?: string;
  primaryColor: string;
  secondaryColor: string;
  month: number;
  year: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
};

export const exportCalendarToPDF = async (
  days: Day[],
  holidays: Holiday[],
  options: ExportOptions
) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const { year, month, companyName, companyLogo, primaryColor, secondaryColor } = options;

  const headStyles = {
    fillColor: hexToRgb(primaryColor),
    textColor: [255, 255, 255],
    fontStyle: 'bold',
  };

  // 1. Add Header
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.text(companyName, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(secondaryColor);
  const monthName = format(new Date(year, month), 'MMMM', { locale: ptBR });
  doc.text(
    `Calendário de Plantão - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
    doc.internal.pageSize.getWidth() / 2,
    30,
    { align: 'center' }
  );

  // 2. Add Logo
  if (companyLogo) {
    try {
        const response = await fetch(companyLogo);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
            reader.onload = () => {
                const imgData = reader.result as string;
                const img = new Image();
                img.src = imgData;
                img.onload = () => {
                    const imgWidth = 25;
                    const imgHeight = (img.height * imgWidth) / img.width;
                    doc.addImage(imgData, 'PNG', 15, 12, imgWidth, imgHeight);
                    resolve();
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error loading company logo for PDF:", e);
    }
  }

  // 3. Prepare Calendar Data
  const monthDays = getDaysInMonth(year, month);
  const firstDayOfMonth = getDay(monthDays[0]); // 0=Sun, 1=Mon...

  const body: any[][] = [];
  let week: any[] = [];

  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    week.push(' ');
  }

  monthDays.forEach((dayDate) => {
    const dayOfMonth = dayDate.getUTCDate();
    const dayInfo = days.find(d => d.date.getUTCDate() === dayOfMonth);
    const holidayInfo = holidays.find(h => new Date(h.date + 'T00:00:00Z').getUTCDate() === dayOfMonth);

    let cellContent = '';
    if (dayInfo?.plantonista) {
      cellContent = `${dayOfMonth}\n${dayInfo.plantonista.name}`;
    } else {
      cellContent = `${dayOfMonth}`;
    }
    
    if (holidayInfo) {
      cellContent += `\n${holidayInfo.name}`;
    }

    week.push({
        content: cellContent,
        styles: {
            valign: 'top',
            halign: 'left',
            minCellHeight: 25,
            textColor: holidayInfo ? [220, 53, 69] : (dayInfo?.plantonista ? hexToRgb(primaryColor) : [0,0,0]),
            fontStyle: dayInfo?.plantonista ? 'bold' : 'normal'
        }
    });

    if (week.length === 7) {
      body.push(week);
      week = [];
    }
  });

  // Add remaining cells for the last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(' ');
    }
    body.push(week);
  }

  // 4. Generate Table
  doc.autoTable({
    head: [['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']],
    body: body,
    startY: 40,
    theme: 'grid',
    headStyles: headStyles,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'left' },
      2: { halign: 'left' },
      3: { halign: 'left' },
      4: { halign: 'left' },
      5: { halign: 'left' },
      6: { halign: 'left' },
    }
  });

  return doc;
};

export const savePDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};

/**
 * Generates a PDF calendar for a single collaborator.
 */
export const exportCollaboratorPDF = async (
  collaboratorName: string,
  days: Day[],
  options: ExportOptions
) => {
  const doc = new jsPDF({ orientation: 'portrait' });
  const { year, month, companyName, companyLogo, primaryColor, secondaryColor } = options;

  const headStyles = {
    fillColor: hexToRgb(primaryColor),
    textColor: [255, 255, 255],
    fontStyle: 'bold',
  };

  // 1. Add Header
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.text(companyName, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(secondaryColor);
  const monthName = format(new Date(year, month), 'MMMM', { locale: ptBR });
  doc.text(
    `Plantões de ${collaboratorName} - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
    doc.internal.pageSize.getWidth() / 2,
    30,
    { align: 'center' }
  );

  // 2. Add Logo
  if (companyLogo) {
    try {
        const response = await fetch(companyLogo);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
            reader.onload = () => {
                const imgData = reader.result as string;
                const img = new Image();
                img.src = imgData;
                img.onload = () => {
                    const imgWidth = 25;
                    const imgHeight = (img.height * imgWidth) / img.width;
                    doc.addImage(imgData, 'PNG', 15, 12, imgWidth, imgHeight);
                    resolve();
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error loading company logo for PDF:", e);
    }
  }

  // 3. Prepare Data
  const collaboratorShifts = days.filter(
    (day) => day.plantonista && day.plantonista.name === collaboratorName
  );

  const body = collaboratorShifts.map((day) => [
    format(day.date, 'dd/MM/yyyy', { locale: ptBR }),
    format(day.date, 'EEEE', { locale: ptBR }),
  ]);

  // 4. Generate Table
  if (body.length > 0) {
    doc.autoTable({
      head: [['Data', 'Dia da Semana']],
      body: body,
      startY: 50,
      theme: 'grid',
      headStyles: headStyles,
    });
  } else {
    doc.setFontSize(12);
    doc.text('Nenhum plantão encontrado para este colaborador no período.', 14, 60);
  }

  return doc;
};