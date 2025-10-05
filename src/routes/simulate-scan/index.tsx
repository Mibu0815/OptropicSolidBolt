import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useAuthStore } from "~/stores/auth";
import { DashboardLayout } from "~/components/Layout/DashboardLayout";
import { QrCode, Camera, Upload, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, RefreshCw, Eye, EyeOff, Copy, Download, Smartphone, Wifi, Shield, Clock, MapPin } from "lucide-react";
import toast from "react-hot-toast";

const mockScanResults = {
  valid: {
    status: "VALID",
    code: "OPT_ABC123XYZ789",
    codeType: "OPTROPIC",
    encryptionLevel: "AES_256",
    timestamp: new Date().toISOString(),
    verificationDetails: {
      keyId: "key_001",
      signature: "valid_signature_hash_abc123",
      isExpired: false,
      isRevoked: false,
      trustScore: 98.5,
    },
    assetInfo: {
      productName: "Premium Widget Pro",
      serialNumber: "SN-2024-001",
      batchNumber: "BATCH-W24-001",
      manufacturingDate: "2024-01-15",
    },
    scanMetadata: {
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      deviceType: "MOBILE",
      location: {
        country: "United States",
        region: "California",
        city: "San Francisco",
      },
    },
  },
  invalid: {
    status: "INVALID",
    code: "INVALID_CODE_123",
    codeType: "UNKNOWN",
    encryptionLevel: null,
    timestamp: new Date().toISOString(),
    error: "Code format is invalid or corrupted",
    verificationDetails: {
      keyId: null,
      signature: null,
      isExpired: false,
      isRevoked: false,
      trustScore: 0,
    },
    scanMetadata: {
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      deviceType: "MOBILE",
      location: {
        country: "United States",
        region: "California",
        city: "San Francisco",
      },
    },
  },
  revoked: {
    status: "REVOKED",
    code: "OPT_REV456DEF012",
    codeType: "OPTROPIC",
    encryptionLevel: "AES_256",
    timestamp: new Date().toISOString(),
    error: "This code has been revoked for security reasons",
    verificationDetails: {
      keyId: "key_002",
      signature: "revoked_signature_hash_def456",
      isExpired: false,
      isRevoked: true,
      trustScore: 0,
      revokedAt: "2024-01-18T10:30:00Z",
      revokedReason: "Security breach detected",
    },
    assetInfo: {
      productName: "Standard Widget",
      serialNumber: "SN-2024-002",
      batchNumber: "BATCH-W24-002",
      manufacturingDate: "2024-01-10",
    },
    scanMetadata: {
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      deviceType: "MOBILE",
      location: {
        country: "United States",
        region: "California",
        city: "San Francisco",
      },
    },
  },
};

