import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Collaborator } from '../types/collaborator';

type ReportType = 'plantoes' | 'horas' | 'feriados';

interface ReportFilters {
  startDate: string;
  endDate: string;
  collaboratorId?: string;
  reportType: ReportType;
}

const Reports: React.FC = () => {
  const { currentUser } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any[]>([]);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reportType: 'plantoes'
  });

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        if (!currentUser) return;
        
        // Buscar organizações do usuário
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
        const userData = userDoc.docs[0]?.data();
        if (!userData?.organizations || userData.organizations.length === 0) return;
        
        const orgId = userData.organizations[0]; // Usar a primeira organização
        
        // Buscar membros da organização
        const membersRef = collection(db, 'organizations', orgId, 'members');
        const membersSnapshot = await getDocs(membersRef);
        const collaboratorsList: Collaborator[] = [];
        
        for (const memberDoc of membersSnapshot.docs) {
          const memberData = memberDoc.data();
          
          // Para evitar problemas de permissão, usar dados básicos do membro
          let userName = 'Usuário sem nome';
          let userAvatar = '';
          let userDepartment = '';
          
          try {
            // Tentar buscar dados do usuário apenas se for o usuário atual
            if (memberDoc.id === currentUser?.uid) {
              const userDocRef = doc(db, 'users', memberDoc.id);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = userData.displayName || userData.name || 'Usuário sem nome';
                userAvatar = userData.avatar || '';
                userDepartment = userData.department || '';
              }
            } else {
              // Para outros usuários, usar email como nome
              userName = memberData.email.split('@')[0];
            }
          } catch (error) {
            console.warn(`Could not fetch user data for ${memberDoc.id}:`, error);
            userName = memberData.email.split('@')[0];
          }
          
          collaboratorsList.push({
            id: memberDoc.id,
            name: userName,
            email: memberData.email,
            role: memberData.role,
            avatar: userAvatar,
            department: userDepartment
          });
        }
        
        setCollaborators(collaboratorsList);
      } catch (error) {
        console.error("Erro ao carregar colaboradores:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollaborators();
    }, [currentUser?.uid]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateReport = () => {
    const generateReport = async () => {
      setIsGeneratingReport(true);
      try {
        if (!currentUser) throw new Error('Usuário não encontrado');
        
        // Buscar organizações do usuário
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
        const userData = userDoc.docs[0]?.data();
        if (!userData?.organizations || userData.organizations.length === 0) {
          throw new Error('Organização não encontrada');
        }

        const orgId = userData.organizations[0]; // Usar a primeira organização

        // Buscar todos os calendários da organização no período
        const calendarsRef = collection(db, 'organizations', orgId, 'calendars');
        const calendarsSnapshot = await getDocs(calendarsRef);
        let allDays: any[] = [];
        
        calendarsSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.calendarData) {
            allDays = allDays.concat(data.calendarData.map((d: any) => ({
              ...d,
              year: data.year,
              month: data.month,
              companyName: data.companyName
            })));
          }
        });

        // Filtrar por período
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        let filtered = allDays.filter(day => {
          const date = new Date(day.date);
          return date >= start && date <= end;
        });

        // Filtrar por colaborador
        if (filters.collaboratorId) {
          const collaborator = collaborators.find(c => c.id === filters.collaboratorId);
          filtered = filtered.filter(day => {
            return day.plantonista === (collaborator?.name || '');
          });
        }

        // Montar dados para tabela baseado no tipo de relatório
        let reportRows: any[] = [];
        
        if (filters.reportType === 'plantoes') {
          reportRows = filtered.map(day => ({
            data: day.date,
            colaborador: day.plantonista || '-',
            tipo: 'Plantão',
            horas: 12
          }));
        } else if (filters.reportType === 'horas') {
          // Agrupar por colaborador e somar horas
          const hoursByCollaborator = new Map();
          filtered.forEach(day => {
            if (day.plantonista) {
              const current = hoursByCollaborator.get(day.plantonista) || 0;
              hoursByCollaborator.set(day.plantonista, current + 12);
            }
          });
          
          reportRows = Array.from(hoursByCollaborator.entries()).map(([collaboratorName, hours]) => ({
            colaborador: collaboratorName,
            totalHoras: hours,
            tipo: 'Total'
          }));
        } else if (filters.reportType === 'feriados') {
          // Buscar feriados no período
          const holidaysRef = collection(db, 'organizations', orgId, 'holidays');
          const holidaysSnapshot = await getDocs(holidaysRef);
          
          reportRows = holidaysSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((holiday: any) => {
              const holidayDate = new Date(holiday.date);
              return holidayDate >= start && holidayDate <= end;
            })
            .map((holiday: any) => ({
              data: holiday.date,
              nome: holiday.name,
              tipo: holiday.type === 'national' ? 'Nacional' : 'Customizado'
            }));
        }

        setReportData(reportRows);
      } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        setReportData([]);
      } finally {
        setIsGeneratingReport(false);
      }
    };
    generateReport();
  };

  const handleExportPDF = () => {
    if (reportData.length === 0) return;

    const doc = new jsPDF();
    const title = `Relatório de ${filters.reportType === 'plantoes' ? 'Plantões' : 
      filters.reportType === 'horas' ? 'Horas Trabalhadas' : 'Feriados'}`;
  
    // Configurações do documento
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  
    doc.setFontSize(10);
    doc.text(`Período: ${format(new Date(filters.startDate), 'dd/MM/yyyy')} a ${format(new Date(filters.endDate), 'dd/MM/yyyy')}`, 14, 30);
  
    const selectedCollaborator = collaborators.find(c => c.id === filters.collaboratorId);
    if (selectedCollaborator) {
      doc.text(`Colaborador: ${selectedCollaborator.name}`, 14, 35);
    }
  
    // Configurar tabela baseada no tipo de relatório
    let tableData: any[][] = [];
    let headers: string[] = [];
    
    if (filters.reportType === 'plantoes') {
      headers = ['Data', 'Colaborador', 'Tipo', 'Horas'];
      tableData = reportData.map(item => [
        format(new Date(item.data), 'dd/MM/yyyy'),
        item.colaborador,
        item.tipo,
        `${item.horas}h`
      ]);
    } else if (filters.reportType === 'horas') {
      headers = ['Colaborador', 'Total de Horas', 'Tipo'];
      tableData = reportData.map(item => [
        item.colaborador,
        `${item.totalHoras}h`,
        item.tipo
      ]);
    } else if (filters.reportType === 'feriados') {
      headers = ['Data', 'Nome do Feriado', 'Tipo'];
      tableData = reportData.map(item => [
        format(new Date(item.data), 'dd/MM/yyyy'),
        item.nome,
        item.tipo
      ]);
    }
  
    (doc as any).autoTable({
      startY: 45,
      head: [headers],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
  
    // Salvar o PDF
    const fileName = `relatorio_${filters.reportType}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Relatórios
      </h1>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Data Inicial
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Data Final
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Relatório
            </label>
            <select
              name="reportType"
              value={filters.reportType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="plantoes">Plantões</option>
              <option value="horas">Horas Trabalhadas</option>
              <option value="feriados">Feriados</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Colaborador (Opcional)
            </label>
            <select
              name="collaboratorId"
              value={filters.collaboratorId || ''}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Todos</option>
              {collaborators.map((collaborator) => (
                <option key={collaborator.id} value={collaborator.id}>
                  {collaborator.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button onClick={handleGenerateReport}>
            Gerar Relatório
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            Exportar PDF
          </Button>
        </div>
      </Card>

      {/* TODO: Adicionar área de visualização do relatório */}
      <Card className="p-6">
        {isGeneratingReport ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {filters.reportType === 'plantoes' && (
                    <>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Colaborador
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Horas
                      </th>
                    </>
                  )}
                  {filters.reportType === 'horas' && (
                    <>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Colaborador
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total de Horas
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                    </>
                  )}
                  {filters.reportType === 'feriados' && (
                    <>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nome do Feriado
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    {filters.reportType === 'plantoes' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {format(new Date(item.data), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.colaborador}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.tipo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.horas}h
                        </td>
                      </>
                    )}
                    {filters.reportType === 'horas' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.colaborador}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.totalHoras}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.tipo}
                        </td>
                      </>
                    )}
                    {filters.reportType === 'feriados' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {format(new Date(item.data), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.tipo}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="min-h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            Selecione os filtros e gere um relatório para visualizar os dados
          </div>
        )}
      </Card>
    </div>
  );
};

export default Reports;