




import React, { useState, useEffect, useCallback } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// ---------------------- TYPES ----------------------

interface UploadResult {
  success: number;
  errors: string[];
  total: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  created_at: string;
}

interface ProcessingLog {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ---------------------- COMPONENT ----------------------

const BulkUpload: React.FC = () => {
  const { user, adminProfile } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);

  const [uploadStats, setUploadStats] = useState({
    filesUploaded: 0,
    successRate: 0,
    recordsProcessed: 0
  });

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // ---------------------- INIT ----------------------

  useEffect(() => {
    fetchUploadStats();
    fetchUploadedFiles();
  }, []);

  // ---------------------- FETCH DATA ----------------------

  const fetchUploadStats = async () => {
    const { count } = await supabase
      .from('uploaded_files')
      .select('*', { count: 'exact', head: true });

    setUploadStats((prev) => ({
      ...prev,
      filesUploaded: count || 0
    }));
  };

  const fetchUploadedFiles = async () => {
    const { data } = await supabase
      .from('uploaded_files')
      .select('*')
      .order('created_at', { ascending: false });

    setUploadedFiles(data || []);
  };












  
  // ---------------------- LOG SYSTEM ----------------------

  const addLog = (message: string, type: ProcessingLog['type'] = 'info') => {
    setLogs((prev) => [
      { id: Date.now(), message, type },
      ...prev
    ]);
  };

  // ---------------------- FILE HANDLING ----------------------

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  // ---------------------- DRAG ----------------------

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };














  
  // ---------------------- UPLOAD ----------------------

  const processUpload = async () => {
    if (!files.length || !adminProfile) return;

    setUploading(true);
    setProgress(0);

    let totalProcessed = 0;
    let totalSuccess = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      addLog(`Uploading ${file.name}...`);

      try {
        const fileName = `${adminProfile.id}/${Date.now()}_${file.name}`;

        await supabase.storage.from('uploads').upload(fileName, file);

        await supabase.from('uploaded_files').insert({
          name: file.name,
          file_path: fileName,
          file_size: file.size,
          uploaded_by: adminProfile.id
        });

        const text = await file.text();
        const lines = text.split('\n').filter(Boolean);

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const result = await processCsvData(lines.slice(1), headers);

        totalProcessed += result.total;
        totalSuccess += result.success;

        addLog(`${file.name} processed: ${result.success}/${result.total}`, 'success');

      } catch (err) {
        addLog(`Error in ${file.name}`, 'error');
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploadStats({
      filesUploaded: uploadStats.filesUploaded + files.length,
      successRate: Math.round((totalSuccess / totalProcessed) * 100),
      recordsProcessed: uploadStats.recordsProcessed + totalProcessed
    });

    toast({
      title: 'Upload Completed 🚀',
      description: `${totalSuccess}/${totalProcessed} records processed`
    });

    setUploading(false);
    setFiles([]);
    fetchUploadedFiles();
  };












  
  // ---------------------- CSV PROCESS ----------------------

  const processCsvData = async (rows: string[], headers: string[]): Promise<UploadResult> => {
    const result: UploadResult = { success: 0, errors: [], total: rows.length };

    for (let i = 0; i < rows.length; i++) {
      try {
        const values = rows[i].split(',');

        const record: any = {};
        headers.forEach((h, index) => {
          record[h] = values[index];
        });

        await supabase.from('esports_players').insert({
          player_name: record.player_name || 'Unknown',
          email: record.email || 'default@example.com'
        });

        result.success++;
      } catch (err) {
        result.errors.push(`Row ${i + 1}`);
      }
    }

    return result;
  };

  // ---------------------- DELETE ----------------------

  const deleteFile = async (id: string) => {
    await supabase.from('uploaded_files').delete().eq('id', id);
    fetchUploadedFiles();
  };













  
  // ---------------------- UI ----------------------

  return (
    <ModuleLayout title="Advanced Bulk Upload System">

      {/* ---------------- STATS ---------------- */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Files" value={uploadStats.filesUploaded} />
        <StatCard title="Success %" value={uploadStats.successRate} />
        <StatCard title="Records" value={uploadStats.recordsProcessed} />
      </div>

      {/* ---------------- DROP ZONE ---------------- */}
      <Card className="mt-6">
        <CardContent
          className={`p-10 border-2 border-dashed text-center ${
            dragActive ? 'border-purple-500' : ''
          }`}
          onDragEnter={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto mb-4" size={40} />
          <p>Drag & Drop Files</p>

          <input
            type="file"
            multiple
            onChange={(e) => handleFiles(e.target.files!)}
          />

          <Button onClick={processUpload} disabled={uploading}>
            {uploading ? `Uploading ${progress}%` : 'Start Upload'}
          </Button>
        </CardContent>
      </Card>













      
      {/* ---------------- FILE LIST ---------------- */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Selected Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.map((file, i) => (
            <div key={i} className="flex justify-between">
              <span>{file.name}</span>
              <Button onClick={() => removeFile(i)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ---------------- HISTORY ---------------- */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedFiles.map(file => (
            <div key={file.id} className="flex justify-between">
              <span>{file.name}</span>
              <Button onClick={() => deleteFile(file.id)}>
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>












      
      {/* ---------------- LOGS ---------------- */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Processing Logs</CardTitle>
        </CardHeader>
        <CardContent className="max-h-60 overflow-auto">
          {logs.map(log => (
            <p key={log.id} className={`text-sm ${log.type === 'error' ? 'text-red-400' : ''}`}>
              {log.message}
            </p>
          ))}
        </CardContent>
      </Card>

    </ModuleLayout>
  );
};











// ---------------------- SMALL COMPONENT ----------------------

const StatCard = ({ title, value }: any) => (
  <Card>
    <CardContent className="text-center p-4">
      <h2 className="text-xl font-bold">{value}</h2>
      <p className="text-sm text-gray-400">{title}</p>
    </CardContent>
  </Card>
);

export default BulkUpload;
