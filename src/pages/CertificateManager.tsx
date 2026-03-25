

  const filteredCertificates = certificates.filter(cert =>
    (cert.participant_name || cert.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cert.certificate_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cert.course_name || cert.certificate_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateCertificateId = () => {
    const random6Digits = Math.floor(100000 + Math.random() * 900000);
    return `MU${random6Digits}`;
  };

  return (
    <ModuleLayout
      title="Certificate Manager"
      description="Issue certificates and manage verification system"
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Issue Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Issue New Certificate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="certificate_id">Certificate ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="certificate_id"
                    value={formData.certificate_id}
                    onChange={(e) => setFormData({ ...formData, certificate_id: e.target.value })}
                    className="bg-black/50 border-white/10"
                    placeholder="MU123456"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, certificate_id: generateCertificateId() })}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="participant_name">Participant Name</Label>
                <Input
                  id="participant_name"
                  value={formData.participant_name}
                  onChange={(e) => setFormData({ ...formData, participant_name: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="participant_email">Participant Email</Label>
                <Input
                  id="participant_email"
                  type="email"
                  value={formData.participant_email}
                  onChange={(e) => setFormData({ ...formData, participant_email: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="course_name">Course/Tournament Name</Label>
                <Input
                  id="course_name"
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  className="bg-black/50 border-white/10"
                  placeholder="BGMI Tournament, Free Fire Championship, etc."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCertificate} className="gradient-primary">
                  Issue Certificate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Issued</p>
                  <p className="text-2xl font-bold text-gradient">{certificates.length}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-gradient">
                    {certificates.filter(cert => 
                      new Date(cert.created_at).getMonth() === new Date().getMonth()
                    ).length}
                  </p>
                </div>
                <Award className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unique Courses</p>
                  <p className="text-2xl font-bold text-gradient">
                    {new Set(certificates.map(cert => cert.course_name || cert.certificate_type)).size}
                  </p>
                </div>
                <Award className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              All Certificates
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search certificates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/50 border-white/10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="shimmer h-12 rounded" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Course/Tournament</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell className="font-mono font-semibold text-blue-400">
                        {certificate.certificate_id || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">{certificate.participant_name || certificate.recipient_name}</TableCell>
                      <TableCell>{certificate.participant_email || 'N/A'}</TableCell>
                      <TableCell>{certificate.course_name || certificate.certificate_type}</TableCell>
                      <TableCell>
                        {new Date(certificate.issue_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default CertificateManager;
