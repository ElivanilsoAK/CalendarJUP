import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, PieChart, Users, Calendar, Clock, Eye, EyeOff } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ShiftData {
  id: string;
  date: string;
  plantonista: {
    id: string;
    name: string;
  };
  calendarId: string;
}


const Analytics = () => {
  const { theme } = useTheme();
  const { currentUser, currentUserOrg, userOrgs } = useAuth();
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [filteredShifts, setFilteredShifts] = useState<ShiftData[]>([]);

  // Get user role to determine permissions
  const userRole = userOrgs.find(org => org.orgId === currentUserOrg?.orgId)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  useEffect(() => {
    const fetchShifts = async () => {
      if (!currentUserOrg) return;
      
      setLoading(true);
      try {
        // Fetch calendars from the organization
        const calendarsRef = collection(db, 'organizations', currentUserOrg.orgId, 'calendars');
        const calendarsSnapshot = await getDocs(calendarsRef);
        
        const shiftData: ShiftData[] = [];
        
        calendarsSnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Extract shifts from calendar data
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
                  calendarId: doc.id
                });
              }
            });
          }
        });
        
        setShifts(shiftData);
      } catch (error) {
        console.error('Error fetching shifts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [currentUserOrg]);

  useEffect(() => {
    // Filter shifts based on selected month and user permissions
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    let filtered = shifts.filter(shift => {
      const shiftDate = parseISO(shift.date);
      return isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
    });

    // If user is not admin, only show their own shifts
    if (!isAdmin && !showAllShifts) {
      filtered = filtered.filter(shift => shift.plantonista.name === currentUser?.displayName);
    }

    setFilteredShifts(filtered);
  }, [shifts, selectedMonth, isAdmin, showAllShifts, currentUser]);

  // Calculate statistics
  const totalShifts = filteredShifts.length;
  const userShifts = filteredShifts.filter(shift => shift.plantonista.name === currentUser?.displayName).length;
  const uniqueUsers = new Set(filteredShifts.map(shift => shift.plantonista.name)).size;

  // Generate chart data
  const barChartData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(selectedMonth.getFullYear(), i, 1);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthShifts = shifts.filter(shift => {
      const shiftDate = parseISO(shift.date);
      return isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
    });

    let count = monthShifts.length;
    if (!isAdmin && !showAllShifts) {
      count = monthShifts.filter(shift => shift.plantonista.name === currentUser?.displayName).length;
    }

    return {
      name: format(month, 'MMM', { locale: ptBR }),
      value: count
    };
  });

  const pieChartData = filteredShifts.reduce((acc, shift) => {
    const userName = shift.plantonista.name;
    const existing = acc.find(item => item.name === userName);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({
        name: userName,
        value: 1,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; color: string }>);

  const totalPieValue = pieChartData.reduce((acc, data) => acc + data.value, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-10"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Analytics</h1>
        
        <div className="flex items-center gap-4">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500" />
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
              className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          {/* Toggle View (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setShowAllShifts(!showAllShifts)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                showAllShifts
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {showAllShifts ? <Eye size={16} /> : <EyeOff size={16} />}
              {showAllShifts ? 'Ver Todos' : 'Ver Meus'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
            <Users className="text-blue-500" size={24}/>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Colaboradores Ativos</p>
            <p className="text-2xl font-bold">{uniqueUsers}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-xl">
            <Calendar className="text-green-500" size={24}/>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isAdmin && showAllShifts ? 'Plantões no Mês' : 'Meus Plantões'}
            </p>
            <p className="text-2xl font-bold">{isAdmin && showAllShifts ? totalShifts : userShifts}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
            <Clock className="text-purple-500" size={24}/>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Plantões Totais</p>
            <p className="text-2xl font-bold">{shifts.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><BarChart className="mr-3"/>Plantões por Mês ({selectedMonth.getFullYear()})</h3>
          <div className="h-64 w-full">
             <svg width="100%" height="100%" viewBox="0 0 500 300">
                {barChartData.map((d, i) => (
                    <g key={d.name} transform={`translate(${i * 80 + 40}, 0)`}>
                        <rect y={300 - d.value * 3} width="40" height={d.value * 3} fill="#34d399" rx="4"/>
                        <text y="295" x="20" textAnchor="middle" fill={theme === 'dark' ? '#fff' : '#000'}>{d.name}</text>
                    </g>
                ))}
            </svg>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><PieChart className="mr-3"/>Plantões por Colaborador</h3>
          <div className="h-64 w-full flex items-center justify-around">
            {totalPieValue > 0 ? (
              <>
                <svg width="200" height="200" viewBox="0 0 200 200">
                    <g transform="rotate(-90 100 100)">
                        {pieChartData.reduce((acc, data) => {
                            const endAngle = acc.angle + (data.value / totalPieValue) * 360;
                            const startX = 100 + 100 * Math.cos(Math.PI * acc.angle / 180);
                            const startY = 100 + 100 * Math.sin(Math.PI * acc.angle / 180);
                            const endX = 100 + 100 * Math.cos(Math.PI * endAngle / 180);
                            const endY = 100 + 100 * Math.sin(Math.PI * endAngle / 180);
                            const largeArcFlag = (data.value / totalPieValue) > 0.5 ? 1 : 0;

                            const path = `M 100,100 L ${startX},${startY} A 100,100 0 ${largeArcFlag} 1 ${endX},${endY} Z`;
                            
                            return {
                                paths: [...acc.paths, <path key={data.name} d={path} fill={data.color} />],
                                angle: endAngle
                            }
                        }, {paths: [] as React.ReactNode[], angle: 0}).paths}
                    </g>
                </svg>
                <div className="space-y-2">
                    {pieChartData.map(d => (
                        <div key={d.name} className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: d.color}}></div>
                            <span className="text-sm">{d.name}</span>
                        </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                <p>Nenhum plantão encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shifts List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <Clock className="mr-3" />
          {isAdmin && showAllShifts ? 'Todos os Plantões' : 'Meus Plantões'} - {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        
        {filteredShifts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Colaborador</th>
                  {isAdmin && showAllShifts && (
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredShifts
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((shift) => (
                    <tr key={shift.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {format(parseISO(shift.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {shift.plantonista.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{shift.plantonista.name}</span>
                        </div>
                      </td>
                      {isAdmin && showAllShifts && (
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            shift.plantonista.name === currentUser?.displayName 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {shift.plantonista.name === currentUser?.displayName ? 'Você' : 'Outro'}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum plantão encontrado</p>
            <p className="text-sm">Não há plantões agendados para este período.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
