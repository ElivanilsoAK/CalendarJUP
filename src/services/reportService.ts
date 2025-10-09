// src/services/reportService.ts
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy
} from 'firebase/firestore';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  isWithinInterval, 
  parseISO,
  format,
  subDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  userIds?: string[];
  status?: string[];
  departments?: string[];
  includeVacations?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  sortBy?: 'date' | 'user' | 'department' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ReportData {
  id: string;
  type: 'shift' | 'vacation' | 'user';
  date: string;
  userId: string;
  userName: string;
  department?: string;
  status: string;
  details: Record<string, any>;
}

export interface ReportSummary {
  totalRecords: number;
  totalShifts: number;
  totalVacations: number;
  uniqueUsers: number;
  dateRange: {
    start: string;
    end: string;
  };
  period: string;
}

export interface GroupedReportData {
  period: string;
  data: ReportData[];
  summary: {
    shifts: number;
    vacations: number;
    users: number;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  filters: ReportFilter;
  columns: string[];
  format: 'table' | 'chart' | 'summary';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Busca dados de plantões para relatórios
 */
export const fetchShiftReportData = async (
  orgId: string,
  filters: ReportFilter
): Promise<ReportData[]> => {
  try {
    const calendarsRef = collection(db, 'organizations', orgId, 'calendars');
    const calendarsSnapshot = await getDocs(calendarsRef);
    
    const reportData: ReportData[] = [];
    
    calendarsSnapshot.forEach((doc) => {
      const calendar = doc.data();
      
      if (calendar.calendarData && Array.isArray(calendar.calendarData)) {
        calendar.calendarData.forEach((day: any) => {
          if (day.plantonista) {
            const shiftDate = parseISO(day.date);
            
            // Aplicar filtros de data
            if (filters.startDate && filters.endDate) {
              if (!isWithinInterval(shiftDate, { 
                start: filters.startDate, 
                end: filters.endDate 
              })) {
                return;
              }
            }
            
            // Aplicar filtros de usuário
            if (filters.userIds && filters.userIds.length > 0) {
              const userId = typeof day.plantonista === 'string' 
                ? day.plantonista 
                : day.plantonista.id;
              if (!filters.userIds.includes(userId)) {
                return;
              }
            }
            
            reportData.push({
              id: `${doc.id}-${day.date}`,
              type: 'shift',
              date: day.date,
              userId: typeof day.plantonista === 'string' 
                ? day.plantonista 
                : day.plantonista.id,
              userName: typeof day.plantonista === 'string' 
                ? day.plantonista 
                : day.plantonista.name,
              status: 'completed',
              details: {
                calendarId: doc.id,
                calendarName: calendar.name || `Calendário ${calendar.month}/${calendar.year}`,
                month: calendar.month,
                year: calendar.year
              }
            });
          }
        });
      }
    });
    
    return reportData;
  } catch (error) {
    console.error('Erro ao buscar dados de plantões:', error);
    throw new Error('Falha ao carregar dados de plantões.');
  }
};

/**
 * Busca dados de férias para relatórios
 */
export const fetchVacationReportData = async (
  orgId: string,
  filters: ReportFilter
): Promise<ReportData[]> => {
  try {
    const vacationsRef = collection(db, 'organizations', orgId, 'vacations');
    let q = query(vacationsRef, orderBy('requestedAt', 'desc'));
    
    // Aplicar filtros de status
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    
    const snapshot = await getDocs(q);
    const reportData: ReportData[] = [];
    
    snapshot.forEach((doc) => {
      const vacation = doc.data();
      const vacationStart = parseISO(vacation.startDate);
      const vacationEnd = parseISO(vacation.endDate);
      
      // Aplicar filtros de data
      if (filters.startDate && filters.endDate) {
        if (!isWithinInterval(vacationStart, { 
          start: filters.startDate, 
          end: filters.endDate 
        })) {
          return;
        }
      }
      
      // Aplicar filtros de usuário
      if (filters.userIds && filters.userIds.length > 0) {
        if (!filters.userIds.includes(vacation.userId)) {
          return;
        }
      }
      
      reportData.push({
        id: doc.id,
        type: 'vacation',
        date: vacation.startDate,
        userId: vacation.userId,
        userName: vacation.userName,
        status: vacation.status,
        details: {
          endDate: vacation.endDate,
          reason: vacation.reason,
          requestedAt: vacation.requestedAt?.toDate?.() || new Date(),
          approvedAt: vacation.approvedAt?.toDate?.(),
          approvedBy: vacation.approvedBy,
          duration: Math.ceil((vacationEnd.getTime() - vacationStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }
      });
    });
    
    return reportData;
  } catch (error) {
    console.error('Erro ao buscar dados de férias:', error);
    throw new Error('Falha ao carregar dados de férias.');
  }
};

/**
 * Busca dados de usuários para relatórios
 */
export const fetchUserReportData = async (
  orgId: string,
  filters: ReportFilter
): Promise<ReportData[]> => {
  try {
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const snapshot = await getDocs(membersRef);
    const reportData: ReportData[] = [];
    
    snapshot.forEach((doc) => {
      const member = doc.data();
      
      // Aplicar filtros de usuário
      if (filters.userIds && filters.userIds.length > 0) {
        if (!filters.userIds.includes(doc.id)) {
          return;
        }
      }
      
      // Aplicar filtros de departamento
      if (filters.departments && filters.departments.length > 0) {
        if (!member.department || !filters.departments.includes(member.department)) {
          return;
        }
      }
      
      reportData.push({
        id: doc.id,
        type: 'user',
        date: member.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId: doc.id,
        userName: member.name || member.email,
        department: member.department,
        status: member.status || 'active',
        details: {
          email: member.email,
          role: member.role,
          joinedAt: member.joinedAt?.toDate?.(),
          totalShifts: 0, // Será calculado depois
          totalVacations: 0 // Será calculado depois
        }
      });
    });
    
    return reportData;
  } catch (error) {
    console.error('Erro ao buscar dados de usuários:', error);
    throw new Error('Falha ao carregar dados de usuários.');
  }
};

/**
 * Gera relatório completo
 */
export const generateReport = async (
  orgId: string,
  filters: ReportFilter
): Promise<{
  data: ReportData[];
  summary: ReportSummary;
  grouped: GroupedReportData[];
}> => {
  try {
    const [shiftData, vacationData, userData] = await Promise.all([
      fetchShiftReportData(orgId, filters),
      filters.includeVacations ? fetchVacationReportData(orgId, filters) : Promise.resolve([]),
      fetchUserReportData(orgId, filters)
    ]);
    
    const allData = [...shiftData, ...vacationData, ...userData];
    
    // Ordenar dados
    const sortedData = allData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (filters.sortOrder === 'desc') {
        return dateB.getTime() - dateA.getTime();
      }
      return dateA.getTime() - dateB.getTime();
    });
    
    // Gerar resumo
    const summary: ReportSummary = {
      totalRecords: allData.length,
      totalShifts: shiftData.length,
      totalVacations: vacationData.length,
      uniqueUsers: new Set(allData.map(item => item.userId)).size,
      dateRange: {
        start: filters.startDate?.toISOString().split('T')[0] || '',
        end: filters.endDate?.toISOString().split('T')[0] || ''
      },
      period: filters.groupBy || 'all'
    };
    
    // Agrupar dados
    const grouped = groupReportData(sortedData, filters.groupBy || 'month');
    
    return {
      data: sortedData,
      summary,
      grouped
    };
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    throw new Error('Falha ao gerar relatório.');
  }
};

/**
 * Agrupa dados do relatório por período
 */
export const groupReportData = (
  data: ReportData[],
  groupBy: ReportFilter['groupBy']
): GroupedReportData[] => {
  const groups: Record<string, ReportData[]> = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    let period: string;
    
    switch (groupBy) {
      case 'day':
        period = format(date, 'dd/MM/yyyy', { locale: ptBR });
        break;
      case 'week':
        const weekStart = subDays(date, date.getDay());
        period = `Semana ${format(weekStart, 'dd/MM', { locale: ptBR })}`;
        break;
      case 'month':
        period = format(date, 'MMMM yyyy', { locale: ptBR });
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        period = `Q${quarter}/${date.getFullYear()}`;
        break;
      case 'year':
        period = date.getFullYear().toString();
        break;
      default:
        period = 'Todos';
    }
    
    if (!groups[period]) {
      groups[period] = [];
    }
    groups[period].push(item);
  });
  
