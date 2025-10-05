import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { baseProcedure } from "~/server/trpc/main";

export const getTemplates = baseProcedure
  .input(z.object({ 
    token: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const verified = jwt.verify(input.token, env.JWT_SECRET);
      const parsed = z.object({ userId: z.number() }).parse(verified);
      
      const user = await db.user.findUnique({
        where: { id: parsed.userId },
      });

      if (!user || !user.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found or inactive",
        });
      }

      // Fetch template packs from database (marked with isTemplate flag or specific naming)
      const templates = await db.tenantConfigPack.findMany({
        where: {
          OR: [
            { name: { contains: "Template" } },
            { name: { in: ["SafeEvac", "PharmaChain", "SecureAsset"] } }
          ]
        },
        orderBy: {
          name: "asc"
        }
      });

      // If no templates exist in DB, return hardcoded templates
      if (templates.length === 0) {
        return getHardcodedTemplates();
      }

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        useCase: template.useCase,
        description: getTemplateDescription(template.name),
        roles: template.roles,
        actions: template.actions,
        productList: template.productList,
        configJson: template.configJson,
        createdAt: template.createdAt,
      }));
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  });

function getTemplateDescription(name: string): string {
  const descriptions: Record<string, string> = {
    "SafeEvac": "Emergency evacuation and safety management system with real-time tracking and compliance reporting.",
    "PharmaChain": "Pharmaceutical supply chain integrity with anti-counterfeiting and cold chain monitoring.",
    "SecureAsset": "High-value asset tracking and authentication for luxury goods and collectibles.",
  };
  return descriptions[name] || "Industry-specific configuration template";
}

