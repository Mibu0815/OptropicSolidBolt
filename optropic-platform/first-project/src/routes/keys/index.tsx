import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "~/stores/auth";
import { DashboardLayout } from "~/components/Layout/DashboardLayout";
import { Key, Plus, Search, Shield, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, RefreshCw, Trash2, Eye, EyeOff, Copy, Wifi, Radio } from "lucide-react";

export const Route = createFileRoute("/keys/")({
  component: KeyManagement,
});

// Mock data for demonstration
const mockKeys = [
  {
    id: 1,
    keyName: "Primary Encryption Key",
    keyType: "ENCRYPTION",
    status: "ACTIVE",
    encryptionLevel: "AES_256",
    createdAt: "2024-01-15",
    expiresAt: "2024-07-15",
    lastRotated: "2024-01-15",
    pairedWith: "NFC_KEY_001",
    usageCount: 1247,
  },
  {
    id: 2,
    keyName: "Digital Signature Key",
    keyType: "SIGNING",
    status: "ACTIVE", 
    encryptionLevel: "RSA_2048",
    createdAt: "2024-01-10",
    expiresAt: "2025-01-10",
    lastRotated: "2024-01-10",
    pairedWith: null,
    usageCount: 892,
  },
  {
    id: 3,
    keyName: "NFC Pairing Key",
    keyType: "NFC_PAIRING",
    status: "EXPIRING",
    encryptionLevel: "AES_128",
    createdAt: "2023-12-01",
    expiresAt: "2024-02-01",
    lastRotated: "2023-12-01",
    pairedWith: "PRIMARY_ENC_001",
    usageCount: 456,
  },
];

function KeyManagement() {
  const { isAuthenticated } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeyType, setSelectedKeyType] = useState("ALL");
  const [showKeyValues, setShowKeyValues] = useState<Record<number, boolean>>({});

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const filteredKeys = mockKeys.filter((key) => {
    const matchesSearch = key.keyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedKeyType === "ALL" || key.keyType === selectedKeyType;
    return matchesSearch && matchesType;
  });

  const toggleKeyVisibility = (keyId: number) => {
    setShowKeyValues(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRING': return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'REVOKED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKeyTypeIcon = (keyType: string) => {
    switch (keyType) {
      case 'ENCRYPTION': return <Shield className="h-5 w-5" />;
      case 'SIGNING': return <CheckCircle className="h-5 w-5" />;
      case 'NFC_PAIRING': return <Wifi className="h-5 w-5" />;
      case 'RFID_PAIRING': return <Radio className="h-5 w-5" />;
      default: return <Key className="h-5 w-5" />;
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
                Key Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage cryptographic keys and security configurations.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Rotate Keys
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Generate Key
              </button>
            </div>
          </div>

          {/* Security Status Cards */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Keys</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {mockKeys.filter(k => k.status === 'ACTIVE').length}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Expiring Soon</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {mockKeys.filter(k => k.status === 'EXPIRING').length}
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
                    <Wifi className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Paired Keys</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {mockKeys.filter(k => k.pairedWith).length}
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
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Next Rotation</dt>
                      <dd className="text-lg font-medium text-gray-900">28 days</dd>
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
                  placeholder="Search keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedKeyType}
                onChange={(e) => setSelectedKeyType(e.target.value)}
                className="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="ALL">All Types</option>
                <option value="ENCRYPTION">Encryption</option>
                <option value="SIGNING">Signing</option>
                <option value="NFC_PAIRING">NFC Pairing</option>
                <option value="RFID_PAIRING">RFID Pairing</option>
              </select>
            </div>
          </div>

          {/* Keys Table */}
          <div className="mt-6 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Security
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
                            {getKeyTypeIcon(key.keyType)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{key.keyName}</div>
                            <div className="text-sm text-gray-500">
                              Created: {new Date(key.createdAt).toLocaleDateString()}
                            </div>
                            {key.pairedWith && (
                              <div className="text-xs text-blue-600">
                                Paired with: {key.pairedWith}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{key.keyType.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">{key.encryptionLevel}</div>
                        <div className="text-xs text-gray-400">
                          {showKeyValues[key.id] ? 'abc123...xyz789' : '••••••••••••••••'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(key.status)}`}>
                          {key.status.toLowerCase()}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(key.expiresAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{key.usageCount.toLocaleString()} uses</div>
                        <div className="text-xs text-gray-500">
                          Last rotated: {new Date(key.lastRotated).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title={showKeyValues[key.id] ? "Hide key" : "Show key"}
                          >
                            {showKeyValues[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy key"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="Rotate key"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            title="Revoke key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredKeys.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mt-6">
              <Key className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No keys found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedKeyType !== "ALL" 
                  ? "Try adjusting your search or filter criteria."
                  : "Generate your first cryptographic key to get started."}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