  return Object.entries(groups).map(([period, groupData]) => ({
    period,
    data: groupData,
    summary: {
      shifts: groupData.filter(item => item.type === 'shift').length,
      vacations: groupData.filter(item => item.type === 'vacation').length,
      users: new Set(groupData.map(item => item.userId)).size
    }
  }));
};

/**
 * Exporta relatório para CSV
 */
export const exportReportToCSV = (
  data: ReportData[],
  summary: ReportSummary
): string => {
  const headers = [
    'Tipo',
    'Data',
    'Usuário',
    'Departamento',
    'Status',
    'Detalhes'
  ];
  
  const rows = data.map(item => [
    item.type,
    format(parseISO(item.date), 'dd/MM/yyyy', { locale: ptBR }),
    item.userName,
    item.department || '',
    item.status,
    JSON.stringify(item.details)
  ]);
  
  // Adicionar resumo
  const summaryRows = [
    ['', '', '', '', '', ''],
    ['RESUMO', '', '', '', '', ''],
    ['Total de Registros', summary.totalRecords.toString(), '', '', '', ''],
    ['Total de Plantões', summary.totalShifts.toString(), '', '', '', ''],
    ['Total de Férias', summary.totalVacations.toString(), '', '', '', ''],
    ['Usuários Únicos', summary.uniqueUsers.toString(), '', '', '', ''],
    ['Período', `${summary.dateRange.start} a ${summary.dateRange.end}`, '', '', '', '']
  ];
  
  const csvContent = [
    headers,
    ...rows,
    ...summaryRows
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  return csvContent;
};

/**
 * Templates de relatórios pré-definidos
 */
export const getReportTemplates = (): ReportTemplate[] => {
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);
  const startOfCurrentYear = startOfYear(now);
  const endOfCurrentYear = endOfYear(now);
  
  return [
    {
      id: 'monthly-shifts',
      name: 'Plantões Mensais',
      description: 'Relatório de plantões do mês atual',
      filters: {
        startDate: startOfCurrentMonth,
        endDate: endOfCurrentMonth,
        groupBy: 'day',
        sortBy: 'date',
        sortOrder: 'asc'
      },
      columns: ['date', 'user', 'status'],
      format: 'table',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'yearly-summary',
      name: 'Resumo Anual',
      description: 'Resumo de atividades do ano atual',
      filters: {
        startDate: startOfCurrentYear,
        endDate: endOfCurrentYear,
        groupBy: 'month',
        sortBy: 'date',
        sortOrder: 'asc'
      },
      columns: ['period', 'shifts', 'vacations', 'users'],
      format: 'summary',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'vacation-requests',
      name: 'Solicitações de Férias',
      description: 'Todas as solicitações de férias',
      filters: {
        includeVacations: true,
        status: ['pending', 'approved', 'rejected'],
        groupBy: 'month',
        sortBy: 'date',
        sortOrder: 'desc'
      },
      columns: ['date', 'user', 'status', 'duration', 'reason'],
      format: 'table',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
};
