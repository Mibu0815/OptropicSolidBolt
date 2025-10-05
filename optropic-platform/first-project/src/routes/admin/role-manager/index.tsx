import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth";
import { useTRPC } from "~/trpc/react";
import { DashboardLayout } from "~/components/Layout/DashboardLayout";
import toast from "react-hot-toast";
import { Shield, Users, CreditCard as Edit3, Save, X, Plus, Settings, Eye, EyeOff, Hash } from "lucide-react";

interface RoleArchetype {
  id: number;
  code: string;
  defaultLabel: string;
  description: string;
  isActive: boolean;
}

interface TenantRoleMapping {
  id: number;
  tenantId: number;
  archetypeId: number;
  customLabel?: string;
  icon?: string;
  color?: string;
  isEnabled: boolean;
  archetype: RoleArchetype;
  tenant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface EditingMapping {
  id: number;
  customLabel: string;
  icon: string;
  color: string;
}

function RoleManager() {
  const { isAuthenticated, token, isAdmin } = useAuthStore();
  const [editingMapping, setEditingMapping] = useState<EditingMapping | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  
  const trpc = useTRPC();

  // Fetch role archetypes
  const archetypesQuery = useQuery(
    trpc.getRoleArchetypes.queryOptions({
      token: token!,
      includeInactive: true,
    }, {
      enabled: isAuthenticated && isAdmin(),
    })
  );

  // Fetch tenant role mappings
  const mappingsQuery = useQuery(
    trpc.getTenantRoleMappings.queryOptions({
      token: token!,
      tenantId: selectedTenantId || undefined,
    }, {
      enabled: isAuthenticated && isAdmin(),
    })
  );

  // Update mutation
  const updateMutation = useMutation(trpc.updateTenantRoleMapping.mutationOptions({
    onSuccess: () => {
      toast.success("Role mapping updated successfully");
      setEditingMapping(null);
      mappingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role mapping");
    },
  }));

  // Create mutation
  const createMutation = useMutation(trpc.createTenantRoleMapping.mutationOptions({
    onSuccess: () => {
      toast.success("Role mapping created successfully");
      mappingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create role mapping");
    },
  }));

  // Access control - now after all hooks
  if (!isAuthenticated || !isAdmin()) {
    return <Navigate to="/dashboard" />;
  }

  const archetypes = archetypesQuery.data || [];
  const mappings = mappingsQuery.data || [];

  const handleEdit = (mapping: TenantRoleMapping) => {
    setEditingMapping({
      id: mapping.id,
      customLabel: mapping.customLabel || mapping.archetype.defaultLabel,
      icon: mapping.icon || "user",
      color: mapping.color || "#6b7280",
    });
  };

  const handleSave = () => {
    if (!editingMapping) return;

    updateMutation.mutate({
      token: token!,
      mappingId: editingMapping.id,
      customLabel: editingMapping.customLabel,
      icon: editingMapping.icon,
      color: editingMapping.color,
    });
  };

  const handleCancel = () => {
    setEditingMapping(null);
  };

  const handleToggleEnabled = (mapping: TenantRoleMapping) => {
    updateMutation.mutate({
      token: token!,
      mappingId: mapping.id,
      isEnabled: !mapping.isEnabled,
    });
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      shield: Shield,
      users: Users,
      settings: Settings,
      user: Users,
      eye: Eye,
      hash: Hash,
    };
    return iconMap[iconName] || Users;
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Role Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage role archetypes and customize them for each tenant
              </p>
            </div>
          </div>

          {/* Role Archetypes Overview */}
          <div className="mt-8">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Available Role Archetypes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Universal role types that can be customized per tenant
                </p>
              </div>
              
              {archetypesQuery.isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading archetypes...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {archetypes.map((archetype) => (
                    <div key={archetype.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-lg font-medium text-gray-900">{archetype.defaultLabel}</h4>
                            <p className="text-sm text-gray-500">{archetype.code}</p>
                            <p className="mt-1 text-sm text-gray-600">{archetype.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            archetype.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {archetype.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tenant Role Mappings */}
          <div className="mt-8">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Tenant Role Configurations</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Customize role labels, icons, and colors for specific tenants
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedTenantId || ""}
                      onChange={(e) => setSelectedTenantId(e.target.value ? Number(e.target.value) : null)}
                      className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">All Tenants</option>
                      {/* In a real app, you'd fetch a list of tenants */}
                      <option value="1">System Administrator</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {mappingsQuery.isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading role mappings...</p>
                </div>
              ) : mappings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No role mappings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedTenantId ? 'This tenant has no role configurations.' : 'No tenant role configurations found.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Custom Label
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Icon & Color
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mappings.map((mapping) => (
                        <tr key={mapping.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {mapping.archetype.defaultLabel}
                              </div>
                              <div className="text-sm text-gray-500">{mapping.archetype.code}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {mapping.tenant.firstName} {mapping.tenant.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{mapping.tenant.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingMapping?.id === mapping.id ? (
                              <input
                                type="text"
                                value={editingMapping.customLabel}
                                onChange={(e) => setEditingMapping({
                                  ...editingMapping,
                                  customLabel: e.target.value
                                })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Custom role label"
                              />
                            ) : (
                              <div className="text-sm text-gray-900">
                                {mapping.customLabel || mapping.archetype.defaultLabel}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingMapping?.id === mapping.id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={editingMapping.icon}
                                  onChange={(e) => setEditingMapping({
                                    ...editingMapping,
                                    icon: e.target.value
                                  })}
                                  className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                  <option value="shield">Shield</option>
                                  <option value="users">Users</option>
                                  <option value="settings">Settings</option>
                                  <option value="eye">Eye</option>
                                  <option value="hash">Hash</option>
                                </select>
                                <input
                                  type="color"
                                  value={editingMapping.color}
                                  onChange={(e) => setEditingMapping({
                                    ...editingMapping,
                                    color: e.target.value
                                  })}
                                  className="h-8 w-8 border border-gray-300 rounded cursor-pointer"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div 
                                  className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                                  style={{ backgroundColor: mapping.color || '#6b7280' }}
                                >
                                  {(() => {
                                    const IconComponent = getIconComponent(mapping.icon || 'user');
                                    return <IconComponent className="h-4 w-4 text-white" />;
                                  })()}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {mapping.icon || 'user'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleEnabled(mapping)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                                mapping.isEnabled
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {mapping.isEnabled ? (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Enabled
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Disabled
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {editingMapping?.id === mapping.id ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={handleSave}
                                  disabled={updateMutation.isPending}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(mapping)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const Route = createFileRoute("/admin/role-manager/")({
  component: RoleManager,
});
