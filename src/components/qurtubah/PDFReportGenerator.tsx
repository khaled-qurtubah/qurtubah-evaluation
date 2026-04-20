'use client';

import React from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { domainBarColors, iconMap, statusLabels, priorityLabels } from './constants';
import type { FieldWithDetails, ProgressData } from './types';

// ============ PDF Report Generator Component ============
export function PDFReportGenerator({
  fields,
  overallProgress,
}: {
  fields: FieldWithDetails[];
  overallProgress: ProgressData | null;
}) {
  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalStandards = fields.reduce((sum, f) => sum + f.standardsCount, 0);
    const totalIndicators = fields.reduce((sum, f) => sum + f.indicatorsCount, 0);
    const totalRequired = fields.reduce((sum, f) => sum + f.totalRequired, 0);
    const totalUploaded = fields.reduce((sum, f) => sum + f.totalUploaded, 0);
    const completedIndicators = fields.reduce((sum, f) => sum + f.completedIndicators, 0);
    const overallProg = totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0;

    // Evidence stats
    const allEv = fields.flatMap((f) => f.standards.flatMap((s) => s.indicators.flatMap((ind) => ind.evidences)));
    const draftCount = allEv.filter((e) => e.status === 'draft').length;
    const submittedCount = allEv.filter((e) => e.status === 'submitted').length;
    const approvedCount = allEv.filter((e) => e.status === 'approved').length;
    const withComments = allEv.filter((e) => e.comments && e.comments.trim().length > 0).length;

    // Domain rows
    const domainRows = fields.map((f, idx) => {
      const color = domainBarColors[idx % 4];
      return `
        <tr>
          <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-left:8px;"></span>
            ${f.name}
          </td>
          <td style="padding:10px;border:1px solid #e2e8f0;text-align:center;">${f.standardsCount}</td>
          <td style="padding:10px;border:1px solid #e2e8f0;text-align:center;">${f.indicatorsCount}</td>
          <td style="padding:10px;border:1px solid #e2e8f0;text-align:center;">${f.completedIndicators}</td>
          <td style="padding:10px;border:1px solid #e2e8f0;text-align:center;">${f.totalUploaded} / ${f.totalRequired}</td>
          <td style="padding:10px;border:1px solid #e2e8f0;text-align:center;">
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="flex:1;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${f.progress}%;background:${color};border-radius:4px;"></div>
              </div>
              <strong style="color:${f.progress >= 80 ? '#10b981' : f.progress >= 50 ? '#f59e0b' : '#0ea5e9'}">${f.progress}%</strong>
            </div>
          </td>
        </tr>`;
    }).join('');

    // Standard detail rows
    const standardRows = fields.flatMap((f) =>
      f.standards.map((s) => {
        const sIndicators = s.indicators;
        const sRequired = sIndicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
        const sUploaded = sIndicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
        const sCompleted = sIndicators.filter((ind) => ind.evidences.length >= ind.requiredEvidence).length;
        const sProgress = sRequired > 0 ? Math.round((sUploaded / sRequired) * 100) : 0;
        return `
          <tr>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;">${s.name}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${f.name}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${sIndicators.length}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${sCompleted}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${sUploaded} / ${sRequired}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;font-weight:bold;color:${sProgress >= 80 ? '#10b981' : sProgress >= 50 ? '#f59e0b' : '#0ea5e9'}">${sProgress}%</td>
          </tr>`;
      })
    ).join('');

    // Indicator detail rows
    const indicatorRows = fields.flatMap((f) =>
      f.standards.flatMap((s) =>
        s.indicators.map((ind) => {
          const isComplete = ind.evidences.length >= ind.requiredEvidence;
          const evList = ind.evidences.map((ev) => {
            const stLabel = statusLabels[ev.status] || 'مسودة';
            const prLabel = priorityLabels[ev.priority] || 'متوسط';
            return `${ev.name} (${stLabel} - ${prLabel})`;
          }).join('، ');
          return `
            <tr>
              <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;">${ind.name}</td>
              <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${s.name}</td>
              <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${ind.requiredEvidence}</td>
              <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${ind.evidences.length}</td>
              <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${isComplete ? '✅ مكتمل' : '⏳ قيد التنفيذ'}</td>
              <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;">${evList || '—'}</td>
            </tr>`;
        })
      )
    ).join('');

    // Evidence summary rows
    const evidenceRows = allEv.slice(0, 100).map((ev) => {
      const indName = ev.indicator?.name || '';
      return `
        <tr>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;">${ev.name}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${statusLabels[ev.status] || 'مسودة'}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${priorityLabels[ev.priority] || 'متوسط'}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;">${indName}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;">${ev.comments || '—'}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${ev.link ? '<a href="' + ev.link + '" style="color:#0ea5e9;">رابط</a>' : ev.fileName || '—'}</td>
        </tr>`;
    }).join('');

    const reportDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير تقويم التعليم - مدارس قرطبة</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; padding: 30px; color: #1e293b; line-height: 1.6; }
          h1 { color: #0c4a6e; border-bottom: 3px solid #0ea5e9; padding-bottom: 10px; font-size: 28px; }
          h2 { color: #0369a1; margin-top: 30px; font-size: 20px; border-bottom: 1px solid #bae6fd; padding-bottom: 6px; }
          h3 { color: #0c4a6e; margin-top: 20px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th { background: #f0f9ff; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #0c4a6e; font-size: 12px; }
          .header { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
          .header img { height: 70px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat-box { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 12px; padding: 18px; text-align: center; border: 1px solid #bae6fd; }
          .stat-box .value { font-size: 32px; font-weight: 800; color: #0284c7; }
          .stat-box .label { font-size: 12px; color: #64748b; margin-top: 4px; }
          .progress-bar { height: 24px; background: #e2e8f0; border-radius: 12px; overflow: hidden; margin: 15px 0; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #0ea5e9, #0284c7); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 15px 0; }
          .summary-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
          .summary-item .count { font-size: 24px; font-weight: 800; }
          .summary-item .lbl { font-size: 11px; color: #64748b; }
          .section-divider { border: none; border-top: 2px dashed #e2e8f0; margin: 30px 0; }
          .signature-section { margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
          .signature-line { display: inline-block; width: 200px; border-bottom: 1px solid #1e293b; margin-top: 40px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
          .badge-draft { background: #f1f5f9; color: #475569; }
          .badge-submitted { background: #fef3c7; color: #92400e; }
          .badge-approved { background: #d1fae5; color: #065f46; }
          .toc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .toc h3 { margin-top: 0; color: #0369a1; }
          .toc ul { list-style: none; padding: 0; margin: 0; }
          .toc li { padding: 6px 0; border-bottom: 1px dotted #e2e8f0; font-size: 13px; }
          .toc li:last-child { border-bottom: none; }
          .toc li span { color: #0ea5e9; margin-left: 8px; }
          .info-box { background: #f0f9ff; border-right: 4px solid #0ea5e9; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 15px 0; font-size: 13px; }
          @page { margin: 1.5cm; size: A4; }
          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
            h2 { page-break-before: auto; }
            table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <img src="/logo.png" alt="شعار مدارس قرطبة" onerror="this.style.display='none'" />
          <div>
            <h1 style="margin:0;border:none;padding:0;font-size:28px;">تقرير تقويم التعليم الشامل</h1>
            <p style="color:#64748b;margin:6px 0;font-size:14px;">مدارس قرطبة الأهلية – مجمع أبحر</p>
            <p style="color:#d97706;font-size:12px;font-weight:600;">معايير هيئة تقويم التعليم 2026</p>
            <p style="color:#94a3b8;font-size:11px;margin-top:4px;">تاريخ التقرير: ${reportDate}</p>
          </div>
        </div>

        <!-- Table of Contents -->
        <div class="toc">
          <h3>📑 محتويات التقرير</h3>
          <ul>
            <li><span>1.</span> ملخص التقدم العام</li>
            <li><span>2.</span> توزيع حالات الشواهد والأولويات</li>
            <li><span>3.</span> تقدم المجالات</li>
            <li><span>4.</span> تفاصيل المعايير</li>
            <li><span>5.</span> تفاصيل المؤشرات وحالة الإكمال</li>
            <li><span>6.</span> سجل الشواهد</li>
            <li><span>7.</span> التوقيع والاعتماد</li>
          </ul>
        </div>

        <!-- 1. Overall Summary -->
        <h2>1. ملخص التقدم العام</h2>
        <div class="stats">
          <div class="stat-box">
            <div class="value">${overallProg}%</div>
            <div class="label">نسبة الإنجاز الكلي</div>
          </div>
          <div class="stat-box">
            <div class="value">${completedIndicators}</div>
            <div class="label">مؤشرات مكتملة من ${totalIndicators}</div>
          </div>
          <div class="stat-box">
            <div class="value">${totalUploaded}</div>
            <div class="label">شواهد مرفوعة من ${totalRequired}</div>
          </div>
          <div class="stat-box">
            <div class="value">${fields.length}</div>
            <div class="label">مجالات تقويم</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${overallProg}%">${overallProg}%</div>
        </div>
        <div class="info-box">
          <strong>📊 ملخص:</strong> تم رفع ${totalUploaded} شاهد من أصل ${totalRequired} مطلوب، مما يعني أن ${totalRequired - totalUploaded} شاهد لا يزال مطلوباً لإكمال التقويم بالكامل.
        </div>

        <!-- 2. Evidence Status Distribution -->
        <h2>2. توزيع حالات الشواهد والأولويات</h2>
        <div class="summary-grid">
          <div class="summary-item"><div class="count" style="color:#94a3b8">${draftCount}</div><div class="lbl">مسودة</div></div>
          <div class="summary-item"><div class="count" style="color:#f59e0b">${submittedCount}</div><div class="lbl">مقدّم</div></div>
          <div class="summary-item"><div class="count" style="color:#10b981">${approvedCount}</div><div class="lbl">معتمد</div></div>
        </div>
        <p style="font-size:12px;color:#64748b;">عدد الشواهد ذات التعليقات: ${withComments} من ${allEv.length}</p>

        <!-- 3. Domain Progress -->
        <h2>3. تقدم المجالات</h2>
        <table>
          <thead>
            <tr>
              <th>المجال</th>
              <th>المعايير</th>
              <th>المؤشرات</th>
              <th>مكتملة</th>
              <th>الشواهد</th>
              <th>النسبة</th>
            </tr>
          </thead>
          <tbody>${domainRows}</tbody>
        </table>

        <hr class="section-divider" />

        <!-- 4. Standards Detail -->
        <h2>4. تفاصيل المعايير</h2>
        <table>
          <thead>
            <tr>
              <th>المعيار</th>
              <th>المجال</th>
              <th>المؤشرات</th>
              <th>مكتملة</th>
              <th>الشواهد</th>
              <th>النسبة</th>
            </tr>
          </thead>
          <tbody>${standardRows}</tbody>
        </table>

        <hr class="section-divider" />

        <!-- 5. Indicators Detail -->
        <h2>5. تفاصيل المؤشرات وحالة الإكمال</h2>
        <table>
          <thead>
            <tr>
              <th>المؤشر</th>
              <th>المعيار</th>
              <th>المطلوب</th>
              <th>المرفوع</th>
              <th>الحالة</th>
              <th>الشواهد</th>
            </tr>
          </thead>
          <tbody>${indicatorRows}</tbody>
        </table>

        <hr class="section-divider" />

        <!-- 6. Evidence Registry -->
        <h2>6. سجل الشواهد</h2>
        <table>
          <thead>
            <tr>
              <th>اسم الشاهد</th>
              <th>الحالة</th>
              <th>الأهمية</th>
              <th>المؤشر</th>
              <th>التعليقات</th>
              <th>المرفق</th>
            </tr>
          </thead>
          <tbody>${evidenceRows}</tbody>
        </table>
        ${allEv.length > 100 ? '<p style="font-size:11px;color:#94a3b8;margin-top:8px;">* يتم عرض أول 100 شاهد فقط في التقرير</p>' : ''}

        <!-- 7. Signature -->
        <div class="signature-section">
          <h3>7. توقيع واعتماد التقرير</h3>
          <p style="color:#64748b;font-size:13px;">التاريخ: ${reportDate}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px;">
            <div>
              <p style="color:#64748b;font-size:12px;">المسمى الوظيفي: ............................</p>
              <p style="color:#64748b;font-size:12px;">الاسم: ............................</p>
              <p style="margin-top:30px;color:#64748b;font-size:12px;">التوقيع: <span class="signature-line"></span></p>
            </div>
            <div>
              <p style="color:#64748b;font-size:12px;">المسمى الوظيفي: ............................</p>
              <p style="color:#64748b;font-size:12px;">الاسم: ............................</p>
              <p style="margin-top:30px;color:#64748b;font-size:12px;">التوقيع: <span class="signature-line"></span></p>
            </div>
          </div>
        </div>

        <div style="margin-top:40px;padding-top:15px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:11px;">
          نظام تقويم التعليم © ${new Date().getFullYear()} مدارس قرطبة الأهلية – تم إنشاء هذا التقرير تلقائياً
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 btn-press"
      onClick={generatePDF}
    >
      <FileDown className="h-4 w-4" />
      إنشاء تقرير PDF
    </Button>
  );
}
