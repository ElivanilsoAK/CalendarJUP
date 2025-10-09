// src/services/analyticsService.ts
import { db } from '../firebase/config';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  isWithinInterval, 
  parseISO, 
  format,
  differenceInDays,
  addMonths,
  subMonths,
  eachMonthOfInterval,
  eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAllVacations } from './vacationService';

export interface ShiftData {
  id: string;
  date: string;
  plantonista: {
    id: string;
    name: string;
  };
  calendarId: string;
  calendarName?: string;
  calendarMonth?: number;
  calendarYear?: number;
}

export interface VacationData {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  duration: number; // days
}

export interface AnalyticsMetrics {
  shifts: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    monthlyTrend: number; // percentage change
    averagePerMonth: number;
    peakMonth: { month: string; count: number };
    userDistribution: Array<{ name: string; count: number; percentage: number }>;
  };
  vacations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageDuration: number;
    approvalRate: number;
    monthlyRequests: Array<{ month: string; count: number }>;
  };
  productivity: {
    shiftsPerUser: Array<{ name: string; shifts: number; vacations: number; efficiency: number }>;
    utilizationRate: number; // percentage of days with coverage
    coverageGaps: number; // days without coverage
  };
  trends: {
    monthlyShifts: Array<{ month: string; count: number; previousCount: number; change: number }>;
    monthlyVacations: Array<{ month: string; count: number }>;
    userActivity: Array<{ name: string; shifts: number; months: number }>;
  };
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  userIds?: string[];
  includeVacations?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

/**
 * Busca todos os dados de plantões da organização
 */
export const fetchShiftData = async (orgId: string): Promise<ShiftData[]> => {
  try {
    const calendarsRef = collection(db, 'organizations', orgId, 'calendars');
    const calendarsSnapshot = await getDocs(calendarsRef);
    
    const shiftData: ShiftData[] = [];
    
    calendarsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      if (data.calendarData && Array.isArray(data.calendarData)) {
        data.calendarData.forEach((day: any) => {
          if (day.plantonista) {
            shiftData.push({
              id: `${doc.id}-${day.date}`,
              date: day.date,
              plantonista: {
                id: day.plantonista.id || 'unknown',
                name: typeof day.plantonista === 'string' ? day.plantonista : day.plantonista.name || 'Desconhecido'
              },
              calendarId: doc.id,
              calendarName: data.name || `Calendário ${data.month}/${data.year}`,
              calendarMonth: data.month,
              calendarYear: data.year
            });
          }
        });
      }
    });
    
    return shiftData;
  } catch (error) {
    console.error('Erro ao buscar dados de plantões:', error);
    throw new Error('Falha ao carregar dados de plantões.');
  }
};

/**
 * Busca dados de férias da organização
 */
export const fetchVacationData = async (orgId: string): Promise<VacationData[]> => {
  try {
    const vacations = await getAllVacations(orgId);
    
    return vacations.map(vacation => ({
      ...vacation,
      duration: differenceInDays(new Date(vacation.endDate), new Date(vacation.startDate)) + 1
    }));
  } catch (error) {
    console.error('Erro ao buscar dados de férias:', error);
    return [];
  }
};

/**
 * Calcula métricas avançadas de analytics
 */
