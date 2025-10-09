// src/components/AvatarUpload.tsx
import React, { useState, useRef } from 'react';
import { uploadAvatar, uploadAvatarWithProgress, type AvatarUploadOptions } from '../services/avatarService';
import { useToastContext } from '../contexts/ToastContext';
import { Upload, X, Check, Camera } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string;
  userId: string;
  userName: string;
  organizationId?: string;
  isUserProfile?: boolean;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUploadButton?: boolean;
  disabled?: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  userId,
  userName,
  organizationId,
  isUserProfile = false,
  onAvatarUpdated,
  size = 'lg',
  showUploadButton = true,
  disabled = false
}) => {
  const { success, error } = useToastContext();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Iniciar upload
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const options: AvatarUploadOptions = {
        userId,
        file,
        organizationId,
        isUserProfile
      };

      let result;
      
      // Usar upload com progresso para arquivos maiores que 1MB
      if (file.size > 1024 * 1024) {
        result = await uploadAvatarWithProgress(
          options,
          (progress) => setUploadProgress(progress)
        );
      } else {
        result = await uploadAvatar(options);
        setUploadProgress(100);
      }

      if (result.success && result.avatarUrl) {
        success('Avatar atualizado', 'Avatar atualizado com sucesso!');
        setPreviewUrl(null);
        onAvatarUpdated?.(result.avatarUrl);
      } else {
        error('Erro no upload', result.error || 'Erro ao fazer upload do avatar.');
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      error('Erro no upload', 'Erro ao fazer upload do avatar. Tente novamente.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayAvatar = previewUrl || currentAvatar;
  const displayName = userName || 'Usuário';

  return (
    <div className="relative group">
      {/* Avatar */}
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Overlay de upload */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              title="Alterar avatar"
            >
              <Camera size={20} className="text-white" />
            </button>
          </div>
        )}

        {/* Indicador de upload */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <div className="text-xs">
                {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Enviando...'}
              </div>
            </div>
          </div>
        )}

        {/* Botão de remover preview */}
        {previewUrl && !uploading && (
          <button
            onClick={handleRemovePreview}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Cancelar"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Botão de upload (alternativo) */}
      {showUploadButton && !disabled && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>Alterar Avatar</span>
            </>
          )}
        </button>
      )}

      {/* Input de arquivo (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading || disabled}
      />
    </div>
  );
};

export default AvatarUpload;
