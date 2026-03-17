const BulkUpload: React.FC = () => {
  const { user, adminProfile } = useAuth();

  const [uploadStats, setUploadStats] = useState({
    filesUploaded: 0,
    successRate: 0,
    recordsProcessed: 0
  });

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  return (
    <ModuleLayout
      title="Bulk Upload & Import"
      description="Upload CSV/Excel files for tournaments and orders with smart validation"
    >
      {/* UI Cards + Upload Section */}
    </ModuleLayout>
  );
};
