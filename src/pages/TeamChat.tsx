import React, { useState, useEffect, useRef } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Image, Users, X, Smile, Paperclip, MessageCircle, Circle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { roleNames } from '@/types/auth';
import { castToAdminProfiles } from '@/utils/adminTypeCasting';

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: { name: string; role: string; avatar?: string };
}

interface AdminProfile {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: 'super_admin' | 'betting_admin' | 'trading_admin' | 'social_admin' | 'esports_admin';
  avatar: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

const TeamChat: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    fetchAdmins();
    
    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => fetchMessages()
      )
      .subscribe();

    updateLastLogin();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateLastLogin = async () => {
    if (!adminProfile) return;
    
    try {
      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminProfile.id);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:admins!sender_id(name, role, avatar)
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages((data || []) as ChatMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const typedAdmins = castToAdminProfiles(data || []);
      setAdmins(typedAdmins);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !adminProfile) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: adminProfile.id,
          message: message.trim()
        } as any);

      if (error) throw error;
      
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

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
            <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-accent animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">General Chat</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    {admins.filter(a => getStatusText(a.last_login, a.id) === 'Online').length} members online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground animate-pulse">
                  Live
                </Badge>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-10 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-6 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
                    <MessageCircle className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
                  <p className="text-sm text-muted-foreground">Be the first to start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      {/* Date Separator */}
                      <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent" />
                        <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-[rgba(255,255,255,0.05)]">
                          {date}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent" />
                      </div>

                      {/* Messages */}
                      <div className="space-y-4">
                        {msgs.map((msg) => {
                          const isOwn = msg.sender_id === adminProfile?.id;
                          
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                            >
                              <Avatar className="h-9 w-9 border-2 border-[rgba(255,255,255,0.1)] flex-shrink-0">
                                <AvatarImage src={isOwn ? adminProfile?.avatar : msg.sender?.avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
                                  {isOwn 
                                    ? adminProfile?.name?.split(' ').map(n => n[0]).join('') || 'U'
                                    : msg.sender?.name?.split(' ').map(n => n[0]).join('') || 'U'
                                  }
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                  <span className="text-sm font-medium text-foreground">
                                    {isOwn ? (adminProfile?.name || 'You') : (msg.sender?.name || 'Unknown')}
                                  </span>
                                  <Badge className={`text-[10px] px-1.5 py-0 ${getRoleColor(isOwn ? (adminProfile?.role || '') : (msg.sender?.role || ''))}`}>
                                    {isOwn 
                                      ? roleNames[adminProfile?.role as keyof typeof roleNames]?.split(' ')[0] || 'User'
                                      : roleNames[msg.sender?.role as keyof typeof roleNames]?.split(' ')[0] || 'User'
                                    }
                                  </Badge>
                                </div>
                                
                                <div 
                                  className={`
                                    relative p-3 rounded-2xl
                                    ${isOwn 
                                      ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-br-md' 
                                      : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-foreground rounded-bl-md'
                                    }
                                    shadow-lg
                                  `}
                                >
                                  {msg.message.includes('📷 Shared an image:') ? (
                                    <div className="space-y-2">
                                      <p className="text-sm opacity-80">Shared an image</p>
                                      <img 
                                        src={msg.message.replace('📷 Shared an image: ', '')}
                                        alt="Shared image"
                                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-[rgba(255,255,255,0.1)]"
                                        onClick={() => setSelectedImage(msg.message.replace('📷 Shared an image: ', ''))}
                                      />
                                    </div>
                                  ) : (
                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                  )}
                                </div>
                                
                                <span className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                                  {formatTime(msg.created_at)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[rgba(0,0,0,0.3)] to-[rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl hover:bg-[rgba(255,255,255,0.1)] text-muted-foreground hover:text-foreground transition-all"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={uploading}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl hover:bg-[rgba(255,255,255,0.1)] text-muted-foreground hover:text-foreground transition-all"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={uploading}
                >
                  <Image className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="h-12 bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.15)] rounded-xl pl-4 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-[rgba(255,255,255,0.1)]"
                  >
                    <Smile className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
                
                <Button 
                  onClick={sendMessage}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-105"
                  disabled={!message.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-[rgba(255,255,255,0.1)]">
          <DialogClose className="absolute right-4 top-4 z-10 rounded-full p-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] transition-all">
            <X className="h-5 w-5 text-white" />
            <span className="sr-only">Close</span>
          </DialogClose>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Full view" 
              className="w-full h-full object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
};

export default TeamChat;