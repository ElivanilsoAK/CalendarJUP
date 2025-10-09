import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { db, storage } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { UserIcon, CalendarIcon, BriefcaseIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { logPdfExport, logCollaboratorUpdated } from '../firebase/analytics';

import type { Collaborator } from '../types/collaborator';

interface CollaboratorDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    collaborator: Collaborator | null;
    onEdit?: (collaborator: Collaborator) => void;
}

const CollaboratorDetailModal: React.FC<CollaboratorDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    collaborator,
    onEdit 
}) => {
    const { currentUserOrg } = useAuth();
    const [onCallDates, setOnCallDates] = useState<Date[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !collaborator || !currentUserOrg) return;

        setUploading(true);

        try {
            const storageRef = ref(storage, `organizations/${currentUserOrg.orgId}/avatars/${collaborator.id}`);
            await uploadBytes(storageRef, file);
            const avatarUrl = await getDownloadURL(storageRef);

            const collaboratorRef = doc(db, 'organizations', currentUserOrg.orgId, 'collaborators', collaborator.id);
            await updateDoc(collaboratorRef, {
                avatar: avatarUrl
            });

                        logCollaboratorUpdated(collaborator.id);
        } catch (error) {
            console.error('Error uploading avatar:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!collaborator || !currentUserOrg || onCallDates.length === 0) return;

        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Escala de Plantão', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(`Plantonista: ${collaborator.name}`, 20, 40);
        if (collaborator.role) {
            doc.text(`Cargo: ${collaborator.role}`, 20, 50);
        }

        const tableData = onCallDates.map(date => [
            date.toLocaleDateString(),
            new Date(date).toLocaleDateString('pt-BR', { weekday: 'long' })
        ]);

        (doc as any).autoTable({
            head: [['Data', 'Dia da Semana']],
            body: tableData,
            startY: 70,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`escala-${collaborator.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
                logPdfExport('individual', collaborator.id);
    };

    if (!collaborator) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel>
                                <Card className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                                    <div className="relative p-6">
                                        <div className="absolute top-4 right-4">
                                            <button
                                                onClick={onClose}
                                                className="rounded-full p-1 text-gray-400 hover:text-gray-500"
                                            >
                                                <span className="sr-only">Fechar</span>
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            <div className="relative">
                                                {collaborator.avatar ? (
                                                    <img
                                                        src={collaborator.avatar}
                                                        alt={collaborator.name}
                                                        className="h-20 w-20 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <UserIcon className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                                <label
                                                    htmlFor="avatar-upload"
                                                    className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-md cursor-pointer hover:bg-gray-50"
                                                >
                                                    <span className="sr-only">Alterar foto</span>
                                                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </label>
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleAvatarUpload}
                                                    disabled={uploading}
                                                />
                                            </div>
                                            <div>
                                                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                                                    {collaborator.name}
                                                </Dialog.Title>
                                                <p className="text-sm text-gray-500">{collaborator.email}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center space-x-3 text-sm">
                                                <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                                                <span className="text-gray-500">Cargo:</span>
                                                <span className="font-medium text-gray-900">{collaborator.role || 'Não definido'}</span>
                                            </div>
                                            
                                            <div className="flex items-center space-x-3 text-sm">
                                                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                                <span className="text-gray-500">Departamento:</span>
                                                <span className="font-medium text-gray-900">{collaborator.department || 'Não definido'}</span>
                                            </div>
                                            
                                            <div className="flex items-center space-x-3 text-sm">
                                                <CalendarIcon className="h-5 w-5 text-gray-400" />
                                                <span className="text-gray-500">Data de início:</span>
                                                <span className="font-medium text-gray-900">
                                                    {collaborator.startDate 
                                                        ? new Date(collaborator.startDate).toLocaleDateString()
                                                        : 'Não definido'
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-8 border-t border-gray-200 pt-6">
                                            <h4 className="text-sm font-medium text-gray-900">Plantões</h4>
                                            {loading ? (
                                                <div className="mt-2 flex justify-center py-4">
                                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                                                </div>
                                            ) : onCallDates.length > 0 ? (
                                                <ul className="mt-2 divide-y divide-gray-200">
                                                    {onCallDates.slice(0, 5).map((date) => (
                                                        <li key={date.toISOString()} className="py-2">
                                                            <time className="text-sm text-gray-500">
                                                                {date.toLocaleDateString('pt-BR', {
                                                                    weekday: 'long',
                                                                    day: 'numeric',
                                                                    month: 'long'
                                                                })}
                                                            </time>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="mt-2 text-sm text-gray-500">
                                                    Nenhum plantão agendado
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-6 flex justify-end space-x-3">
                                            {onEdit && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => onEdit(collaborator)}
                                                >
                                                    Editar Perfil
                                                </Button>
                                            )}
                                            <Button
                                                variant="secondary"
                                                onClick={handleExportPDF}
                                                disabled={onCallDates.length === 0}
                                            >
                                                Exportar PDF
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );



    useEffect(() => {
        const fetchCalendar = async () => {
            if (!isOpen || !collaborator || !currentUserOrg) return;

            setLoading(true);
            const year = new Date().getFullYear();
            const month = new Date().getMonth();
            const calendarId = `${year}-${month + 1}`;
            
            try {
                const calendarRef = doc(db, 'organizations', currentUserOrg.orgId, 'calendars', calendarId);
                const docSnap = await getDoc(calendarRef);

                if (docSnap.exists()) {
                    const calendarData = docSnap.data().calendarData;
                    interface CalendarDay {
                        date: string;
                        plantonista: string | null;
                    }

                    const dates = calendarData
                        .filter((day: CalendarDay) => day.plantonista === collaborator.email)
                        .map((day: CalendarDay) => new Date(day.date));
                    setOnCallDates(dates);
                } else {
                    setOnCallDates([]);
                }
            } catch (error) {
                console.error("Error fetching calendar data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCalendar();
    }, [isOpen, collaborator, currentUserOrg]);



    if (!isOpen || !collaborator) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Plantões de {collaborator?.email}</h2>
                
                {loading ? (
                    <p>Carregando...</p>
                ) : onCallDates.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2 mb-6 h-64 overflow-y-auto border p-4 rounded-lg">
                        {onCallDates.map(date => (
                            <li key={date.toString()}>{date.toLocaleDateString('pt-BR')}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="mb-6">Nenhum plantão encontrado para este mês.</p>
                )}

                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 bg-gray-200 hover:bg-gray-300">
                        Fechar
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        disabled={onCallDates.length === 0}
                        className="px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        Exportar PDF Individual
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CollaboratorDetailModal;