function ScanSimulator() {
  const { isAuthenticated } = useAuthStore();
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        toast.success("Image uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        toast.success("Camera started");
      }
    } catch (error) {
      toast.error("Failed to access camera");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      toast.success("Camera stopped");
    }
  };

  const simulateScan = (type: 'valid' | 'invalid' | 'revoked') => {
    setIsScanning(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setScanResult(mockScanResults[type]);
      setIsScanning(false);
      setSelectedSimulation(type);
      
      const statusMessages = {
        valid: "✅ Code verified successfully!",
        invalid: "❌ Invalid code detected",
        revoked: "⚠️ Code has been revoked"
      };
      
      toast(statusMessages[type], {
        icon: type === 'valid' ? '✅' : type === 'invalid' ? '❌' : '⚠️',
      });
    }, 2000);
  };

  const copyToClipboard = () => {
    if (scanResult) {
      navigator.clipboard.writeText(JSON.stringify(scanResult, null, 2));
      toast.success("Copied to clipboard");
    }
  };

  const downloadResult = () => {
    if (scanResult) {
      const blob = new Blob([JSON.stringify(scanResult, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-result-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Result downloaded");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALID': return 'text-green-600 bg-green-100';
      case 'INVALID': return 'text-red-600 bg-red-100';
      case 'REVOKED': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALID': return <CheckCircle className="h-5 w-5" />;
      case 'INVALID': return <XCircle className="h-5 w-5" />;
      case 'REVOKED': return <AlertTriangle className="h-5 w-5" />;
      default: return <QrCode className="h-5 w-5" />;
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
                Scan Simulator
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Test QR/NFC code verification with different scenarios and payloads.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Input Methods */}
            <div className="space-y-6">
              {/* Camera Input */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <Camera className="h-5 w-5 inline mr-2" />
                  Camera Scan
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                    {isCameraActive ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-48 object-cover rounded"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <Camera className="h-12 w-12 mx-auto mb-2" />
                        <p>Camera preview will appear here</p>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!isCameraActive ? (
                      <button
                        onClick={startCamera}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </button>
                    ) : (
                      <button
                        onClick={stopCamera}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Stop Camera
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <Upload className="h-5 w-5 inline mr-2" />
                  Image Upload
                </h3>
                <div className="space-y-4">
                  <div 
                    className="bg-gray-100 rounded-lg p-4 min-h-[200px] flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadedImage ? (
                      <img src={uploadedImage} alt="Uploaded" className="max-h-48 max-w-full object-contain rounded" />
                    ) : (
                      <div className="text-center text-gray-500">
                        <Upload className="h-12 w-12 mx-auto mb-2" />
                        <p>Click to upload an image</p>
                        <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <QrCode className="h-5 w-5 inline mr-2" />
                  Test Scenarios
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => simulateScan('valid')}
                    disabled={isScanning}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isScanning && selectedSimulation === 'valid' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Simulate Valid Code
                  </button>
                  <button
                    onClick={() => simulateScan('invalid')}
                    disabled={isScanning}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {isScanning && selectedSimulation === 'invalid' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Simulate Invalid Code
                  </button>
                  <button
                    onClick={() => simulateScan('revoked')}
                    disabled={isScanning}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {isScanning && selectedSimulation === 'revoked' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Simulate Revoked Code
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Results */}
            <div className="space-y-6">
              {scanResult ? (
                <>
                  {/* Verification Result Summary */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Verification Result</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={copyToClipboard}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </button>
                        <button
                          onClick={downloadResult}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Status */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(scanResult.status)}`}>
                        {getStatusIcon(scanResult.status)}
                        <span className="ml-2">{scanResult.status}</span>
                      </div>

                      {/* Code Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Code</label>
                          <p className="text-sm text-gray-900 font-mono">{scanResult.code}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Type</label>
                          <p className="text-sm text-gray-900">{scanResult.codeType}</p>
                        </div>
                        {scanResult.encryptionLevel && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Encryption</label>
                            <p className="text-sm text-gray-900">{scanResult.encryptionLevel}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-500">Timestamp</label>
                          <p className="text-sm text-gray-900">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(scanResult.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Error Message */}
                      {scanResult.error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-sm text-red-700">{scanResult.error}</p>
                        </div>
                      )}

                      {/* Trust Score */}
                      {scanResult.verificationDetails?.trustScore !== undefined && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Trust Score</label>
                          <div className="flex items-center mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  scanResult.verificationDetails.trustScore > 80 ? 'bg-green-500' :
                                  scanResult.verificationDetails.trustScore > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${scanResult.verificationDetails.trustScore}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-900">
                              {scanResult.verificationDetails.trustScore}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Asset Information */}
                  {scanResult.assetInfo && (
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Product Name</label>
                          <p className="text-sm text-gray-900">{scanResult.assetInfo.productName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Serial Number</label>
                          <p className="text-sm text-gray-900 font-mono">{scanResult.assetInfo.serialNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Batch Number</label>
                          <p className="text-sm text-gray-900 font-mono">{scanResult.assetInfo.batchNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Manufacturing Date</label>
                          <p className="text-sm text-gray-900">{new Date(scanResult.assetInfo.manufacturingDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scan Metadata */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Scan Metadata</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Device Type</label>
                        <p className="text-sm text-gray-900">
                          <Smartphone className="h-3 w-3 inline mr-1" />
                          {scanResult.scanMetadata.deviceType}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">IP Address</label>
                        <p className="text-sm text-gray-900 font-mono">{scanResult.scanMetadata.ipAddress}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p className="text-sm text-gray-900">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {scanResult.scanMetadata.location.city}, {scanResult.scanMetadata.location.region}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">User Agent</label>
                        <p className="text-xs text-gray-900 truncate" title={scanResult.scanMetadata.userAgent}>
                          {scanResult.scanMetadata.userAgent}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Raw JSON Output */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Raw JSON Output</h3>
                      <button
                        onClick={() => setShowRawJson(!showRawJson)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {showRawJson ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {showRawJson ? 'Hide' : 'Show'} JSON
                      </button>
                    </div>
                    {showRawJson && (
                      <pre className="bg-gray-50 rounded-md p-4 text-xs overflow-x-auto">
                        <code>{JSON.stringify(scanResult, null, 2)}</code>
                      </pre>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Scan Results</h3>
                  <p className="text-sm text-gray-500">
                    Upload an image, use the camera, or run a test scenario to see verification results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const Route = createFileRoute("/simulate-scan/")({
  component: ScanSimulator,
});
