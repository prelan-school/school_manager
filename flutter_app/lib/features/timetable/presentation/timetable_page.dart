import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../../auth/data/firebase_auth_repository.dart';
import '../../lesson_plans/domain/lesson_plan.dart';
import '../domain/timetable_slot.dart';

class TimetablePage extends ConsumerStatefulWidget {
  const TimetablePage({super.key});

  @override
  ConsumerState<TimetablePage> createState() => _TimetablePageState();
}

class _TimetablePageState extends ConsumerState<TimetablePage> {
  String _classroomId = 'cls_5a';

  Future<void> _openSlotDialog(TimetableSlotEntity slot, PortalRole role) async {
    final canEdit = role == PortalRole.admin || role == PortalRole.teacher;
    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => Consumer(
        builder: (ctx, modalRef, _) {
          final ecs = modalRef.watch(schoolEcsProvider);
          final subj = ecs.subjects.where((s) => s.id == slot.subjectId).firstOrNull;
          final teacher = ecs.teachers.where((t) => t.id == slot.teacherId).firstOrNull;
          final plan = ecs.lessonPlans.where((lp) => lp.timetableSlotId == slot.id).firstOrNull;
          final sub = plan == null
              ? null
              : ecs.substrands.where((s) => s.id == plan.substrandId).firstOrNull;

          return AlertDialog(
            title: Text('${slot.day} Period ${slot.period} · ${subj?.name ?? ''}'),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${slot.timeRange} · Room ${slot.room} · ${teacher?.name ?? ''}'),
                  const Divider(height: 22),
                  if (plan == null)
                    const Text('No Lesson Plan linked to this period yet.')
                  else ...[
                    Text(
                      'Substrand: ${sub?.code ?? ''} ${sub?.title ?? ''}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 4),
                    Text(plan.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    if (plan.reflectionNote.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(plan.reflectionNote, style: const TextStyle(fontSize: 12)),
                    ],
                    const SizedBox(height: 12),
                    Text('Status: ${plan.status.label} (${plan.lessonsDelivered}/${sub?.targetLessons ?? 1})'),
                    if (canEdit) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        children: LessonStatus.values.map((st) {
                          return ChoiceChip(
                            label: Text(st.label),
                            selected: plan.status == st,
                            onSelected: (_) {
                              final delivered = st == LessonStatus.taught
                                  ? (plan.lessonsDelivered < 2 ? 2 : plan.lessonsDelivered)
                                  : st == LessonStatus.inProgress
                                      ? (plan.lessonsDelivered < 1 ? 1 : plan.lessonsDelivered)
                                      : 0;
                              modalRef
                                  .read(schoolEcsProvider.notifier)
                                  .updateLessonPlanStatus(plan.id, st, delivered);
                            },
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ],
              ),
            ),
            ),
            actions: [
              FilledButton(
                onPressed: () => Navigator.of(dialogCtx).pop(),
                child: const Text('Close'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _openCreateSlotDialog() async {
    final ecs = ref.read(schoolEcsProvider);
    if (ecs.subjects.isEmpty || ecs.teachers.isEmpty) return;

    var classroomId = _classroomId;
    var subjectId = ecs.subjects.first.id;
    var teacherId = ecs.teachers.first.id;
    var day = 'Mon';
    var period = 2;
    final timeCtrl = TextEditingController(text: '09:00 - 09:45');
    final roomCtrl = TextEditingController(text: '5A-101');
    String? error;

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: const Text('Add Timetable Slot'),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<String>(
                    value: classroomId,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Classroom',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: ecs.classrooms
                        .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name, overflow: TextOverflow.ellipsis)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setModalState(() => classroomId = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: day,
                          isExpanded: true,
                          decoration: const InputDecoration(
                            labelText: 'Day',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: const ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
                              .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setModalState(() => day = v);
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          value: period,
                          isExpanded: true,
                          decoration: const InputDecoration(
                            labelText: 'Period',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: const [1, 2, 3, 4, 5, 6]
                              .map((p) => DropdownMenuItem(value: p, child: Text('Period $p')))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setModalState(() => period = v);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: subjectId,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Subject',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: ecs.subjects
                        .map((s) => DropdownMenuItem(value: s.id, child: Text(s.name, overflow: TextOverflow.ellipsis)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setModalState(() => subjectId = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: teacherId,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Teacher',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: ecs.teachers
                        .map((t) => DropdownMenuItem(value: t.id, child: Text(t.name, overflow: TextOverflow.ellipsis)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setModalState(() => teacherId = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: TextField(
                          controller: timeCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Time Range *',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 1,
                        child: TextField(
                          controller: roomCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Room *',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFFECACA)),
                      ),
                      child: Text(
                        error!,
                        style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () async {
                final conflictError = await ref
                    .read(schoolEcsProvider.notifier)
                    .upsertTimetableSlot(
                      TimetableSlotEntity(
                        id: 'tt_${DateTime.now().millisecondsSinceEpoch}',
                        classroomId: classroomId,
                        subjectId: subjectId,
                        teacherId: teacherId,
                        day: day,
                        period: period,
                        timeRange: timeCtrl.text.trim(),
                        room: roomCtrl.text.trim(),
                      ),
                    );
                if (conflictError != null) {
                  setModalState(() => error = conflictError);
                  return;
                }
                if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
              },
              child: const Text('Save Slot'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    final role = user?.role ?? PortalRole.admin;
    final ecs = ref.watch(schoolEcsProvider);
    final slots = ecs.timetableSlots.where((s) => s.classroomId == _classroomId).toList();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

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
                Text('Weekly Timetable', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                Text(
                  'Tap any period slot to inspect or mark its linked Lesson Plan in a dialog.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 210),
                  child: DropdownButtonFormField<String>(
                    value: _classroomId,
                    isExpanded: true,
                    decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                    items: ecs.classrooms
                        .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name, overflow: TextOverflow.ellipsis)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _classroomId = v);
                    },
                  ),
                ),
                if (role == PortalRole.admin)
                  FilledButton.icon(
                    onPressed: _openCreateSlotDialog,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add Slot'),
                  ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        ...days.map((day) {
          final daySlots = slots.where((s) => s.day == day).toList()
            ..sort((a, b) => a.period.compareTo(b.period));
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(day, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                if (daySlots.isEmpty)
                  const Text('No periods scheduled', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)))
                else
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: daySlots.map((slot) {
                      final subj = ecs.subjects.where((s) => s.id == slot.subjectId).firstOrNull;
                      final plan = ecs.lessonPlans.where((lp) => lp.timetableSlotId == slot.id).firstOrNull;
                      return InkWell(
                        onTap: () => _openSlotDialog(slot, role),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          width: 230,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('P${slot.period} · ${slot.timeRange}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                              Text(subj?.name ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                              Text('Room ${slot.room}', style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                              if (plan != null) ...[
                                const Divider(height: 14),
                                Text(
                                  '${plan.title} (${plan.status.label})',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF1D4ED8), fontWeight: FontWeight.w600),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
