import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fields, standards, indicators, evidence } = body;

    if (!fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: "Invalid data format: fields array is required" },
        { status: 400 }
      );
    }

    let importedCount = { fields: 0, standards: 0, indicators: 0, evidence: 0 };

    // Import fields
    for (const field of fields) {
      if (!field.name) continue;
      await db.field.upsert({
        where: { id: field.id || `new-${Date.now()}-${Math.random()}` },
        update: {
          name: field.name,
          description: field.description || null,
          order: field.order || 0,
          icon: field.icon || null,
        },
        create: {
          id: field.id,
          name: field.name,
          description: field.description || null,
          order: field.order || 0,
          icon: field.icon || null,
        },
      });
      importedCount.fields++;
    }

    // Import standards
    if (standards && Array.isArray(standards)) {
      for (const std of standards) {
        if (!std.name || !std.fieldId) continue;
        // Check if the field exists
        const fieldExists = await db.field.findUnique({
          where: { id: std.fieldId },
        });
        if (!fieldExists) continue;
        try {
          await db.standard.upsert({
            where: { id: std.id || `new-${Date.now()}-${Math.random()}` },
            update: {
              name: std.name,
              description: std.description || null,
              order: std.order || 0,
              fieldId: std.fieldId,
            },
            create: {
              id: std.id,
              name: std.name,
              description: std.description || null,
              order: std.order || 0,
              fieldId: std.fieldId,
            },
          });
          importedCount.standards++;
        } catch {
          // Skip if duplicate or invalid
        }
      }
    }

    // Import indicators
    if (indicators && Array.isArray(indicators)) {
      for (const ind of indicators) {
        if (!ind.name || !ind.standardId) continue;
        const stdExists = await db.standard.findUnique({
          where: { id: ind.standardId },
        });
        if (!stdExists) continue;
        try {
          await db.indicator.upsert({
            where: { id: ind.id || `new-${Date.now()}-${Math.random()}` },
            update: {
              name: ind.name,
              description: ind.description || null,
              order: ind.order || 0,
              requiredEvidence: ind.requiredEvidence || 1,
              standardId: ind.standardId,
            },
            create: {
              id: ind.id,
              name: ind.name,
              description: ind.description || null,
              order: ind.order || 0,
              requiredEvidence: ind.requiredEvidence || 1,
              standardId: ind.standardId,
            },
          });
          importedCount.indicators++;
        } catch {
          // Skip if duplicate or invalid
        }
      }
    }

    // Import evidence
    if (evidence && Array.isArray(evidence)) {
      for (const ev of evidence) {
        if (!ev.name || !ev.indicatorId) continue;
        const indExists = await db.indicator.findUnique({
          where: { id: ev.indicatorId },
        });
        if (!indExists) continue;
        try {
          await db.evidence.upsert({
            where: { id: ev.id || `new-${Date.now()}-${Math.random()}` },
            update: {
              name: ev.name,
              link: ev.link || null,
              fileName: ev.fileName || null,
              filePath: ev.filePath || null,
              indicatorId: ev.indicatorId,
            },
            create: {
              id: ev.id,
              name: ev.name,
              link: ev.link || null,
              fileName: ev.fileName || null,
              filePath: ev.filePath || null,
              indicatorId: ev.indicatorId,
            },
          });
          importedCount.evidence++;
        } catch {
          // Skip if duplicate or invalid
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
    });
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}
