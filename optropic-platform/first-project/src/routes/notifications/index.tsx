import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "~/stores/auth";
import { useNotificationsStore, NotificationType, NotificationCategory } from "~/stores/notifications";
import { DashboardLayout } from "~/components/Layout/DashboardLayout";
import { Bell, Search, ListFilter as Filter, Check, CheckCheck, Trash2, Eye, EyeOff, Shield, Key, QrCode, FolderOpen, Settings, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, Circle as XCircle, Clock, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    getNotificationsByCategory,
    addNotification
  } = useNotificationsStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | "ALL">("ALL");
  const [selectedType, setSelectedType] = useState<NotificationType | "ALL">("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // Add some mock notifications on first load
  useEffect(() => {
    if (notifications.length === 0) {
      // Add sample notifications
      addNotification({
        title: "Key Expiring Soon",
        message: "Your Primary Encryption Key will expire in 28 days. Consider rotating it soon.",
        type: "warning",
        category: "key_management",
        actionUrl: "/keys",
        actionLabel: "View Keys"
      });
      
      addNotification({
        title: "Invalid Scan Detected",
        message: "Suspicious scan attempt detected from IP 192.168.1.200. Code: OPT_INVALID_123",
        type: "error",
        category: "security",
        actionUrl: "/simulate-scan",
        actionLabel: "View Details"
      });
      
      addNotification({
        title: "Project Created",
        message: "New project 'Winter Campaign 2024' has been successfully created.",
        type: "success",
        category: "project",
        actionUrl: "/projects",
        actionLabel: "View Project"
      });
      
      addNotification({
        title: "System Maintenance",
        message: "Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST.",
        type: "info",
        category: "system"
      });
      
      addNotification({
        title: "Code Verification Success",
        message: "Code OPT_ABC123XYZ789 was successfully verified by user in San Francisco.",
        type: "success",
        category: "scan"
      });
    }
  }, [notifications.length, addNotification]);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || notification.category === selectedCategory;
    const matchesType = selectedType === "ALL" || notification.type === selectedType;
    const matchesReadStatus = !showUnreadOnly || !notification.isRead;
    
    return matchesSearch && matchesCategory && matchesType && matchesReadStatus;
  });

  const getNotificationIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'security': return <Shield className="h-5 w-5" />;
      case 'key_management': return <Key className="h-5 w-5" />;
      case 'scan': return <QrCode className="h-5 w-5" />;
      case 'project': return <FolderOpen className="h-5 w-5" />;
      case 'system': return <Settings className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case 'security': return 'text-red-600 bg-red-100';
      case 'key_management': return 'text-blue-600 bg-blue-100';
      case 'scan': return 'text-purple-600 bg-purple-100';
      case 'project': return 'text-green-600 bg-green-100';
      case 'system': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    toast.success("Marked as read");
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleRemoveNotification = (id: string) => {
    removeNotification(id);
    toast.success("Notification removed");
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all notifications?")) {
      clearAll();
      toast.success("All notifications cleared");
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                View and manage your notification history.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CheckCheck className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                  Mark All Read
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="-ml-1 mr-2 h-5 w-5 text-red-500" />
                Clear All
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Notifications</dt>
                      <dd className="text-lg font-medium text-gray-900">{notifications.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Eye className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Unread</dt>
                      <dd className="text-lg font-medium text-gray-900">{unreadCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Security Alerts</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {getNotificationsByCategory('security').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Warnings</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {notifications.filter(n => n.type === 'warning').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as NotificationCategory | "ALL")}
                className="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="ALL">All Categories</option>
                <option value="security">Security</option>
                <option value="key_management">Key Management</option>
                <option value="scan">Scan</option>
                <option value="project">Project</option>
                <option value="system">System</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as NotificationType | "ALL")}
                className="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="ALL">All Types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Unread only</span>
              </label>
            </div>
          </div>

          {/* Notifications List */}
          <div className="mt-6 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedCategory !== "ALL" || selectedType !== "ALL" || showUnreadOnly
                    ? "Try adjusting your search or filter criteria."
                    : "You're all caught up! No notifications to show."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getCategoryColor(notification.category)}`}>
                          {getNotificationIcon(notification.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            {getNotificationTypeIcon(notification.type)}
                            {!notification.isRead && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(notification.timestamp).toLocaleString()}
                            <span className="mx-2">•</span>
                            <span className="capitalize">{notification.category.replace('_', ' ')}</span>
                          </div>
                          {notification.actionUrl && notification.actionLabel && (
                            <div className="mt-3">
                              <a
                                href={notification.actionUrl}
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                              >
                                {notification.actionLabel}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead ? (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-gray-400" title="Read">
                            <CheckCircle className="h-4 w-4" />
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveNotification(notification.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                          title="Remove notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const Route = createFileRoute("/notifications/")({
  component: NotificationsPage,
});
