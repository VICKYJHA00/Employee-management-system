import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Bell, Info, Send, User, Users, BellRing, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface Notification {
  id: string;
  title: string;
  message: string;
  sender_id: string | null;
  recipient_type: string;
  recipients: string[];
  priority: string;
  is_read_by: string[];
  created_at: string;
  sender?: { name: string };
}

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

const NotificationBell: React.FC = () => {
  const { adminProfile } = useAuth();
  const { isSupported, permission, requestPermission, showNotification } = usePushNotifications();
  const { playSound } = useNotificationSound();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientType: 'all',
    priority: 'normal',
  });
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    if (!adminProfile) return;

    fetchNotifications();
    fetchAdmins();

    if (isSupported && permission === 'default') {
      requestPermission();
    }

    const channel = supabase
      .channel('notifications-bell-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, (payload) => {
        fetchNotifications();
        
        const newNotification = payload.new as any;
        const isForMe = newNotification.recipient_type === 'all' || 
          (newNotification.recipients && newNotification.recipients.includes(adminProfile.id));
        const isFromMe = newNotification.sender_id === adminProfile.id;
        
        if (isForMe && !isFromMe) {
          console.log('Playing notification sound for:', newNotification.title);
          playSound();
          
          // Show browser push notification via the hook
          let priorityText = '';
          if (newNotification.priority === 'urgent') priorityText = '🚨 URGENT: ';
          else if (newNotification.priority === 'high') priorityText = '⚠️ ';
          
          showNotification({
            title: `${priorityText}${newNotification.title}`,
            body: newNotification.message,
            tag: `notification-${newNotification.id}`,
            requireInteraction: newNotification.priority === 'urgent' || newNotification.priority === 'high',
            vibrate: [200, 100, 200],
          });
        }
      })
      .subscribe((status) => {
        console.log('Notification bell subscription:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfile?.id, isSupported, permission]);

  const fetchNotifications = async () => {
    if (!adminProfile) return;

    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const myNotifications = (data || []).filter((n: any) =>
        n.recipient_type === 'all' || (n.recipients && n.recipients.includes(adminProfile.id))
      );
      
      const unread = myNotifications.filter((n: any) => 
        !n.is_read_by || !n.is_read_by.includes(adminProfile.id)
      ).length;
      
      setUnreadCount(unread);
      setNotifications(myNotifications as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase.from('admins').select('id, name, email, role').eq('is_active', true);

      if (error) throw error;
      setAdmins((data || []) as Admin[]);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!adminProfile || unreadCount === 0) return;
    
    setMarkingRead(true);
    try {
      // Get all unread notification IDs
      const unreadNotifications = notifications.filter(n => 
        !n.is_read_by || !n.is_read_by.includes(adminProfile.id)
      );
      
      // Update each notification to add current user to is_read_by array
      for (const notification of unreadNotifications) {
        const currentReadBy = notification.is_read_by || [];
        await supabase
          .from('admin_notifications')
          .update({ 
            is_read_by: [...currentReadBy, adminProfile.id] 
          })
          .eq('id', notification.id);
      }
      
      toast({
        title: 'All Marked as Read',
        description: `${unreadNotifications.length} notifications marked as read`,
      });
      
      fetchNotifications();
    } catch (error: any) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    } finally {
      setMarkingRead(false);
    }
  };

  const sendNotification = async () => {
    if (!adminProfile || !formData.title || !formData.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('admin_notifications').insert({
        title: formData.title,
        message: formData.message,
        sender_id: adminProfile.id,
        recipient_type: formData.recipientType,
        recipients: formData.recipientType === 'selected' ? selectedAdmins : [],
        priority: formData.priority,
      });

      if (error) throw error;

      toast({
        title: 'Notification Sent',
        description: `Sent to ${formData.recipientType === 'all' ? 'all admins' : `${selectedAdmins.length} selected admins`}`,
      });

      setShowSendDialog(false);
      setFormData({ title: '', message: '', recipientType: 'all', priority: 'normal' });
      setSelectedAdmins([]);
      fetchNotifications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'normal':
        return <Info className="h-4 w-4 text-gray-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityRowClass = (priority: string, isRead: boolean) => {
    const opacityClass = isRead ? 'opacity-60' : '';
    switch (priority) {
      case 'urgent':
        return `border-l-red-500 bg-red-500/5 ${opacityClass}`;
      case 'high':
        return `border-l-blue-500 bg-blue-500/5 ${opacityClass}`;
      case 'normal':
        return `border-l-gray-500 bg-gray-500/5 ${opacityClass}`;
      default:
        return `border-l-gray-700 bg-gray-800/20 ${opacityClass}`;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Send Notification Button - Super Admin Only */}
      {adminProfile?.role === 'super_admin' && (
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Send className="h-5 w-5" />
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-gray-900 border-gray-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Send Notification</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Notification title"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter notification message..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Recipients</Label>
                  <Select value={formData.recipientType} onValueChange={(v) => setFormData({ ...formData, recipientType: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          All Admins
                        </div>
                      </SelectItem>
                      <SelectItem value="selected">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Selected Only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300">Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.recipientType === 'selected' && (
                <div>
                  <Label className="text-gray-300">Select Admins</Label>
                  <ScrollArea className="h-[150px] border border-gray-700 rounded-md p-2 mt-2 bg-gray-800">
                    {admins
                      .filter((a) => a.id !== adminProfile?.id)
                      .map((admin) => (
                        <div key={admin.id} className="flex items-center space-x-2 py-2">
                          <Checkbox
                            checked={selectedAdmins.includes(admin.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAdmins([...selectedAdmins, admin.id]);
                              } else {
                                setSelectedAdmins(selectedAdmins.filter((id) => id !== admin.id));
                              }
                            }}
                          />
                          <span className="text-sm text-white">{admin.name}</span>
                          <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                            {admin.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSendDialog(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Cancel
                </Button>
                <Button onClick={sendNotification} disabled={sending} className="bg-blue-500 hover:bg-blue-600 text-white">
                  {sending ? 'Sending...' : 'Send Notification'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Push Notification Permission Button */}
      {isSupported && permission !== 'granted' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={requestPermission}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
          title="Enable push notifications"
        >
          <BellRing className="h-5 w-5" />
        </Button>
      )}

      {/* Notification Bell */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-gray-800">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0 bg-gray-900 border-gray-800" align="end">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={markAllAsRead}
                  disabled={markingRead}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  {markingRead ? 'Marking...' : 'Mark All Read'}
                </Button>
              )}
              {isSupported && permission !== 'granted' && (
                <Button size="sm" variant="outline" onClick={requestPermission} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Enable Push
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {notifications.map((notification) => {
                  const isRead = notification.is_read_by?.includes(adminProfile?.id || '');
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 transition-colors hover:bg-gray-800/50 ${getPriorityRowClass(notification.priority, isRead)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getPriorityIcon(notification.priority)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white truncate">{notification.title}</p>
                            {!isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-600 mt-2">
                            {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationBell;
