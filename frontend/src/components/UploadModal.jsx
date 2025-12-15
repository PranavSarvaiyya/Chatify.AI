import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  if (!isOpen) return null;

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
        setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setStatus('idle');
    const token = localStorage.getItem('token');

    if (!token) {
        navigate('/login');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      setStatus('success');
      setTimeout(() => {
          onClose(); // Auto close on success
          if (onUploadSuccess) onUploadSuccess(response.data); // Pass back chat_id
      }, 1500);
      
    } catch (error) {
      console.error("Upload error", error);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-6 h-6 text-indigo-600" />
                New Chat with Data
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group relative cursor-pointer">
            <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {!file ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-7 h-7 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-200">Drop PDF here</p>
                        <p className="text-sm text-slate-400">or click to browse</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                    <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    <div className="text-left flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); setStatus('idle'); }}
                        className="text-slate-400 hover:text-red-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>

        {status === 'success' && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-center justify-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <CheckCircle className="w-4 h-4" />
                File Processed! Starting Chat...
            </div>
        )}

        {status === 'error' && (
             <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-center text-sm font-medium animate-in fade-in slide-in-from-top-2">
                Upload failed. Please try again.
            </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
                Cancel
            </button>
            <button 
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload & Chat"}
            </button>
        </div>

      </div>
    </div>
  );
};

export default UploadModal;
