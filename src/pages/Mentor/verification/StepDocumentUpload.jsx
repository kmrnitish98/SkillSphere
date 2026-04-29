import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiFile, FiCheck, FiTrash2, FiShield, FiFileText, FiAward } from 'react-icons/fi';

const UPLOAD_FIELDS = [
  { key: 'idProof', label: 'ID Proof', desc: 'Government-issued photo ID', icon: FiShield, accept: 'image/*,.pdf' },
  { key: 'resume', label: 'Resume / CV', desc: 'PDF or DOCX, max 10MB', icon: FiFileText, accept: '.pdf,.doc,.docx' },
  { key: 'certificates', label: 'Certificates', desc: 'Professional certifications', icon: FiAward, accept: 'image/*,.pdf' },
];

const FileDropZone = ({ field, file, onUpload, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(file ? 100 : 0);
  const inputRef = useRef(null);
  const Icon = field.icon;

  const handleFile = (f) => {
    if (!f) return;
    onUpload(field.key, f);
    // Simulate upload progress
    setUploadProgress(0);
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 30 + 10;
      if (prog >= 100) { prog = 100; clearInterval(interval); }
      setUploadProgress(Math.min(prog, 100));
    }, 200);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed p-5 transition-all cursor-pointer group
        ${isDragging ? 'border-primary-500 bg-primary-50/60 scale-[1.01]' : ''}
        ${file ? 'border-primary-300 bg-primary-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-primary-300 hover:bg-primary-50/30'}`}
    >
      <input ref={inputRef} type="file" accept={field.accept} onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
      
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
          ${file ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-500'}`}>
          {file ? <FiCheck className="text-xl" /> : <Icon className="text-xl" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700">{field.label}</p>
          {file ? (
            <p className="text-xs text-primary-600 font-medium truncate">{file.name}</p>
          ) : (
            <p className="text-xs text-slate-400">{field.desc}</p>
          )}
          
          {/* Progress bar */}
          {file && uploadProgress < 100 && (
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full"
              />
            </div>
          )}
        </div>

        {file ? (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(field.key); setUploadProgress(0); }}
            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <FiTrash2 />
          </button>
        ) : (
          <div className="p-2 text-slate-300">
            <FiUploadCloud className="text-xl" />
          </div>
        )}
      </div>

      {/* Success state */}
      {file && uploadProgress >= 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2"
        >
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
            <FiCheck className="text-xs" /> Uploaded
          </span>
        </motion.div>
      )}
    </div>
  );
};

const StepDocumentUpload = ({ formData, setFormData }) => {
  const handleUpload = (key, file) => {
    setFormData({ ...formData, [key]: file });
  };

  const handleRemove = (key) => {
    const updated = { ...formData };
    delete updated[key];
    setFormData(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Document Upload</h2>
        <p className="text-slate-500 mt-1 text-sm">Upload your verification documents</p>
      </div>

      <div className="space-y-4">
        {UPLOAD_FIELDS.map(field => (
          <FileDropZone
            key={field.key}
            field={field}
            file={formData[field.key]}
            onUpload={handleUpload}
            onRemove={handleRemove}
          />
        ))}
      </div>

      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <FiShield className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-blue-700">Your documents are secure</p>
          <p className="text-xs text-blue-500 mt-0.5">All uploaded files are encrypted and only used for verification purposes.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StepDocumentUpload;
