import { FileManagerControls } from '@/components/admin/filemanager/FileManagerControls';

export default function FileManagerPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">File Manager</h1>
      <FileManagerControls />
    </div>
  );
}