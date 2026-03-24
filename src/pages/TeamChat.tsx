
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminProfile) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chat_images/${adminProfile.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: adminProfile.id,
          message: `📷 Shared an image: ${publicUrl}`
        } as any);

      if (messageError) throw messageError;

      await supabase
        .from('uploaded_files')
        .insert({
          name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: adminProfile.id
        } as any);

      toast({
        title: "Image Shared",
        description: "Image has been shared to the chat"
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: string) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      super_admin: 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border-red-500/30',
      betting_admin: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30',
      trading_admin: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30',
      social_admin: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
      esports_admin: 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-300 border-orange-500/30'
    };
    return colors[role as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getStatusColor = (lastLogin: string | null, adminId: string) => {
    if (adminProfile && adminId === adminProfile.id) {
      return 'bg-green-500';
    }

    if (!lastLogin) return 'bg-gray-500';
    
    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastLoginDate.getTime()) / (1000 * 60);
    
    if (diffMinutes < 10) return 'bg-green-500';
    if (diffMinutes < 60) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusText = (lastLogin: string | null, adminId: string) => {
    if (adminProfile && adminId === adminProfile.id) {
      return 'Online';
    }

    if (!lastLogin) return 'Offline';
    
    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastLoginDate.getTime()) / (1000 * 60);
    
    if (diffMinutes < 10) return 'Online';
    if (diffMinutes < 60) return 'Away';
    return 'Offline';
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: ChatMessage[] }, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <ModuleLayout
      title="Team Chat"
      description="Real-time team communication"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Team Members Sidebar */}
        <div className="hidden lg:block">
          <div className="h-full rounded-2xl bg-[rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.15)] backdrop-blur-xl overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Team Members</h3>
                  <p className="text-xs text-muted-foreground">{admins.filter(a => getStatusText(a.last_login, a.id) === 'Online').length} online</p>
                </div>
              </div>
            </div>

            {/* Members List */}
            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="p-3 space-y-2">
                {admins.map((admin) => (
                  <div 
                    key={admin.id} 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-all duration-300 cursor-pointer group"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-[rgba(255,255,255,0.1)] group-hover:border-primary/50 transition-all">
                        <AvatarImage src={admin.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-medium">
                          {admin.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${getStatusColor(admin.last_login, admin.id)}`}>
                        {getStatusText(admin.last_login, admin.id) === 'Online' && (
                          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{admin.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${getStatusText(admin.last_login, admin.id) === 'Online' ? 'text-green-400' : 'text-muted-foreground'}`}>
                          {getStatusText(admin.last_login, admin.id)}
                        </span>
                      </div>
                    </div>
                    <Badge className={`text-[10px] px-2 py-0.5 ${getRoleColor(admin.role)}`}>
                      {roleNames[admin.role as keyof typeof roleNames]?.split(' ')[0]}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <div className="flex-1 flex flex-col rounded-2xl bg-[rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.15)] backdrop-blur-xl overflow-hidden">
            {/* Chat Header */}
