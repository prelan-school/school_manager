import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/ecs/dynamic_field_factory.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../../auth/data/firebase_auth_repository.dart';
import 'assessment_entry_dialog.dart';

class AssessmentBooksPage extends ConsumerWidget {
  const AssessmentBooksPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    final role = user?.role ?? PortalRole.admin;
    final ecs = ref.watch(schoolEcsProvider);

    final fields = ecs.dynamicFields
        .where((f) => f.targetEntityType == EntityType.assessmentEntry && f.isVisibleTo(role))
        .toList();

    final entries = role == PortalRole.parent
        ? ecs.assessments
            .where((a) => user?.linkedLearnerIds.contains(a.learnerId) ?? false)
            .toList()
        : ecs.assessments;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 12,
          runSpacing: 12,
          children: [
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Assessment Books',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                Text(
                  'Strands and Substrands are pulled live from Schemes DB by document reference.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
            if (role != PortalRole.parent)
              FilledButton.icon(
                onPressed: () => showAssessmentEntryDialog(
                  context: context,
                  ref: ref,
                  role: role,
                  teacherId: user?.teacherId ?? ecs.teachers.first.id,
                ),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Record Assessment'),
              ),
          ],
        ),
        const SizedBox(height: 16),
        ...entries.map((entry) {
          final learner = ecs.learners.where((l) => l.id == entry.learnerId).firstOrNull;
          final subject = ecs.subjects.where((s) => s.id == entry.subjectId).firstOrNull;
          final strand = ecs.strands.where((st) => st.id == entry.strandId).firstOrNull;
          final substrand = ecs.substrands.where((sb) => sb.id == entry.substrandId).firstOrNull;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${entry.date} · ${subject?.name ?? ''} · ${strand?.code ?? ''} ${strand?.title ?? ''}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 2),
                          InkWell(
                            onTap: learner == null
                                ? null
                                : () => context.go('/learners/${learner.id}'),
                            child: Text(
                              '${learner?.name ?? entry.learnerId} — ${substrand?.code ?? ''} ${substrand?.title ?? ''}',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          entry.mastery.label,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF15803D),
                          ),
                        ),
                        Text(
                          '${entry.scorePercent}%',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  entry.performanceComment,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF334155)),
                ),
                DynamicFieldReadout(
                  fields: fields,
                  values: entry.customFields,
                  role: role,
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
