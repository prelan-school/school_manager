import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../lesson_plans/domain/lesson_plan.dart';

class AdminCoveragePage extends ConsumerWidget {
  const AdminCoveragePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ecs = ref.watch(schoolEcsProvider);
    final substrandReports = ref.watch(substrandCoverageProvider);
    final teacherSummaries = ref.watch(teacherCoverageProvider);

    final avgCoverage = substrandReports.isEmpty
        ? 0
        : (substrandReports.fold<int>(0, (s, r) => s + r.coveragePercent) / substrandReports.length)
            .round();
    final taughtCount = ecs.lessonPlans.where((lp) => lp.status == LessonStatus.taught).length;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text('Admin Syllabus Coverage & Tracker', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
        const Text(
          'Automatically derived from Schemes Substrands and Lesson Plans marked Taught.',
          style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
        ),
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (ctx, constraints) {
            if (constraints.maxWidth >= 520) {
              return Row(
                children: [
                  Expanded(child: _StatCard(label: 'Overall Coverage', value: '$avgCoverage%')),
                  const SizedBox(width: 12),
                  Expanded(child: _StatCard(label: 'Lesson Plans Taught', value: '$taughtCount / ${ecs.lessonPlans.length}')),
                  const SizedBox(width: 12),
                  Expanded(child: _StatCard(label: 'Substrands', value: '${substrandReports.length}')),
                ],
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _StatCard(label: 'Overall Coverage', value: '$avgCoverage%'),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _StatCard(label: 'Lesson Plans Taught', value: '$taughtCount / ${ecs.lessonPlans.length}')),
                    const SizedBox(width: 10),
                    Expanded(child: _StatCard(label: 'Substrands', value: '${substrandReports.length}')),
                  ],
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Teacher Delivery Rollup', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              const Divider(height: 20),
              ...teacherSummaries.map(
                (t) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(t.teacher.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(width: 12),
                      Flexible(
                        child: Text(
                          'Taught: ${t.taughtPlans}/${t.totalPlans} · Lessons: ${t.totalLessonsDelivered} · Assessments: ${t.assessmentsLogged}',
                          textAlign: TextAlign.end,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Coverage by Substrand', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              const Divider(height: 20),
              ...substrandReports.map(
                (r) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              '${r.substrand.code}: ${r.substrand.title}',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Flexible(
                            flex: 0,
                            child: Text(
                              '${r.coveragePercent}% (${r.deliveredLessons}/${r.targetLessons})',
                              textAlign: TextAlign.end,
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      LinearProgressIndicator(value: r.coveragePercent / 100),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
