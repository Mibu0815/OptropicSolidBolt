import { useState, useEffect } from "react";
import { useNotificationsStore } from "~/stores/notifications";
import { Link } from "@tanstack/react-router";
import { Bell, X, Check, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Circle as XCircle, Info, Shield, Key, QrCode, FolderOpen, Settings, Clock, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    addNotification 
  } = useNotificationsStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const recentNotifications = notifications.slice(0, 5);

  // Simulate real-time notifications (in real app, this would come from backend)
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldAddNotification = Math.random() < 0.1; // 10% chance every 30 seconds
      
      if (shouldAddNotification) {
        const mockNotifications = [
          {
            title: "New Scan Event",
            message: "Code OPT_XYZ789 was scanned in New York",
            type: "info" as const,
            category: "scan" as const,
          },
          {
            title: "Key Rotation Reminder",
            message: "Encryption key will expire in 7 days",
            type: "warning" as const,
            category: "key_management" as const,
            actionUrl: "/keys",
            actionLabel: "View Keys"
          },
          {
            title: "Security Alert",
            message: "Unusual scanning pattern detected",
            type: "error" as const,
            category: "security" as const,
            actionUrl: "/simulate-scan",
            actionLabel: "Investigate"
          },
        ];
        
        const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
        addNotification(randomNotification);
        
        // Show toast notification
        toast(randomNotification.title, {
          icon: randomNotification.type === 'error' ? '🚨' : 
                randomNotification.type === 'warning' ? '⚠️' : 
                randomNotification.type === 'success' ? '✅' : 'ℹ️',
          duration: 4000,
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [addNotification]);

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'key_management': return <Key className="h-4 w-4" />;
      case 'scan': return <QrCode className="h-4 w-4" />;
      case 'project': return <FolderOpen className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    toast.success("Marked as read", { duration: 2000 });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast.success("All notifications marked as read", { duration: 2000 });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="relative bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          notification.category === 'security' ? 'bg-red-100 text-red-600' :
                          notification.category === 'key_management' ? 'bg-blue-100 text-blue-600' :
                          notification.category === 'scan' ? 'bg-purple-100 text-purple-600' :
                          notification.category === 'project' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getNotificationIcon(notification.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </p>
                                {getNotificationTypeIcon(notification.type)}
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(notification.timestamp).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                                {!notification.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs text-blue-600 hover:text-blue-500"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              {notification.actionUrl && notification.actionLabel && (
                                <div className="mt-2">
                                  <Link
                                    to={notification.actionUrl}
                                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-500"
                                    onClick={() => setIsOpen(false)}
                                  >
                                    {notification.actionLabel}
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 5 && (
              <div className="p-4 border-t border-gray-200">
                <Link
                  to="/notifications"
                  className="block w-full text-center text-sm text-blue-600 hover:text-blue-500"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications ({notifications.length})
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
