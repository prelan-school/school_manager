import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/ecs/dynamic_field_factory.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../../auth/data/firebase_auth_repository.dart';
import 'diary_dialogs.dart';

class SchoolDiaryPage extends ConsumerWidget {
  const SchoolDiaryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    final role = user?.role ?? PortalRole.admin;
    final ecs = ref.watch(schoolEcsProvider);

    final diaryFields = ecs.dynamicFields
        .where((f) => f.targetEntityType == EntityType.diaryEntry && f.isVisibleTo(role))
        .toList();

    final entries = role == PortalRole.parent
        ? ecs.diaryEntries
            .where((d) => user?.linkedLearnerIds.contains(d.learnerId) ?? false)
            .toList()
        : ecs.diaryEntries;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 12,
          runSpacing: 12,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'School Diary',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                Text(
                  role == PortalRole.parent
                      ? 'Child-scoped homework, dynamic awards, and sign-off.'
                      : 'Loosely coupled diary feed. Add custom ECS fields or entries via dialogs.',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
            if (role != PortalRole.parent)
              Wrap(
                spacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => showAddDiaryFieldDialog(context: context, ref: ref),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add Custom Field'),
                  ),
                  FilledButton.icon(
                    onPressed: () => showDiaryEntryDialog(
                      context: context,
                      ref: ref,
                      role: role,
                      teacherId: user?.teacherId ?? ecs.teachers.first.id,
                    ),
                    icon: const Icon(Icons.edit_note, size: 16),
                    label: const Text('Log Diary Entry'),
                  ),
                ],
              ),
          ],
        ),
        const SizedBox(height: 16),
        ...entries.map((entry) {
          final learner = ecs.learners.where((l) => l.id == entry.learnerId).firstOrNull;
          final teacher = ecs.teachers.where((t) => t.id == entry.teacherId).firstOrNull;
          final classroom = ecs.classrooms.where((c) => c.id == entry.classroomId).firstOrNull;

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
                            '${entry.date} · ${classroom?.name ?? ''} · ${teacher?.name ?? ''}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                          InkWell(
                            onTap: learner == null
                                ? null
                                : () => context.go('/learners/${learner.id}'),
                            child: Text(
                              learner?.name ?? entry.learnerId,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF1D4ED8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (role == PortalRole.parent)
                      FilledButton.tonal(
                        onPressed: () => ref
                            .read(schoolEcsProvider.notifier)
                            .toggleDiaryAcknowledgment(entry.id),
                        child: Text(
                          entry.parentAcknowledged ? 'Acknowledged' : 'Acknowledge',
                        ),
                      )
                    else
                      Text(
                        entry.parentAcknowledged ? 'Parent Signed' : 'Awaiting Sign-off',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: entry.parentAcknowledged
                              ? const Color(0xFF15803D)
                              : const Color(0xFFB45309),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Homework: ${entry.homeworkSummary}',
                  style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
                ),
                if (entry.teacherNote.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    entry.teacherNote,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                  ),
                ],
                DynamicFieldReadout(
                  fields: diaryFields,
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
