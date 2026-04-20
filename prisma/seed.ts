import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.evidence.deleteMany();
  await prisma.indicator.deleteMany();
  await prisma.standard.deleteMany();
  await prisma.field.deleteMany();

  // 1. الإدارة المدرسية (School Administration)
  const field1 = await prisma.field.create({
    data: {
      name: 'الإدارة المدرسية',
      description: 'مجال الإدارة المدرسية يشمل التخطيط والقيادة والمجتمع المدرسي والتطوير المؤسسي وحماية المتعلم',
      order: 1,
      icon: 'Building2',
      standards: {
        create: [
          {
            name: 'التخطيط',
            description: 'التخطيط التشغيلي الشامل والمتابعة',
            order: 1,
            indicators: {
              create: [
                { name: 'تضع المدرسة خطة تشغيلية شاملة وفق أهداف تطويرية محددة', order: 1, requiredEvidence: 4 },
                { name: 'تتابع المدرسة تنفيذ خطتها التشغيلية وتطورها بما يضمن تحقيق أهدافها', order: 2, requiredEvidence: 3 },
              ]
            }
          },
          {
            name: 'قيادة العملية التعليمية',
            description: 'قيادة وتعزيز القيم والسلوك الإيجابي',
            order: 2,
            indicators: {
              create: [
                { name: 'تعزز المدرسة القيم الإسلامية، والهوية الوطنية', order: 1, requiredEvidence: 3 },
                { name: 'تطبق المدرسة قيم مهنة التعليم وأخلاقياتها، وتتابع الالتزام بها', order: 2, requiredEvidence: 3 },
                { name: 'تطبق المدرسة إجراءات محددة لدعم الانضباط المدرسي، وتتابع الالتزام بها', order: 3, requiredEvidence: 3 },
                { name: 'تنفذ المدرسة برامج وأنشطة تربوية داعمة للسلوك الإيجابي لدى المتعلمين، ومنهم ذوو الإعاقة والموهوبين، وتتابعها', order: 4, requiredEvidence: 3 },
                { name: 'تنفذ المدرسة برامج وأنشطة إثرائية: لتطوير مواهب المتعلمين، وتهيئتهم للمستقبل، وتتابعها', order: 5, requiredEvidence: 3 },
              ]
            }
          },
          {
            name: 'المجتمع المدرسي',
            description: 'بناء العلاقات والشراكات المجتمعية',
            order: 3,
            indicators: {
              create: [
                { name: 'تعزز المدرسة بناء علاقات إيجابية، والتعاون في المجتمع المدرسي', order: 1, requiredEvidence: 2 },
                { name: 'تعزز المدرسة مشاركة الأسرة في تعلم أبنائهم، والتحضير لمستقبلهم', order: 2, requiredEvidence: 2 },
                { name: 'تعزز المدرسة الشراكة المجتمعية: لدعم التعلم والتأثير الإيجابي في المجتمع', order: 3, requiredEvidence: 2 },
              ]
            }
          },
          {
            name: 'التطوير المؤسسي',
            description: 'تطوير الكوادر والاستدامة المالية والمهنية',
            order: 4,
            indicators: {
              create: [
                { name: 'توفر المدرسة كادراً تعليميًا مكتملاً ومؤهلاً بما يتسق مع المهام الموكلة', order: 1, requiredEvidence: 2 },
                { name: 'توفر المدرسة كادراً إداريًا مكتملاً ومؤهلاً بما يتسق مع المهام الموكلة', order: 2, requiredEvidence: 2 },
                { name: 'تظهر المدرسة الملاءة والاستدامة المالية', order: 3, requiredEvidence: 2 },
                { name: 'تدعم المدرسة منسوبيها للحصول على الرخصة المهنية، وتتابعها', order: 4, requiredEvidence: 2 },
                { name: 'تدعم المدرسة التطوير المهني لمنسوبيها وفقًا لنتائج التقويم وتحلل احتياجاتهم', order: 5, requiredEvidence: 2 },
                { name: 'تطبق المدرسة التقويم الذاتي المبني على المعايير المعتمدة من الهيئة بشكل مستمر', order: 6, requiredEvidence: 2 },
                { name: 'تنفذ المدرسة خطة التحسين بناءً على نتائج التقويم المدرسي، وتتابعها', order: 7, requiredEvidence: 2 },
              ]
            }
          },
          {
            name: 'حقوق المتعلم وحمايته',
            description: 'حماية حقوق المتعلمين وتوفير مناخ آمن',
            order: 5,
            indicators: {
              create: [
                { name: 'تلتزم المدرسة بالمحافظة على حقوق المتعلمين، وحمايتهم', order: 1, requiredEvidence: 3 },
                { name: 'توفر المدرسة مناخًا آمناً للتعلم والنمو نفسيًا واجتماعياً', order: 2, requiredEvidence: 3 },
              ]
            }
          },
        ]
      }
    }
  });

  // 2. التعليم والتعلم (Teaching and Learning)
  const field2 = await prisma.field.create({
    data: {
      name: 'التعليم والتعلم',
      description: 'مجال التعليم والتعلم يشمل بناء خبرات التعلم وتقويم التعلم',
      order: 2,
      icon: 'GraduationCap',
      standards: {
        create: [
          {
            name: 'بناء خبرات التعلم',
            description: 'توفير فرص التعلم وتنمية المهارات المختلفة',
            order: 1,
            indicators: {
              create: [
                { name: 'توفر المدرسة فرصاً متكافئة للتعلم تلبي احتياجات المتعلمين، ومنهم ذوو الإعاقة والموهوبين', order: 1, requiredEvidence: 3 },
                { name: 'تدعم المدرسة تنفيذ المناهج بما يحقق نواتج التعلم المستهدفة', order: 2, requiredEvidence: 3 },
                { name: 'تنوع المدرسة في استراتيجيات التعليم والتعلم، لتلبية احتياجات المتعلمين ودعم تعلمهم', order: 3, requiredEvidence: 3 },
                { name: 'تفعل المدرسة التقنية الرقمية، لدعم تعلم المتعلمين وتلبية احتياجاتهم', order: 4, requiredEvidence: 2 },
                { name: 'تنفذ المدرسة أنشطة تعلم تطبيقية ترتبط بحياة المتعلمين', order: 5, requiredEvidence: 2 },
                { name: 'تنمي المدرسة المهارات القرائية والعددية الأساسية لدى المتعلمين', order: 6, requiredEvidence: 2 },
                { name: 'تنمي المدرسة مهارات التفكير والبحث والابتكار لدى المتعلمين', order: 7, requiredEvidence: 3 },
                { name: 'تنمي المدرسة المهارات العاطفية والاجتماعية لدى المتعلمين', order: 8, requiredEvidence: 2 },
                { name: 'تعزز المدرسة دافعية المتعلمين للتعلم، والاستمتاع به', order: 9, requiredEvidence: 2 },
              ]
            }
          },
          {
            name: 'تقويم التعلم',
            description: 'أساليب وأدوات التقويم وتوظيف النتائج',
            order: 2,
            indicators: {
              create: [
                { name: 'تطبق المدرسة أساليب وأدوات تقويم متنوعة: للكشف عن مستويات أداء المتعلمين المختلفة', order: 1, requiredEvidence: 3 },
                { name: 'تطبق المدرسة أساليب وأدوات متنوعة: لتقويم نواتج التعلم المستهدفة في مناهج التعليم', order: 2, requiredEvidence: 3 },
                { name: 'تحلل المدرسة نتائج التقويم، وتوظفها في تحسين عمليات التعليم والتعلم والتقويم', order: 3, requiredEvidence: 2 },
                { name: 'تقدم المدرسة التغذية الراجعة للمتعلمين وأولياء أمورهم، وتتابع تقدمهم بشكل مستمر', order: 4, requiredEvidence: 2 },
              ]
            }
          },
        ]
      }
    }
  });

  // 3. نواتج التعلم (Learning Outcomes)
  const field3 = await prisma.field.create({
    data: {
      name: 'نواتج التعلم',
      description: 'مجال نواتج التعلم يشمل التحصيل التعليمي والتطور الشخصي والصحي والاجتماعي',
      order: 3,
      icon: 'Trophy',
      standards: {
        create: [
          {
            name: 'التحصيل التعليمي',
            description: 'نتائج المتعلمين في الاختبارات الوطنية',
            order: 1,
            indicators: {
              create: [
                { name: 'يحقق المتعلمون نتائج مرتفعة في مجال القراءة وفقاً للاختبارات الوطنية', order: 1, requiredEvidence: 2 },
                { name: 'يحقق المتعلمون نتائج مرتفعة في مجال الرياضيات وفقًا للاختبارات الوطنية', order: 2, requiredEvidence: 2 },
                { name: 'يحقق المتعلمون نتائج مرتفعة في مجال العلوم وفقًا للاختبارات الوطنية', order: 3, requiredEvidence: 2 },
                { name: 'يحقق المتعلمون تقدمًا في مجال القراءة قياسًا على مستوى أداء المدرسة السابق في الاختبارات الوطنية', order: 4, requiredEvidence: 2 },
                { name: 'يحقق المتعلمون تقدمًا في مجال الرياضيات قياسًا على مستوى أداء المدرسة السابق في الاختبارات الوطنية', order: 5, requiredEvidence: 2 },
                { name: 'يحقق المتعلمون تقدمًا في مجال العلوم قياسًا على مستوى أداء المدرسة السابق في الاختبارات الوطنية', order: 6, requiredEvidence: 2 },
              ]
            }
          },
          {
            name: 'التطور الشخصي والصحي والاجتماعي',
            description: 'تطور المتعلمين شخصياً واجتماعياً وصحياً',
            order: 2,
            indicators: {
              create: [
                { name: 'يظهر المتعلمون الاعتزاز بالقيم والهوية الوطنية', order: 1, requiredEvidence: 2 },
                { name: 'يظهر المتعلمون اتجاهات إيجابية نحو ذواتهم والآخرين', order: 2, requiredEvidence: 2 },
                { name: 'يظهر المتعلمون التزاما بالممارسات الصحية السليمة', order: 3, requiredEvidence: 2 },
                { name: 'يشارك المتعلمون في أنشطة مجتمعية وأعمال تطوعية', order: 4, requiredEvidence: 2 },
                { name: 'يلتزم المتعلمون بقواعد السلوك والانضباط المدرسي', order: 5, requiredEvidence: 2 },
                { name: 'يظهر المتعلمون الاستقلالية والقدرة على التعلم الذاتي', order: 6, requiredEvidence: 2 },
                { name: 'يظهر المتعلمون اعتزازًا بثقافتهم واحتراماً للتنوع الثقافي في المجتمع', order: 7, requiredEvidence: 2 },
              ]
            }
          },
        ]
      }
    }
  });

  // 4. البيئة المدرسية (School Environment)
  const field4 = await prisma.field.create({
    data: {
      name: 'البيئة المدرسية',
      description: 'مجال البيئة المدرسية يشمل المبنى المدرسي والأمن والسلامة',
      order: 4,
      icon: 'School',
      standards: {
        create: [
          {
            name: 'المبنى المدرسي',
            description: 'مواصفات المبنى والتجهيزات والمرافق',
            order: 1,
            indicators: {
              create: [
                { name: 'توفر المدرسة مبنى تعليمي يستوفي المواصفات والاشتراطات المعتمدة من حيث النوع والخدمات المساندة', order: 1, requiredEvidence: 3 },
                { name: 'تنظيم مبنى المدرسة ملائم لعدد المتعلمين وخصائص المرحلة العمرية، ومنهم ذوو الإعاقة', order: 2, requiredEvidence: 2 },
                { name: 'تتوافر فصول ومعامل ملائمة للعملية التعليمية تلبي احتياجات المتعلمين ومنهم ذوو الإعاقة', order: 3, requiredEvidence: 2 },
                { name: 'تلبي المرافق والتجهيزات والخدمات المساندة احتياجات المتعلمين، ومنهم ذوو الإعاقة', order: 4, requiredEvidence: 2 },
              ]
            }
          },
          {
            name: 'الأمن والسلامة',
            description: 'متطلبات الأمن والسلامة والصيانة والنظافة',
            order: 2,
            indicators: {
              create: [
                { name: 'تتوافر في مبنى المدرسة ومرافقها جميع متطلبات الأمن والسلامة', order: 1, requiredEvidence: 3 },
                { name: 'تتابع المدرسة صيانة المبنى وجميع مرافقه وتجهيزاته بشكل دوري', order: 2, requiredEvidence: 2 },
                { name: 'تتابع المدرسة نظافة المبنى المدرسي وجميع مرافقه بشكل مستمر', order: 3, requiredEvidence: 2 },
              ]
            }
          },
        ]
      }
    }
  });

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@qurtubah.edu.sa' },
    update: {},
    create: {
      name: 'مدير النظام',
      email: 'admin@qurtubah.edu.sa',
      role: 'admin',
    }
  });

  console.log('Seed completed successfully!');
  console.log(`Created 4 fields with standards and indicators`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