function getHardcodedTemplates() {
  return [
    {
      id: "template-safeevac",
      name: "SafeEvac",
      useCase: "COMPLIANCE",
      description: "Emergency evacuation and safety management system with real-time tracking and compliance reporting.",
      roles: ["MANAGER", "INSPECTOR", "OPERATOR", "PUBLIC"],
      actions: {
        "MANAGER": ["VIEW_INFO", "LOG", "INSPECT"],
        "INSPECTOR": ["INSPECT", "LOG", "VIEW_INFO"],
        "OPERATOR": ["LOG", "VIEW_INFO"],
        "PUBLIC": ["VIEW_INFO"]
      },
      productList: [
        { name: "Emergency Exit Sign", gtin: "1234567890123", batch: "EE001" },
        { name: "Fire Extinguisher", gtin: "2345678901234", batch: "FE001" },
        { name: "Evacuation Chair", gtin: "3456789012345", batch: "EC001" }
      ],
      configJson: {
        metadata: {
          templateName: "SafeEvac",
          industry: "Safety & Emergency Management",
          version: "1.0",
          description: "Complete safety management solution"
        },
        workflows: [
          {
            name: "Emergency Equipment Inspection",
            trigger: "scheduled_inspection",
            steps: [
              { action: "authenticate_inspector", roles: ["INSPECTOR"] },
              { action: "scan_equipment", roles: ["INSPECTOR"] },
              { action: "record_condition", roles: ["INSPECTOR"] },
              { action: "generate_report", roles: ["INSPECTOR", "MANAGER"] }
            ]
          },
          {
            name: "Public Safety Information",
            trigger: "public_scan",
            steps: [
              { action: "display_evacuation_info", roles: ["PUBLIC"] },
              { action: "show_nearest_exits", roles: ["PUBLIC"] },
              { action: "log_interaction", roles: ["PUBLIC"] }
            ]
          }
        ],
        dashboards: [
          {
            role: "MANAGER",
            widgets: ["equipment_status", "inspection_schedule", "compliance_metrics"]
          },
          {
            role: "INSPECTOR", 
            widgets: ["inspection_queue", "equipment_history", "defect_reports"]
          }
        ]
      },
      createdAt: new Date(),
    },
    {
      id: "template-pharmachain",
      name: "PharmaChain", 
      useCase: "AUTHENTICATION",
      description: "Pharmaceutical supply chain integrity with anti-counterfeiting and cold chain monitoring.",
      roles: ["MANAGER", "INSPECTOR", "OPERATOR"],
      actions: {
        "MANAGER": ["VIEW_INFO", "LOG", "INSPECT", "VERIFY"],
        "INSPECTOR": ["INSPECT", "VERIFY", "LOG", "VIEW_INFO"],
        "OPERATOR": ["VERIFY", "LOG", "VIEW_INFO"]
      },
      productList: [
        { name: "Insulin Vial", gtin: "4567890123456", batch: "INS2024001", serial: "IV001" },
        { name: "Vaccine Dose", gtin: "5678901234567", batch: "VAC2024001", serial: "VD001" },
        { name: "Prescription Bottle", gtin: "6789012345678", batch: "RX2024001", serial: "PB001" }
      ],
      configJson: {
        metadata: {
          templateName: "PharmaChain",
          industry: "Pharmaceutical",
          version: "1.0",
          description: "Complete pharmaceutical supply chain solution"
        },
        workflows: [
          {
            name: "Drug Authentication",
            trigger: "product_scan",
            steps: [
              { action: "verify_authenticity", roles: ["INSPECTOR", "OPERATOR"] },
              { action: "check_expiry", roles: ["INSPECTOR", "OPERATOR"] },
              { action: "validate_temperature", roles: ["INSPECTOR"] },
              { action: "log_verification", roles: ["INSPECTOR", "OPERATOR"] }
            ]
          },
          {
            name: "Cold Chain Monitoring",
            trigger: "temperature_alert",
            steps: [
              { action: "alert_manager", roles: ["MANAGER"] },
              { action: "investigate_breach", roles: ["INSPECTOR"] },
              { action: "document_incident", roles: ["INSPECTOR", "MANAGER"] }
            ]
          }
        ],
        dashboards: [
          {
            role: "MANAGER",
            widgets: ["supply_chain_overview", "authenticity_metrics", "cold_chain_status"]
          },
          {
            role: "INSPECTOR",
            widgets: ["verification_queue", "temperature_alerts", "batch_tracking"]
          }
        ]
      },
      createdAt: new Date(),
    },
    {
      id: "template-secureasset",
      name: "SecureAsset",
      useCase: "AUTHENTICATION", 
      description: "High-value asset tracking and authentication for luxury goods and collectibles.",
      roles: ["MANAGER", "INSPECTOR", "PUBLIC"],
      actions: {
        "MANAGER": ["VIEW_INFO", "LOG", "INSPECT", "VERIFY"],
        "INSPECTOR": ["INSPECT", "VERIFY", "LOG", "VIEW_INFO"],
        "PUBLIC": ["VIEW_INFO", "VERIFY"]
      },
      productList: [
        { name: "Luxury Watch", gtin: "7890123456789", batch: "LW2024001", serial: "LW001" },
        { name: "Designer Handbag", gtin: "8901234567890", batch: "DH2024001", serial: "DH001" },
        { name: "Art Piece", gtin: "9012345678901", batch: "AP2024001", serial: "AP001" }
      ],
      configJson: {
        metadata: {
          templateName: "SecureAsset",
          industry: "Luxury Goods",
          version: "1.0", 
          description: "Complete luxury asset authentication solution"
        },
        workflows: [
          {
            name: "Authenticity Verification",
            trigger: "product_scan",
            steps: [
              { action: "verify_authenticity", roles: ["INSPECTOR", "PUBLIC"] },
              { action: "check_provenance", roles: ["INSPECTOR"] },
              { action: "display_certificate", roles: ["INSPECTOR", "PUBLIC"] },
              { action: "log_verification", roles: ["INSPECTOR"] }
            ]
          },
          {
            name: "Ownership Transfer",
            trigger: "ownership_change",
            steps: [
              { action: "authenticate_parties", roles: ["INSPECTOR"] },
              { action: "verify_asset", roles: ["INSPECTOR"] },
              { action: "update_ownership", roles: ["INSPECTOR", "MANAGER"] },
              { action: "issue_certificate", roles: ["MANAGER"] }
            ]
          }
        ],
        dashboards: [
          {
            role: "MANAGER",
            widgets: ["asset_portfolio", "authenticity_metrics", "ownership_transfers"]
          },
          {
            role: "INSPECTOR",
            widgets: ["verification_queue", "provenance_tracking", "certificate_management"]
          },
          {
            role: "PUBLIC",
            widgets: ["authenticity_check", "asset_information", "ownership_history"]
          }
        ]
      },
      createdAt: new Date(),
    }
  ];
}
