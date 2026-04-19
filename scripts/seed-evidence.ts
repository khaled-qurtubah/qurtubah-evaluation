// Seed script to add sample evidence data
// Run with: bun run scripts/seed-evidence.ts

const BASE_URL = 'http://localhost:3000';

interface Indicator {
  id: string;
  name: string;
  standardId: string;
  requiredEvidence: number;
  evidences: { id: string }[];
}

interface Standard {
  id: string;
  name: string;
  fieldId: string;
  indicators: Indicator[];
}

interface Field {
  id: string;
  name: string;
  order: number;
  standards: Standard[];
}

// Sample evidence names organized by domain
const evidenceByDomain: Record<string, string[]> = {
  '1': [ // الإدارة المدرسية
    'خطة تشغيلية معتمدة للعام الدراسي 2026',
    'محضر اجتماع مجلس إدارة المدرسة',
    'تقرير متابعة تنفيذ الخطة التشغيلية',
    'وثيقة القيم الإسلامية والهوية الوطنية',
    'دليل إجراءات الانضباط المدرسي',
    'برنامج الأنشطة التربوية والسلوك الإيجابي',
    'تقرير الشراكة المجتمعية',
    'سجل التطوير المهني للمعلمين',
    'تقرير التقويم الذاتي المبني على المعايير',
    'خطة التحسين المدرسي',
    'وثيقة حقوق المتعلم وحمايته',
    'تقرير المناخ المدرسي الآمن',
  ],
  '2': [ // التعليم والتعلم
    'خطة تلبية احتياجات المتعلمين المتنوعة',
    'دليل تنفيذ المناهج لتحقيق نواتج التعلم',
    'نماذج استراتيجيات التعليم المتنوعة',
    'تقرير توظيف التقنية الرقمية في التعليم',
    'سجل الأنشطة التطبيقية المتربطة بالحياة',
    'برنامج تنمية المهارات القرائية والعددية',
    'تقرير مهارات التفكير والبحث والابتكار',
    'أدوات تقويم متنوعة لمستويات الأداء',
    'تقرير توظيف نتائج التقويم في التحسين',
    'نماذج التغذية الراجعة للمتعلمين',
    'برنامج تعزيز دافعية التعلم',
    'سجل الأنشطة الإثرائية والموهوبين',
  ],
  '3': [ // نواتج التعلم
    'تقرير نتائج اختبارات القراءة الوطنية',
    'تقرير نتائج اختبارات الرياضيات الوطنية',
    'تقرير نتائج اختبارات العلوم الوطنية',
    'تحليل تقدم القراءة مقارنة بالأداء السابق',
    'تحليل تقدم الرياضيات مقارنة بالأداء السابق',
    'شهادات المشاركة المجتمعية والتطوعية',
    'تقرير الممارسات الصحية للمتعلمين',
    'سجل التزام المتعلمين بقواعد السلوك',
    'نماذج أعمال المتعلمين التعليمية المستقلة',
    'تقرير الأنشطة الثقافية والتنوع',
  ],
  '4': [ // البيئة المدرسية
    'تقرير مطابقة المبنى للمواصفات المعتمدة',
    'خطة تنظيم المبنى الملائم للمرحلة العمرية',
    'سجل تجهيز المعامل والفصول',
    'تقرير المرافق والخدمات المساندة',
    'شهادة متطلبات الأمن والسلامة',
    'جدول صيانة المبنى الدورية',
    'سجل متابعة النظافة المستمرة',
    'تقرير إمكانية الوصول لذوي الإعاقة',
  ],
};

async function seedEvidence() {
  console.log('🌱 Starting evidence seeding...');

  // Fetch all fields with their data
  const fieldsRes = await fetch(`${BASE_URL}/api/fields`);
  if (!fieldsRes.ok) {
    console.error('Failed to fetch fields');
    process.exit(1);
  }
  const fields: Field[] = await fieldsRes.json();

  // Fetch all indicators
  const indicatorsRes = await fetch(`${BASE_URL}/api/indicators`);
  if (!indicatorsRes.ok) {
    console.error('Failed to fetch indicators');
    process.exit(1);
  }
  const indicators: Indicator[] = await indicatorsRes.json();

  // Map indicators by field order
  const indicatorsByFieldOrder: Record<string, Indicator[]> = {};
  for (const field of fields) {
    const fieldIndicators: Indicator[] = [];
    for (const standard of field.standards) {
      for (const indicator of standard.indicators) {
        // Get full indicator with evidences
        const fullInd = indicators.find(i => i.id === indicator.id);
        if (fullInd) {
          fieldIndicators.push(fullInd);
        }
      }
    }
    indicatorsByFieldOrder[String(field.order)] = fieldIndicators;
  }

  let addedCount = 0;

  // Add evidence to each domain
  for (const [fieldOrder, evidenceNames] of Object.entries(evidenceByDomain)) {
    const domainIndicators = indicatorsByFieldOrder[fieldOrder] || [];
    if (domainIndicators.length === 0) {
      console.log(`⚠️ No indicators found for field order ${fieldOrder}`);
      continue;
    }

    let evidenceIdx = 0;
    for (const evidenceName of evidenceNames) {
      // Find an indicator that still needs evidence
      const targetIndicator = domainIndicators.find(
        ind => ind.evidences.length < ind.requiredEvidence
      );

      if (!targetIndicator) {
        console.log(`✅ All indicators in field ${fieldOrder} are complete`);
        break;
      }

      try {
        const res = await fetch(`${BASE_URL}/api/evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: evidenceName,
            link: `https://example.com/evidence/${fieldOrder}-${evidenceIdx + 1}`,
            indicatorId: targetIndicator.id,
          }),
        });

        if (res.ok) {
          addedCount++;
          // Update local tracking
          targetIndicator.evidences.push({ id: `new-${addedCount}` });
          console.log(`  ✓ Added: "${evidenceName}" → indicator "${targetIndicator.name.substring(0, 50)}..."`);
        } else {
          const errData = await res.json();
          console.error(`  ✗ Failed to add "${evidenceName}": ${errData.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(`  ✗ Error adding "${evidenceName}":`, err);
      }

      evidenceIdx++;
    }
  }

  console.log(`\n🎉 Seeding complete! Added ${addedCount} evidence items.`);
}

seedEvidence()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
