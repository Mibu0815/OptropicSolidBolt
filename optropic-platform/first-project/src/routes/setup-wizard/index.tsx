import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "~/stores/auth";
import { useWizardStore, type UseCase, type UserRoleType, type ActionType, type ProductItem } from "~/stores/wizard";
import { DashboardLayout } from "~/components/Layout/DashboardLayout";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, CircleCheck as CheckCircle, Circle, Sparkles, Zap, Shield, QrCode, Key, Package, FileText, Brain, MessageSquare, Lightbulb, Users, Settings, Upload, Plus, Trash2, Heart, Wrench } from "lucide-react";

export const Route = createFileRoute("/setup-wizard/")({
  component: SetupWizard,
});

const wizardSteps = [
  { id: 1, name: "Welcome", icon: Heart, description: "Introduction to Optropic" },
  { id: 2, name: "Use Case", icon: FileText, description: "Select your primary goal" },
  { id: 3, name: "Roles", icon: Users, description: "Choose user roles" },
  { id: 4, name: "Actions", icon: Settings, description: "Define role permissions" },
  { id: 5, name: "Products", icon: Package, description: "Add product information" },
  { id: 6, name: "Generate", icon: Zap, description: "Create configuration" },
];

function SetupWizard() {
  const { isAuthenticated, token } = useAuthStore();
  const { 
    currentStep, 
    wizardData, 
    setCurrentStep, 
    updateWizardData, 
    nextStep, 
    previousStep, 
    resetWizard 
  } = useWizardStore();
  
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      type: "ai",
      content: "👋 Hi! I'm your AI assistant. I'll help you set up your Optropic pilot project step by step. Let's create something amazing together!",
      timestamp: new Date(),
    }
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [configName, setConfigName] = useState("");
  const [generatedConfig, setGeneratedConfig] = useState<any>(null);

  const trpc = useTRPC();
  const generateConfigMutation = useMutation(trpc.generateConfigPack.mutationOptions({
    onSuccess: (data) => {
      setGeneratedConfig(data);
      toast.success("Configuration pack generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate configuration pack");
    },
  }));

  if (!isAuthenticated || !token) {
    return <Navigate to="/" />;
  }

  const useCaseOptions: { value: UseCase; name: string; description: string; icon: any; recommended?: boolean }[] = [
    { 
      value: "AUTHENTICATION", 
      name: "Authentication", 
      description: "Verify product authenticity and prevent counterfeiting",
      icon: Shield,
      recommended: true
    },
    { 
      value: "MAINTENANCE", 
      name: "Maintenance", 
      description: "Track maintenance schedules and service history",
      icon: Wrench
    },
    { 
      value: "COMPLIANCE", 
      name: "Compliance", 
      description: "Ensure regulatory compliance and audit trails",
      icon: FileText
    },
    { 
      value: "ENGAGEMENT", 
      name: "Engagement", 
      description: "Engage customers with interactive experiences",
      icon: Heart
    },
  ];

  const roleOptions: { value: UserRoleType; name: string; description: string }[] = [
    { value: "INSTALLER", name: "Installer", description: "Installs and sets up equipment" },
    { value: "INSPECTOR", name: "Inspector", description: "Conducts inspections and audits" },
    { value: "MAINTAINER", name: "Maintainer", description: "Performs maintenance and repairs" },
    { value: "MANAGER", name: "Manager", description: "Oversees operations and makes decisions" },
    { value: "PUBLIC", name: "Public", description: "General public access (customers, visitors)" },
  ];

  const actionOptions: { value: ActionType; name: string; description: string }[] = [
    { value: "VERIFY", name: "Verify", description: "Authenticate and validate items" },
    { value: "LOG", name: "Log", description: "Record activities and events" },
    { value: "INSPECT", name: "Inspect", description: "Perform detailed inspections" },
    { value: "VIEW_INFO", name: "View Info", description: "Access information and reports" },
  ];

  const sendAIMessage = () => {
    if (!userMessage.trim()) return;

    // Add user message
    const newUserMessage = {
      type: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    // Mock AI response based on current step
    const getAIResponse = () => {
      switch (currentStep) {
        case 1:
          return "Great! Optropic creates secure, traceable digital identities for physical objects. Think of it as giving every product its own unique digital passport. What type of project are you planning?";
        case 2:
          if (wizardData.useCase === "AUTHENTICATION") {
            return "Excellent choice! Authentication is our most popular use case. It's perfect for preventing counterfeiting and ensuring product authenticity. This will work great for pharmaceuticals, luxury goods, or any high-value items.";
          }
          return "Perfect! That's a great use case for Optropic. Each use case comes with pre-configured workflows and security settings optimized for your specific needs.";
        case 3:
          return `Smart role selection! With ${wizardData.selectedRoles.length} roles, you'll have good coverage for your operations. ${wizardData.selectedRoles.includes("PUBLIC") ? "Including public access is great for customer engagement!" : "Consider adding public access if you want customer-facing features."}`;
        case 4:
          return "Those action permissions look well-balanced! The system will automatically create secure workflows based on these role-action combinations. This ensures proper access control and audit trails.";
        case 5:
          return `Perfect! ${wizardData.productList.length > 0 ? `I can see ${wizardData.productList.length} products in your list.` : "You can add products now or import them later."} The system will generate unique secure codes for each product with full traceability.`;
        case 6:
          return "Excellent! Your configuration looks comprehensive. Once generated, you'll have a complete tenant setup that you can deploy immediately. The system includes security keys, workflows, and all necessary components.";
        default:
          return "I'm here to help! What would you like to know about your Optropic setup?";
      }
    };

    const aiResponse = {
      type: "ai",
      content: getAIResponse(),
      timestamp: new Date(),
    };

    setAiMessages(prev => [...prev, newUserMessage, aiResponse]);
    setUserMessage("");
  };

  const handleRoleToggle = (role: UserRoleType) => {
    const currentRoles = wizardData.selectedRoles;
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    updateWizardData({ selectedRoles: newRoles });
  };

  const handleActionToggle = (role: UserRoleType, action: ActionType) => {
    const currentActions = wizardData.roleActions[role] || [];
    const newActions = currentActions.includes(action)
      ? currentActions.filter(a => a !== action)
      : [...currentActions, action];
    
    updateWizardData({
      roleActions: {
        ...wizardData.roleActions,
        [role]: newActions,
      }
    });
  };

  const addProduct = () => {
    updateWizardData({
      productList: [...wizardData.productList, { name: "", gtin: "", batch: "", serial: "" }]
    });
  };

  const updateProduct = (index: number, field: keyof ProductItem, value: string) => {
    const newProductList = [...wizardData.productList];
    newProductList[index] = { ...newProductList[index], [field]: value };
    updateWizardData({ productList: newProductList });
  };

  const removeProduct = (index: number) => {
    const newProductList = wizardData.productList.filter((_, i) => i !== index);
    updateWizardData({ productList: newProductList });
  };

  const parseProductListText = () => {
    if (!wizardData.productListText?.trim()) return;
    
    const lines = wizardData.productListText.split('\n').filter(line => line.trim());
    const products: ProductItem[] = [];
    
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 1) {
        products.push({
          name: parts[0] || "",
          gtin: parts[1] || "",
          batch: parts[2] || "",
          serial: parts[3] || "",
        });
      }
    }
    
    updateWizardData({ productList: [...wizardData.productList, ...products] });
  };

  const generateConfig = async () => {
    if (!configName.trim()) {
      toast.error("Please enter a configuration name");
      return;
    }

    if (!wizardData.useCase) {
      toast.error("Please select a use case");
      return;
    }

    if (wizardData.selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    generateConfigMutation.mutate({
      token: token!,
      name: configName,
      useCase: wizardData.useCase,
      selectedRoles: wizardData.selectedRoles,
      roleActions: wizardData.roleActions,
      productList: wizardData.productList,
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-6">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Optropic</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Transform your physical products with secure digital identities
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">What is Optropic?</h4>
                  <p className="text-gray-600 mb-4">
                    Optropic creates secure, traceable digital identities for physical objects. Every product gets 
                    a unique cryptographic code that connects the physical and digital worlds.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Shield className="h-4 w-4 text-green-500 mr-2" />
                      Military-grade encryption
                    </li>
                    <li className="flex items-center">
                      <QrCode className="h-4 w-4 text-blue-500 mr-2" />
                      Works with existing QR/NFC readers
                    </li>
                    <li className="flex items-center">
                      <Zap className="h-4 w-4 text-purple-500 mr-2" />
                      Deploy in under 10 minutes
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Perfect for</h4>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-white rounded-lg">
                      <Shield className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Product Authentication</div>
                        <div className="text-sm text-gray-500">Prevent counterfeiting</div>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-white rounded-lg">
                      <Wrench className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Asset Maintenance</div>
                        <div className="text-sm text-gray-500">Track service history</div>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-white rounded-lg">
                      <FileText className="h-6 w-6 text-purple-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Compliance</div>
                        <div className="text-sm text-gray-500">Audit trails & reporting</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select Your Use Case</h3>
              <p className="text-gray-600">Choose the primary goal for your Optropic implementation</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {useCaseOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => updateWizardData({ useCase: option.value })}
                  className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    wizardData.useCase === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {option.recommended && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                      AI Recommended
                    </div>
                  )}
                  <div className="flex items-center">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center mr-4 ${
                      wizardData.useCase === option.value ? "bg-blue-500" : "bg-gray-100"
                    }`}>
                      <option.icon className={`h-6 w-6 ${
                        wizardData.useCase === option.value ? "text-white" : "text-gray-600"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{option.name}</h4>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      wizardData.useCase === option.value
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}>
                      {wizardData.useCase === option.value && (
                        <div className="h-full w-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select User Roles</h3>
              <p className="text-gray-600">Choose the roles that will interact with your system</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roleOptions.map((role) => (
                <div
                  key={role.value}
                  onClick={() => handleRoleToggle(role.value)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    wizardData.selectedRoles.includes(role.value)
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded border-2 mr-3 flex items-center justify-center ${
                      wizardData.selectedRoles.includes(role.value)
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}>
                      {wizardData.selectedRoles.includes(role.value) && (
                        <CheckCircle className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{role.name}</h4>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {wizardData.selectedRoles.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    {wizardData.selectedRoles.length} role{wizardData.selectedRoles.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Define Role Actions</h3>
              <p className="text-gray-600">Specify what actions each role can perform</p>
            </div>

            {wizardData.selectedRoles.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Please select roles in the previous step first</p>
              </div>
            ) : (
              <div className="space-y-6">
                {wizardData.selectedRoles.map((role) => (
                  <div key={role} className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      {roleOptions.find(r => r.value === role)?.name} Actions
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {actionOptions.map((action) => (
                        <div
                          key={action.value}
                          onClick={() => handleActionToggle(role, action.value)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all text-center ${
                            wizardData.roleActions[role]?.includes(action.value)
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className={`h-3 w-3 rounded-full mx-auto mb-2 ${
                            wizardData.roleActions[role]?.includes(action.value)
                              ? "bg-orange-500"
                              : "bg-gray-300"
                          }`}></div>
                          <div className="text-sm font-medium text-gray-900">{action.name}</div>
                          <div className="text-xs text-gray-600">{action.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>
              <p className="text-gray-600">Add products that will use Optropic codes</p>
            </div>

            <div className="space-y-6">
              {/* Manual Entry */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Product List</h4>
                  <button
                    onClick={addProduct}
                    className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Product
                  </button>
                </div>

                {wizardData.productList.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No products added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wizardData.productList.map((product, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          placeholder="Product Name"
                          value={product.name || ""}
                          onChange={(e) => updateProduct(index, "name", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <input
                          type="text"
                          placeholder="GTIN"
                          value={product.gtin || ""}
                          onChange={(e) => updateProduct(index, "gtin", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Batch"
                          value={product.batch || ""}
                          onChange={(e) => updateProduct(index, "batch", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Serial"
                          value={product.serial || ""}
                          onChange={(e) => updateProduct(index, "serial", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <button
                          onClick={() => removeProduct(index)}
                          className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bulk Import */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Bulk Import (CSV format)</h4>
                <textarea
                  value={wizardData.productListText || ""}
                  onChange={(e) => updateWizardData({ productListText: e.target.value })}
                  placeholder="Product Name, GTIN, Batch, Serial&#10;Example Product, 1234567890123, BATCH001, SN001&#10;Another Product, 9876543210987, BATCH002, SN002"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={parseProductListText}
                  className="mt-2 inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Import Products
                </button>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Generate Configuration</h3>
              <p className="text-gray-600">Review and generate your tenant configuration pack</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Configuration Name</label>
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="e.g., SafeEvac Pilot Configuration"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Configuration Summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-gray-900">Configuration Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Use Case:</span>
                    <p className="text-gray-900">{wizardData.useCase || "Not selected"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Roles:</span>
                    <p className="text-gray-900">{wizardData.selectedRoles.join(", ") || "None selected"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Products:</span>
                    <p className="text-gray-900">{wizardData.productList.length} products</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Actions Configured:</span>
                    <p className="text-gray-900">
                      {Object.values(wizardData.roleActions).flat().length} total actions
                    </p>
                  </div>
                </div>
              </div>

              {generatedConfig && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-900">Configuration Generated Successfully!</h4>
                  </div>
                  <p className="text-green-800 mb-4">
                    Your tenant configuration pack has been created and stored. 
                    Configuration ID: <code className="bg-green-100 px-2 py-1 rounded">{generatedConfig.id}</code>
                  </p>
                  <div className="bg-white border border-green-200 rounded p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(generatedConfig.config, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {!generatedConfig && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900">What happens next?</h4>
                      <ul className="mt-2 text-sm text-blue-700 space-y-1">
                        <li>• Secure cryptographic keys will be generated automatically</li>
                        <li>• Role-based access controls will be configured</li>
                        <li>• Product workflows will be set up based on your use case</li>
                        <li>• Configuration will be stored securely in the database</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI-Powered Project Setup
            </h1>
            <p className="text-gray-600">
              Let our AI assistant guide you through creating the perfect Optropic configuration
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {wizardSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      step.id < currentStep
                        ? "bg-green-500 text-white"
                        : step.id === currentStep
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {step.id < currentStep ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <step.icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <div className={`text-sm font-medium ${
                        step.id <= currentStep ? "text-gray-900" : "text-gray-500"
                      }`}>
                        {step.name}
                      </div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  {index < wizardSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      step.id < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={previousStep}
                disabled={currentStep === 1}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Previous
              </button>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAIChat(!showAIChat)}
                  className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  AI Assistant
                </button>

                {currentStep === 6 ? (
                  <button 
                    onClick={generateConfig}
                    disabled={generateConfigMutation.isPending || !configName.trim() || !wizardData.useCase}
                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generateConfigMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Generate Config Pack
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Chat Panel */}
          {showAIChat && (
            <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <span className="ml-2 font-medium text-gray-900">AI Assistant</span>
                </div>
                <button
                  onClick={() => setShowAIChat(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                    placeholder="Ask the AI assistant..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={sendAIMessage}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