export const calculateAdvancedMetrics = async (
  orgId: string,
  filters: AnalyticsFilters = {}
): Promise<AnalyticsMetrics> => {
  try {
    const [shiftData, vacationData] = await Promise.all([
      fetchShiftData(orgId),
      fetchVacationData(orgId)
    ]);

    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const thisYear = startOfYear(now);

    // Filtrar dados se necessário
    let filteredShifts = shiftData;
    let filteredVacations = vacationData;

    if (filters.startDate && filters.endDate) {
      filteredShifts = shiftData.filter(shift => {
        const shiftDate = parseISO(shift.date);
        return isWithinInterval(shiftDate, { start: filters.startDate!, end: filters.endDate! });
      });
      
      filteredVacations = vacationData.filter(vacation => {
        const vacationStart = parseISO(vacation.startDate);
        return isWithinInterval(vacationStart, { start: filters.startDate!, end: filters.endDate! });
      });
    }

    if (filters.userIds && filters.userIds.length > 0) {
      filteredShifts = filteredShifts.filter(shift => 
        filters.userIds!.includes(shift.plantonista.id)
      );
      filteredVacations = filteredVacations.filter(vacation => 
        filters.userIds!.includes(vacation.userId)
      );
    }

    // Calcular métricas de plantões
    const shiftsThisMonth = filteredShifts.filter(shift => {
      const shiftDate = parseISO(shift.date);
      return isWithinInterval(shiftDate, { start: thisMonth, end: endOfMonth(thisMonth) });
    }).length;

    const shiftsLastMonth = filteredShifts.filter(shift => {
      const shiftDate = parseISO(shift.date);
      return isWithinInterval(shiftDate, { start: lastMonth, end: endOfMonth(lastMonth) });
    }).length;

    const monthlyTrend = shiftsLastMonth > 0 
      ? ((shiftsThisMonth - shiftsLastMonth) / shiftsLastMonth) * 100 
      : 0;

    // Distribuição por usuário
    const userShiftCounts = filteredShifts.reduce((acc, shift) => {
      const userName = shift.plantonista.name;
      acc[userName] = (acc[userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalShifts = Object.values(userShiftCounts).reduce((sum, count) => sum + count, 0);
    const userDistribution = Object.entries(userShiftCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalShifts > 0 ? (count / totalShifts) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Mês com mais plantões
    const monthlyCounts = eachMonthOfInterval({
      start: startOfYear(now),
      end: endOfYear(now)
    }).map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const count = filteredShifts.filter(shift => {
        const shiftDate = parseISO(shift.date);
        return isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
      }).length;
      
      return {
        month: format(month, 'MMM yyyy', { locale: ptBR }),
        count
      };
    });

    const peakMonth = monthlyCounts.reduce((peak, current) => 
      current.count > peak.count ? current : peak
    );

    // Calcular métricas de férias
    const vacationMetrics = {
      total: filteredVacations.length,
      pending: filteredVacations.filter(v => v.status === 'pending').length,
      approved: filteredVacations.filter(v => v.status === 'approved').length,
      rejected: filteredVacations.filter(v => v.status === 'rejected').length,
      averageDuration: filteredVacations.length > 0 
        ? filteredVacations.reduce((sum, v) => sum + v.duration, 0) / filteredVacations.length 
        : 0,
      approvalRate: filteredVacations.length > 0
        ? (filteredVacations.filter(v => v.status === 'approved').length / filteredVacations.length) * 100
        : 0,
      monthlyRequests: eachMonthOfInterval({
        start: startOfYear(now),
        end: endOfYear(now)
      }).map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const count = filteredVacations.filter(vacation => {
          const requestDate = vacation.requestedAt;
          return isWithinInterval(requestDate, { start: monthStart, end: monthEnd });
        }).length;
        
        return {
          month: format(month, 'MMM yyyy', { locale: ptBR }),
          count
        };
      })
    };

    // Calcular produtividade
    const productivityMetrics = userDistribution.map(user => {
      const userVacations = filteredVacations.filter(v => v.userName === user.name);
      const totalVacationDays = userVacations
        .filter(v => v.status === 'approved')
        .reduce((sum, v) => sum + v.duration, 0);
      
      const efficiency = user.count > 0 ? (user.count / (user.count + totalVacationDays)) * 100 : 0;
      
      return {
        name: user.name,
        shifts: user.count,
        vacations: totalVacationDays,
        efficiency: Math.round(efficiency)
      };
    });

    // Taxa de utilização (dias com cobertura vs dias totais)
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const yearDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
    const coveredDays = new Set(filteredShifts.map(shift => shift.date)).size;
    const utilizationRate = (coveredDays / yearDays.length) * 100;

    // Calcular tendências mensais
    const monthlyTrends = eachMonthOfInterval({
      start: startOfYear(now),
      end: endOfYear(now)
    }).map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const previousMonthStart = startOfMonth(subMonths(month, 1));
      const previousMonthEnd = endOfMonth(subMonths(month, 1));
      
      const currentCount = filteredShifts.filter(shift => {
        const shiftDate = parseISO(shift.date);
        return isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
      }).length;
      
      const previousCount = filteredShifts.filter(shift => {
        const shiftDate = parseISO(shift.date);
        return isWithinInterval(shiftDate, { start: previousMonthStart, end: previousMonthEnd });
      }).length;
      
      const change = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
      
      return {
        month: format(month, 'MMM yyyy', { locale: ptBR }),
        count: currentCount,
        previousCount,
        change: Math.round(change * 100) / 100
      };
    });

    // Atividade por usuário (quantos meses cada usuário teve plantões)
    const userActivity = userDistribution.map(user => {
      const userShifts = filteredShifts.filter(shift => shift.plantonista.name === user.name);
      const activeMonths = new Set(
        userShifts.map(shift => {
          const shiftDate = parseISO(shift.date);
          return format(shiftDate, 'yyyy-MM');
        })
      ).size;
      
      return {
        name: user.name,
        shifts: user.count,
        months: activeMonths
      };
    });

    return {
      shifts: {
        total: filteredShifts.length,
        thisMonth: shiftsThisMonth,
        lastMonth: shiftsLastMonth,
        monthlyTrend: Math.round(monthlyTrend * 100) / 100,
        averagePerMonth: monthlyCounts.length > 0 
          ? monthlyCounts.reduce((sum, m) => sum + m.count, 0) / monthlyCounts.length 
          : 0,
        peakMonth,
        userDistribution
      },
      vacations: vacationMetrics,
      productivity: {
        shiftsPerUser: productivityMetrics,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        coverageGaps: yearDays.length - coveredDays
      },
      trends: {
        monthlyShifts: monthlyTrends,
        monthlyVacations: vacationMetrics.monthlyRequests,
        userActivity
      }
    };
  } catch (error) {
    console.error('Erro ao calcular métricas avançadas:', error);
    throw new Error('Falha ao calcular métricas de analytics.');
  }
};

