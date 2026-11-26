import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../../auth/data/firebase_auth_repository.dart';
import '../domain/lesson_plan.dart';

class LessonPlansPage extends ConsumerWidget {
  const LessonPlansPage({super.key});

  Future<void> _showCreateDialog(BuildContext context, WidgetRef ref, String teacherId) async {
    final state = ref.read(schoolEcsProvider);
    var substrandId = state.substrands.first.id;
    var classroomId = state.classrooms.first.id;
    var slotId = state.timetableSlots.first.id;
    var status = LessonStatus.planned;
    final titleCtrl = TextEditingController();
    final deliveredCtrl = TextEditingController(text: '2');
    final reflectionCtrl = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Schedule Lesson Plan'),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    value: substrandId,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Linked Substrand', border: OutlineInputBorder(), isDense: true),
                    items: state.substrands
                        .map((s) => DropdownMenuItem(value: s.id, child: Text('${s.code} — ${s.title}', overflow: TextOverflow.ellipsis)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => substrandId = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: classroomId,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Classroom', border: OutlineInputBorder(), isDense: true),
                    items: state.classrooms
                        .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name, overflow: TextOverflow.ellipsis)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => classroomId = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: slotId,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Timetable Slot', border: OutlineInputBorder(), isDense: true),
                    items: state.timetableSlots
                        .map((sl) => DropdownMenuItem(value: sl.id, child: Text('${sl.day} P${sl.period} (${sl.room})', overflow: TextOverflow.ellipsis)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => slotId = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(labelText: 'Lesson Focus Title *', border: OutlineInputBorder(), isDense: true),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<LessonStatus>(
                          value: status,
                          isExpanded: true,
                          decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder(), isDense: true),
                          items: LessonStatus.values
                              .map((st) => DropdownMenuItem(value: st, child: Text(st.label, overflow: TextOverflow.ellipsis)))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setState(() => status = v);
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 1,
                        child: TextField(
                          controller: deliveredCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Periods', border: OutlineInputBorder(), isDense: true),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: reflectionCtrl,
                    decoration: const InputDecoration(labelText: 'Teaching Reflection', border: OutlineInputBorder(), isDense: true),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(dialogCtx).pop(), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                if (titleCtrl.text.trim().isEmpty) return;
                final sub = state.substrands.firstWhere((s) => s.id == substrandId);
                await ref.read(schoolEcsProvider.notifier).addLessonPlan(
                      LessonPlanEntity(
                        id: 'lp_${DateTime.now().millisecondsSinceEpoch}',
                        teacherId: teacherId,
                        classroomId: classroomId,
                        subjectId: sub.subjectId,
                        strandId: sub.strandId,
                        substrandId: sub.id,
                        timetableSlotId: slotId,
                        title: titleCtrl.text.trim(),
                        scheduledDate: '2026-11-26',
                        lessonsDelivered: int.tryParse(deliveredCtrl.text) ?? 0,
                        status: status,
                        reflectionNote: reflectionCtrl.text.trim(),
                      ),
                    );
                if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
              },
              child: const Text('Save Lesson Plan'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    final role = user?.role ?? PortalRole.admin;
    final ecs = ref.watch(schoolEcsProvider);
    final canEdit = role == PortalRole.admin || role == PortalRole.teacher;
    final teacherId = user?.teacherId ?? ecs.teachers.first.id;

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
                Text('Lesson Plans & Syllabus Coverage', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                Text(
                  'Marking a plan Taught updates Admin Syllabus Coverage providers automatically.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
            if (canEdit)
              FilledButton.icon(
                onPressed: () => _showCreateDialog(context, ref, teacherId),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Schedule Lesson Plan'),
              ),
          ],
        ),
        const SizedBox(height: 16),
        ...ecs.lessonPlans.map((lp) {
          final subj = ecs.subjects.where((s) => s.id == lp.subjectId).firstOrNull;
          final sub = ecs.substrands.where((s) => s.id == lp.substrandId).firstOrNull;
          final teacher = ecs.teachers.where((t) => t.id == lp.teacherId).firstOrNull;

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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${lp.scheduledDate} · ${subj?.name ?? ''} · ${sub?.code ?? ''} ${sub?.title ?? ''}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                          Text(lp.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Flexible(
                      flex: 0,
                      child: Text(
                        '${lp.status.label} (${lp.lessonsDelivered}/${sub?.targetLessons ?? 1})',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                if (lp.reflectionNote.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(lp.reflectionNote, style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                ],
                const Divider(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Teacher: ${teacher?.name ?? ''}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ),
                    if (canEdit) ...[
                      const SizedBox(width: 8),
                      Flexible(
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          alignment: WrapAlignment.end,
                          children: LessonStatus.values.map((nextStatus) {
                            final active = lp.status == nextStatus;
                            return ChoiceChip(
                              label: Text(nextStatus.label, style: const TextStyle(fontSize: 11)),
                              selected: active,
                              onSelected: (_) {
                                final count = nextStatus == LessonStatus.taught
                                    ? (lp.lessonsDelivered < 2 ? 2 : lp.lessonsDelivered)
                                    : nextStatus == LessonStatus.inProgress
                                        ? (lp.lessonsDelivered < 1 ? 1 : lp.lessonsDelivered)
                                        : 0;
                                ref.read(schoolEcsProvider.notifier).updateLessonPlanStatus(
                                      lp.id,
                                      nextStatus,
                                      count,
                                    );
                              },
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
