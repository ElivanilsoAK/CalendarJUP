import { useState, useEffect } from 'react';
import { storage, db } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { generateCalendar, isSameDay } from '../utils/calendarLogic';
import type { Plantonista, Vacation, Holiday } from '../utils/calendarLogic';
import { getNationalHolidays, getCustomHolidaysForOrg, addCustomHoliday, deleteCustomHoliday } from '../services/holidayService'; // Import the service
import type { CustomHoliday } from '../services/holidayService';
import CalendarView from '../components/CalendarView';
import { logCalendarGenerated, logPdfExport } from '../firebase/analytics';
import { ArrowLeft, ArrowRight, PartyPopper, Building, Users, CalendarDays, Eye, Download } from 'lucide-react';
import { exportCalendarToPDF, savePDF, exportCollaboratorPDF } from '../utils/pdfExport';

// Interfaces
interface Day {
    date: Date;
    plantonista: Plantonista | null;
}

const steps = [
  { id: 1, name: 'Empresa', icon: Building },
  { id: 2, name: 'Plantonistas', icon: Users },
  { id: 3, name: 'Feriados', icon: CalendarDays },
  { id: 4, name: 'Revisar', icon: Eye },
];

const CalendarGenerator = () => {
  const { currentUserOrg } = useAuth();
  const [step, setStep] = useState(1);
  
  // Form State
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#6B7280');
  const [plantonistas, setPlantonistas] = useState<Plantonista[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [endMonth, setEndMonth] = useState(new Date().getMonth());
  const [calendarType, setCalendarType] = useState<'monthly' | 'yearly'>('monthly');

  // UI State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newPlantonistaName, setNewPlantonistaName] = useState('');
  const [newCustomHolidayName, setNewCustomHolidayName] = useState('');
  const [newCustomHolidayDate, setNewCustomHolidayDate] = useState('');
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [generatedCalendar, setGeneratedCalendar] = useState<Day[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCollaboratorPdf, setIsExportingCollaboratorPdf] = useState<Record<string, boolean>>({});


  // Fetch holidays when year changes
  useEffect(() => {
    const fetchNationalHolidays = async () => {
      if (!year) return;
      setLoadingHolidays(true);
      try {
        const data = await getNationalHolidays(year);
        setHolidays(data);
      } catch (error) {
        console.error("Failed to fetch national holidays:", error);
        // TODO: Show an error message to the user
      } finally {
        setLoadingHolidays(false);
      }
    };
    fetchNationalHolidays();
  }, [year]);

  // Fetch custom holidays on component mount
  useEffect(() => {
    const fetchCustomHolidays = async () => {
      if (!currentUserOrg) return;
      try {
        const holidaysFromDb = await getCustomHolidaysForOrg(currentUserOrg.orgId);
        setCustomHolidays(holidaysFromDb);
      } catch (error) {
        console.error("Failed to fetch custom holidays:", error);
      }
    };
    fetchCustomHolidays();
  }, [currentUserOrg]);

  // Handlers
  const handleLogoUpload = async (file: File) => {
    if (!file || !currentUserOrg) return;
    
    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou GIF)');
      return;
    }
    
    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 10MB');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storageRef = ref(storage, `organizations/${currentUserOrg.orgId}/logos/${fileName}`);
      
      // Upload do arquivo
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload failed:", error);
            reject(error);
          }, 
          () => {
            resolve();
          }
        );
      });
      
      // Obter URL de download
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      setLogoUrl(downloadURL);
      setUploadProgress(100);
      
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert('Erro ao fazer upload do logo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPlantonista = () => {
    if (newPlantonistaName.trim()) {
      setPlantonistas([...plantonistas, { id: Date.now().toString(), name: newPlantonistaName, vacations: [] }]);
      setNewPlantonistaName('');
    }
  };

  const handleRemovePlantonista = (id: string) => setPlantonistas(plantonistas.filter((p) => p.id !== id));

  const handleAddVacation = (plantonistaId: string) => {
    const newVacation: Vacation = { id: Date.now().toString(), startDate: '', endDate: '' };
    setPlantonistas(plantonistas.map((p) => p.id === plantonistaId ? { ...p, vacations: [...p.vacations, newVacation] } : p));
  };

  const handleRemoveVacation = (plantonistaId: string, vacationId: string) => {
    setPlantonistas(plantonistas.map((p) => p.id === plantonistaId ? { ...p, vacations: p.vacations.filter((v) => v.id !== vacationId) } : p));
  };

  const handleVacationChange = (plantonistaId: string, vacationId: string, field: 'startDate' | 'endDate', value: string) => {
    setPlantonistas(plantonistas.map((p) => p.id === plantonistaId ? { ...p, vacations: p.vacations.map((v) => v.id === vacationId ? { ...v, [field]: value } : v) } : p));
  };

  const handleAddCustomHoliday = async () => {
    if (newCustomHolidayName.trim() && newCustomHolidayDate && currentUserOrg) {
      try {
        const newHoliday = await addCustomHoliday(currentUserOrg.orgId, {
          name: newCustomHolidayName,
          date: newCustomHolidayDate,
        });
        setCustomHolidays([...customHolidays, newHoliday]);
        setNewCustomHolidayName('');
        setNewCustomHolidayDate('');
      } catch (error) {
        console.error('Failed to add custom holiday:', error);
      }
    }
  };

  const handleRemoveCustomHoliday = async (id: string) => {
    if (!currentUserOrg) return;
    try {
      await deleteCustomHoliday(currentUserOrg.orgId, id);
      setCustomHolidays(customHolidays.filter((h) => h.id !== id));
    } catch (error) {
      console.error('Failed to delete custom holiday:', error);
    }
  };

  const handleAssignmentChange = (date: Date, newPlantonistaId: string | null) => {
    setGeneratedCalendar(prevCalendar => {
      return prevCalendar.map(day => {
        if (isSameDay(day.date, date)) {
          const newPlantonista = plantonistas.find(p => p.id === newPlantonistaId) || null;
          return { ...day, plantonista: newPlantonista };
        }
        return day;
      });
    });
  };

  const handleFinalSubmit = async () => {
    if (!currentUserOrg) return;

    const allHolidays = [...holidays, ...customHolidays];
    let displayCalendar: Day[] = [];

    if (calendarType === 'monthly') {
      // Gerar apenas o mês selecionado
      const calendarData = generateCalendar(year, month, plantonistas, allHolidays);
      const calendarId = `${year}-${month + 1}`;
      const calendarRef = doc(db, 'organizations', currentUserOrg.orgId, 'calendars', calendarId);
      await setDoc(calendarRef, {
        year,
        month,
        companyName,
        logoUrl,
        primaryColor,
        secondaryColor,
        calendarData: calendarData.map(day => ({ date: day.date.toISOString(), plantonista: day.plantonista ? day.plantonista.name : null})),
        createdAt: new Date(),
      });
      displayCalendar = calendarData;
    } else {
      // Gerar calendário anual (do mês inicial ao final)
      const startM = Math.min(startMonth, endMonth);
      const endM = Math.max(startMonth, endMonth);
      
      for (let m = startM; m <= endM; m++) {
        const calendarData = generateCalendar(year, m, plantonistas, allHolidays);
        const calendarId = `${year}-${m + 1}`;
        const calendarRef = doc(db, 'organizations', currentUserOrg.orgId, 'calendars', calendarId);
        await setDoc(calendarRef, {
          year,
          month: m,
          companyName,
          logoUrl,
          primaryColor,
          secondaryColor,
          calendarData: calendarData.map(day => ({ date: day.date.toISOString(), plantonista: day.plantonista ? day.plantonista.name : null})),
          createdAt: new Date(),
        });
        
        // Exibir o primeiro mês na tela
        if (m === startM) {
          displayCalendar = calendarData;
        }
      }
    }

    setGeneratedCalendar(displayCalendar);
    logCalendarGenerated(currentUserOrg.orgId);
  };

  const handleExportPdf = async () => {
    if (!currentUserOrg || generatedCalendar.length === 0) return;

    setIsExportingPdf(true);
    try {
      const allHolidays = [...holidays, ...customHolidays];
      const doc = await exportCalendarToPDF(generatedCalendar, allHolidays, {
        year,
        month,
        companyName,
        companyLogo: logoUrl,
        primaryColor,
        secondaryColor,
      });

      savePDF(doc, `calendario-${companyName.toLowerCase().replace(/\s+/g, '-')}-${month + 1}-${year}.pdf`);
      logPdfExport('complete', currentUserOrg.orgId);
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCollaboratorPdf = async (collaboratorName: string) => {
    if (!currentUserOrg || generatedCalendar.length === 0) return;

    setIsExportingCollaboratorPdf(prev => ({ ...prev, [collaboratorName]: true }));
    try {
      const doc = await exportCollaboratorPDF(collaboratorName, generatedCalendar, {
        year,
        month,
        companyName,
        companyLogo: logoUrl,
        primaryColor,
        secondaryColor,
      });
      savePDF(doc, `calendario-${collaboratorName.toLowerCase().replace(/\s+/g, '-')}-${month + 1}-${year}.pdf`);
      logPdfExport('individual', currentUserOrg.orgId);
    } catch (error) {
      console.error(`Failed to export PDF for ${collaboratorName}:`, error);
    } finally {
      setIsExportingCollaboratorPdf(prev => ({ ...prev, [collaboratorName]: false }));
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, steps.length));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gerador de Calendário</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Siga os passos para criar um novo calendário de plantão.</p>
      </div>

      {/* Stepper Navigation */}
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {steps.map((s, index) => (
              <li key={s.name} className={`relative ${index !== steps.length - 1 ? 'flex-1' : ''}`}>
                {step > s.id ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-blue-600" />
                    </div>
                    <button onClick={() => setStep(s.id)} className="relative w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full hover:bg-blue-700">
                      <s.icon className="w-6 h-6 text-white" aria-hidden="true" />
                    </button>
                  </>
                ) : step === s.id ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <button
                      className="relative w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border-2 border-blue-600 rounded-full"
                      aria-current="step"
                    >
                      <s.icon className="w-6 h-6 text-blue-600" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <button onClick={() => setStep(s.id)} className="group relative w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full hover:border-gray-400">
                       <s.icon className="w-6 h-6 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                    </button>
                  </>
                )}
                 <p className="absolute text-center -bottom-7 w-28 -left-9 text-xs font-semibold text-gray-600 dark:text-gray-300 hidden md:block">{s.name}</p>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm min-h-[400px]">
        {step === 1 && (
            <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-gray-100">Informações da Empresa e Período</h2>
                
                {/* Calendar Type Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Calendário</label>
                    <div className="flex space-x-4">
                        <label className="flex items-center">
                            <input 
                                type="radio" 
                                value="monthly" 
                                checked={calendarType === 'monthly'}
                                onChange={(e) => setCalendarType(e.target.value as 'monthly')}
                                className="mr-2"
                            />
                            Mensal
                        </label>
                        <label className="flex items-center">
                            <input 
                                type="radio" 
                                value="yearly" 
                                checked={calendarType === 'yearly'}
                                onChange={(e) => setCalendarType(e.target.value as 'yearly')}
                                className="mr-2"
                            />
                            Anual
                        </label>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {calendarType === 'monthly' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mês e Ano</label>
                            <div className="flex space-x-4">
                                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="p-2 border dark:bg-gray-700 dark:border-gray-600 rounded-lg w-full">
                                    {Array.from({length: 12}, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>)}
                                </select>
                                <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="p-2 border dark:bg-gray-700 dark:border-gray-600 rounded-lg w-full" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mês Inicial</label>
                                <div className="flex space-x-4">
                                    <select value={startMonth} onChange={(e) => setStartMonth(parseInt(e.target.value))} className="p-2 border dark:bg-gray-700 dark:border-gray-600 rounded-lg w-full">
                                        {Array.from({length: 12}, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>)}
                                    </select>
                                    <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="p-2 border dark:bg-gray-700 dark:border-gray-600 rounded-lg w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mês Final</label>
                                <div className="flex space-x-4">
                                    <select value={endMonth} onChange={(e) => setEndMonth(parseInt(e.target.value))} className="p-2 border dark:bg-gray-700 dark:border-gray-600 rounded-lg w-full">
                                        {Array.from({length: 12}, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>)}
                                    </select>
                                    <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="p-2 border dark:bg-gray-700 dark:border-gray-600 rounded-lg w-full" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {/* Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Empresa</label>
                            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-4 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="Ex: Acme Inc." />
                        </div>
                        <div className="flex items-center space-x-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor Primária</label>
                                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-24 h-12 p-1 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor Secundária</label>
                                <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-24 h-12 p-1 border rounded-lg" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo da Empresa</label>
                        <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {logoUrl ? <img src={logoUrl} alt="Logo" className="mx-auto h-24 w-auto" /> : <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center"><label htmlFor="logo-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500"><span>Carregar um arquivo</span><input id="logo-upload" type="file" className="sr-only" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])} accept="image/*" /></label></div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                            </div>
                        </div>
                        {isUploading && <div className="mt-4"><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div><p className="text-sm text-center mt-1">{Math.round(uploadProgress)}%</p></div>}
                    </div>
                </div>
            </div>
        )}
        {step === 2 && (
            <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-gray-100">Plantonistas e Férias</h2>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adicionar Plantonista</label>
                    <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                        <input type="text" value={newPlantonistaName} onChange={(e) => setNewPlantonistaName(e.target.value)} className="flex-grow px-4 py-2 border dark:bg-gray-700 dark:border-gray-600 rounded-lg" placeholder="Nome do colaborador" />
                        <button type="button" onClick={handleAddPlantonista} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Adicionar</button>
                    </div>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {plantonistas.map((plantonista) => (
                    <div key={plantonista.id} className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold">{plantonista.name}</p>
                            <div className="flex items-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => handleExportCollaboratorPdf(plantonista.name)}
                                    disabled={isExportingCollaboratorPdf[plantonista.name] || generatedCalendar.length === 0}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center space-x-1 disabled:opacity-50"
                                >
                                    <Download size={14} />
                                    <span>{isExportingCollaboratorPdf[plantonista.name] ? 'Exportando...' : 'Exportar PDF'}</span>
                                </button>
                                <button type="button" onClick={() => handleRemovePlantonista(plantonista.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remover</button>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2"><h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Períodos de Férias:</h4>
                        {plantonista.vacations.map((vacation) => (
                            <div key={vacation.id} className="flex items-center space-x-2"><input type="date" value={vacation.startDate} onChange={(e) => handleVacationChange(plantonista.id, vacation.id, 'startDate', e.target.value)} className="px-2 py-1 border dark:bg-gray-600 dark:border-gray-500 rounded-lg text-sm" /><span>até</span><input type="date" value={vacation.endDate} onChange={(e) => handleVacationChange(plantonista.id, vacation.id, 'endDate', e.target.value)} className="px-2 py-1 border dark:bg-gray-600 dark:border-gray-500 rounded-lg text-sm" /><button type="button" onClick={() => handleRemoveVacation(plantonista.id, vacation.id)} className="text-red-500 text-xs">&#x2715;</button></div>
                        ))}
                        <button type="button" onClick={() => handleAddVacation(plantonista.id)} className="text-blue-500 hover:text-blue-700 text-sm font-medium mt-2">+ Adicionar Férias</button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        )}
        {step === 3 && (
            <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-gray-100">Feriados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-md font-semibold dark:text-gray-200">Feriados Nacionais ({year}):</h4>
                        {loadingHolidays ? <p>Carregando...</p> : <ul className="mt-2 space-y-1 text-sm list-disc list-inside h-64 overflow-y-auto border dark:border-gray-700 p-2 rounded-lg">{holidays.map(h => <li key={h.date}>{h.date}: {h.name}</li>)}</ul>}
                    </div>
                    <div>
                        <h4 className="text-md font-semibold mb-2 dark:text-gray-200">Feriados da Empresa (Customizados)</h4>
                        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mb-4">
                            <input type="text" value={newCustomHolidayName} onChange={(e) => setNewCustomHolidayName(e.target.value)} className="flex-grow px-4 py-2 border dark:bg-gray-700 dark:border-gray-600 rounded-lg" placeholder="Nome do feriado" />
                            <input type="date" value={newCustomHolidayDate} onChange={(e) => setNewCustomHolidayDate(e.target.value)} className="px-4 py-2 border dark:bg-gray-700 dark:border-gray-600 rounded-lg" />
                            <button type="button" onClick={handleAddCustomHoliday} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg">+</button>
                        </div>
                        <ul className="space-y-1 text-sm list-disc list-inside h-64 overflow-y-auto border dark:border-gray-700 p-2 rounded-lg">
                            {customHolidays.map(h => <li key={h.id} className="flex justify-between items-center p-1"><span>{h.date}: {h.name}</span><button type="button" onClick={() => handleRemoveCustomHoliday(h.id)} className="text-red-500 text-xs">&#x2715;</button></li>)}
                        </ul>
                    </div>
                </div>
            </div>
        )}
        {step === 4 && (
            <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-gray-100">Revisar e Gerar</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Revise as informações e clique em "Gerar e Salvar" para criar o calendário.</p>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div><strong className="font-semibold text-gray-800 dark:text-gray-100">Tipo:</strong> {calendarType === 'monthly' ? 'Mensal' : 'Anual'}</div>
                    <div><strong className="font-semibold text-gray-800 dark:text-gray-100">Período:</strong> {
                        calendarType === 'monthly' 
                            ? new Date(year, month).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
                            : `${new Date(year, startMonth).toLocaleString('pt-BR', { month: 'long' })} a ${new Date(year, endMonth).toLocaleString('pt-BR', { month: 'long' })} ${year}`
                    }</div>
                    <div><strong className="font-semibold text-gray-800 dark:text-gray-100">Empresa:</strong> {companyName}</div>
                    <div><strong className="font-semibold text-gray-800 dark:text-gray-100">Plantonistas:</strong> {plantonistas.map(p => p.name).join(', ')}</div>
                    <div><strong className="font-semibold text-gray-800 dark:text-gray-100">Total de Feriados:</strong> {holidays.length + customHolidays.length}</div>
                </div>
            </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Anterior</span>
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
              >
                <span>Próximo</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 flex items-center space-x-2"
              >
                <PartyPopper size={16} />
                <span>Gerar e Salvar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Final Calendar View */}
      {generatedCalendar.length > 0 && (
        <>
            <div className="flex justify-end mt-8 mb-4">
                <button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-400"
                >
                    {isExportingPdf ? 'Exportando...' : 'Exportar para PDF'}
                </button>
            </div>
            <CalendarView 
                calendar={generatedCalendar}
                holidays={[...holidays, ...customHolidays]}
                year={year}
                month={month}
                companyName={companyName}
                logoUrl={logoUrl}
                primaryColor={primaryColor}
                plantonistas={plantonistas}
                onAssignmentChange={handleAssignmentChange}
            />
        </>
      )}
    </div>
  );
};

export default CalendarGenerator;