/**
 * Exporta dados de analytics para CSV
 */
export const exportAnalyticsToCSV = (metrics: AnalyticsMetrics): string => {
  const headers = [
    'Métrica',
    'Valor',
    'Detalhes'
  ];

  const rows = [
    // Métricas de plantões
    ['Total de Plantões', metrics.shifts.total.toString(), ''],
    ['Plantões este Mês', metrics.shifts.thisMonth.toString(), ''],
    ['Tendência Mensal', `${metrics.shifts.monthlyTrend}%`, ''],
    ['Média por Mês', metrics.shifts.averagePerMonth.toFixed(1), ''],
    ['Mês Pico', metrics.shifts.peakMonth.month, `${metrics.shifts.peakMonth.count} plantões`],
    
    // Métricas de férias
    ['Total de Férias', metrics.vacations.total.toString(), ''],
    ['Férias Pendentes', metrics.vacations.pending.toString(), ''],
    ['Férias Aprovadas', metrics.vacations.approved.toString(), ''],
    ['Taxa de Aprovação', `${metrics.vacations.approvalRate.toFixed(1)}%`, ''],
    ['Duração Média', `${metrics.vacations.averageDuration.toFixed(1)} dias`, ''],
    
    // Produtividade
    ['Taxa de Utilização', `${metrics.productivity.utilizationRate.toFixed(1)}%`, ''],
    ['Dias sem Cobertura', metrics.productivity.coverageGaps.toString(), '']
  ];

  // Adicionar distribuição por usuário
  metrics.shifts.userDistribution.forEach(user => {
    rows.push([
      `Plantões - ${user.name}`,
      user.count.toString(),
      `${user.percentage.toFixed(1)}%`
    ]);
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};
