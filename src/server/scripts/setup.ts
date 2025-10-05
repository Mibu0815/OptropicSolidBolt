import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { minioClient } from "~/server/minio";

async function setup() {
  try {
    // Ensure MinIO buckets exist
    const buckets = ["optropic-assets", "optropic-exports", "optropic-content"];
    
    for (const bucketName of buckets) {
      const bucketExists = await minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await minioClient.makeBucket(bucketName);
        console.log(`✅ Created MinIO bucket: ${bucketName}`);
      }
    }

    // Create default role archetypes if they don't exist
    const defaultArchetypes = [
      {
        code: "ADMIN",
        defaultLabel: "Administrator",
        description: "Full system access with administrative privileges. Can manage users, system settings, and all tenant configurations."
      },
      {
        code: "MANAGER", 
        defaultLabel: "Manager",
        description: "Oversees operations and makes decisions. Can view reports, manage workflows, and supervise other roles."
      },
      {
        code: "OPERATOR",
        defaultLabel: "Operator", 
        description: "Performs daily operational tasks. Can scan codes, log activities, and access assigned workflows."
      },
      {
        code: "INSPECTOR",
        defaultLabel: "Inspector",
        description: "Conducts inspections and audits. Can verify authenticity, perform compliance checks, and generate reports."
      },
      {
        code: "MAINTAINER",
        defaultLabel: "Maintainer",
        description: "Performs maintenance and repairs. Can log maintenance activities, update asset status, and track service history."
      },
      {
        code: "PUBLIC",
        defaultLabel: "Public User",
        description: "General public access for customers and visitors. Can view product information and provide feedback."
      }
    ];

    for (const archetypeData of defaultArchetypes) {
      const existingArchetype = await db.roleArchetype.findUnique({
        where: { code: archetypeData.code }
      });

      if (!existingArchetype) {
        await db.roleArchetype.create({
          data: archetypeData
        });
        console.log(`✅ Created role archetype: ${archetypeData.code}`);
      }
    }

    // Create industry template packs if they don't exist
    const industryTemplates = [
      {
        name: "SafeEvac",
        useCase: "COMPLIANCE" as const,
        description: "Emergency evacuation and safety management system",
        roles: ["MANAGER", "INSPECTOR", "MAINTAINER", "PUBLIC"],
        actions: {
          "MANAGER": ["VIEW_INFO", "LOG", "INSPECT"],
          "INSPECTOR": ["INSPECT", "LOG", "VIEW_INFO"],
          "MAINTAINER": ["LOG", "VIEW_INFO"],
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
            }
          ],
          dashboards: [
            {
              role: "MANAGER",
              widgets: ["equipment_status", "inspection_schedule", "compliance_metrics"]
            }
          ]
        }
      },
      {
        name: "PharmaChain",
        useCase: "AUTHENTICATION" as const,
        description: "Pharmaceutical supply chain integrity system",
        roles: ["MANAGER", "INSPECTOR", "MAINTAINER"],
        actions: {
          "MANAGER": ["VIEW_INFO", "LOG", "INSPECT", "VERIFY"],
          "INSPECTOR": ["INSPECT", "VERIFY", "LOG", "VIEW_INFO"],
          "MAINTAINER": ["VERIFY", "LOG", "VIEW_INFO"]
        },
        productList: [
          { name: "Insulin Vial", gtin: "4567890123456", batch: "INS2024001", serial: "IV001" },
          { name: "Vaccine Dose", gtin: "5678901234567", batch: "VAC2024001", serial: "VD001" }
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
                { action: "verify_authenticity", roles: ["INSPECTOR", "MAINTAINER"] },
                { action: "check_expiry", roles: ["INSPECTOR", "MAINTAINER"] },
                { action: "log_verification", roles: ["INSPECTOR", "MAINTAINER"] }
              ]
            }
          ],
          dashboards: [
            {
              role: "MANAGER",
              widgets: ["supply_chain_overview", "authenticity_metrics"]
            }
          ]
        }
      },
      {
        name: "SecureAsset",
        useCase: "AUTHENTICATION" as const,
        description: "High-value asset tracking and authentication",
        roles: ["MANAGER", "INSPECTOR", "PUBLIC"],
        actions: {
          "MANAGER": ["VIEW_INFO", "LOG", "INSPECT", "VERIFY"],
          "INSPECTOR": ["INSPECT", "VERIFY", "LOG", "VIEW_INFO"],
          "PUBLIC": ["VIEW_INFO", "VERIFY"]
        },
        productList: [
          { name: "Luxury Watch", gtin: "7890123456789", batch: "LW2024001", serial: "LW001" },
          { name: "Designer Handbag", gtin: "8901234567890", batch: "DH2024001", serial: "DH001" }
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
                { action: "log_verification", roles: ["INSPECTOR"] }
              ]
            }
          ],
          dashboards: [
            {
              role: "MANAGER",
              widgets: ["asset_portfolio", "authenticity_metrics"]
            }
          ]
        }
      }
    ];

    for (const template of industryTemplates) {
      const existingTemplate = await db.tenantConfigPack.findFirst({
        where: { name: template.name }
      });

      if (!existingTemplate) {
        await db.tenantConfigPack.create({
          data: template
        });
        console.log(`✅ Created industry template: ${template.name}`);
      }
    }

    // Create default admin user if it doesn't exist
    const adminEmail = "admin@optropic.com";
    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
      
      // Get the ADMIN archetype
      const adminArchetype = await db.roleArchetype.findUnique({
        where: { code: "ADMIN" }
      });

      const adminUser = await db.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: "System",
          lastName: "Administrator",
          role: "ADMIN", // Keep for backward compatibility
          archetypeId: adminArchetype?.id,
          isActive: true,
        },
      });

      // Create default tenant role mappings for admin (admin is their own tenant)
      if (adminArchetype) {
        await db.tenantRoleMapping.create({
          data: {
            tenantId: adminUser.id,
            archetypeId: adminArchetype.id,
            customLabel: "System Administrator",
            icon: "shield-check",
            color: "#dc2626", // red-600
            isEnabled: true
          }
        });
        console.log("✅ Created admin tenant role mapping");
      }
      
      console.log("✅ Default admin user created with archetype system");
    } else {
      // Update existing admin to use archetype system if not already set
      if (!existingAdmin.archetypeId) {
        const adminArchetype = await db.roleArchetype.findUnique({
          where: { code: "ADMIN" }
        });

        if (adminArchetype) {
          await db.user.update({
            where: { id: existingAdmin.id },
            data: { archetypeId: adminArchetype.id }
          });

          // Create tenant role mapping if it doesn't exist
          const existingMapping = await db.tenantRoleMapping.findUnique({
            where: {
              tenantId_archetypeId: {
                tenantId: existingAdmin.id,
                archetypeId: adminArchetype.id
              }
            }
          });

          if (!existingMapping) {
            await db.tenantRoleMapping.create({
              data: {
                tenantId: existingAdmin.id,
                archetypeId: adminArchetype.id,
                customLabel: "System Administrator", 
                icon: "shield-check",
                color: "#dc2626", // red-600
                isEnabled: true
              }
            });
            console.log("✅ Updated existing admin with archetype system");
          }
        }
      }
    }

    console.log("🚀 Database and storage setup complete");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
