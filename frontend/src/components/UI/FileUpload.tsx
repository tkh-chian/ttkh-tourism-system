import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { FileUploadResult } from '../../types';

interface FileUploadProps {
  onUpload?: (files: FileUploadResult[]) => void;
  onRemove?: (index: number) => void;
  files?: FileUploadResult[];
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  label?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  onRemove,
  files = [],
  accept = 'image/*,.pdf',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  label = '选择文件',
  helperText,
  className = '',
  disabled = false
}) => {
  const [uploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    const validFiles: FileUploadResult[] = [];

    for (const file of fileArray) {
      // 文件大小检查
      if (file.size > maxSize) {
        setError(`文件 ${file.name} 大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
        continue;
      }

      // 转换为base64
      try {
        const base64 = await fileToBase64(file);
        validFiles.push({
          data: base64,
          filename: file.name,
          size: file.size,
          type: file.type
        });
      } catch (error) {
        console.error('文件转换错误:', error);
        setError(`文件 ${file.name} 处理失败`);
      }
    }

    if (validFiles.length > 0) {
      setError('');
      onUpload?.(validFiles);
    }

    // 清空input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current && !disabled && !uploading) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (index: number) => {
    onRemove?.(index);
  };

  return (
    <div className={`file-upload ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      <Button
        onClick={handleButtonClick}
        disabled={disabled || uploading}
        variant="outline"
        className="w-full"
      >
        {uploading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            上传中...
          </>
        ) : (
          label || '选择文件'
        )}
      </Button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                className="text-red-600 hover:text-red-700"
              >
                删除
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;