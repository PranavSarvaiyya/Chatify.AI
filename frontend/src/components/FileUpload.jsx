import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, success, error
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
        setStatus('idle');
        setMessage('');
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
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      setStatus('success');
      setMessage('Processed & Chunked successfully');
      if (onUploadSuccess) onUploadSuccess(response.data);
    } catch (error) {
      console.error("Upload error", error);
      setStatus('error');
      if (error.response?.status === 401) {
          navigate('/login');
      } else {
          setMessage('Upload failed. Try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-indigo-50 rounded-lg">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Upload Data</h2>
      </div>

      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all group relative">
        <input 
          type="file" 
          id="file-upload"
          accept=".pdf"
          onChange={handleFileChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {!file ? (
            <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <div>
                    <span className="text-indigo-600 font-semibold block">Click to upload PDF</span>
                    <span className="text-slate-400 text-xs">or drag and drop</span>
                </div>
            </div>
        ) : (
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 relative z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-left min-w-0">
                        <p className="font-medium text-slate-700 text-sm truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}
      </div>

      {file && (
        <button 
            onClick={handleUpload} 
            disabled={uploading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {uploading ? (
            <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Chunking & Indexing...
            </>
            ) : (
            "Start Upload"
            )}
        </button>
      )}

      {message && (
        <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
