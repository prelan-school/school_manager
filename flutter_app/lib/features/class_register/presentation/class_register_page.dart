import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../../auth/data/firebase_auth_repository.dart';
import '../domain/attendance_record.dart';

class ClassRegisterPage extends ConsumerStatefulWidget {
  const ClassRegisterPage({super.key});

  @override
  ConsumerState<ClassRegisterPage> createState() => _ClassRegisterPageState();
}

class _ClassRegisterPageState extends ConsumerState<ClassRegisterPage> {
  final String _date = '2026-11-25';
  String _classroomId = 'cls_5a';

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    final role = user?.role ?? PortalRole.admin;
    final ecs = ref.watch(schoolEcsProvider);
    final canEdit = role == PortalRole.admin || role == PortalRole.teacher;
    final teacherId = user?.teacherId ?? ecs.teachers.first.id;

    final showUniform = ecs.dynamicFields.any(
      (f) => f.targetEntityType == EntityType.attendanceRecord && f.key == 'uniform_compliant' && f.isVisibleTo(role),
    );

    final learners = role == PortalRole.parent
        ? ecs.learners.where((l) => user?.linkedLearnerIds.contains(l.id) ?? false).toList()
        : ecs.learners.where((l) => l.classroomId == _classroomId).toList();

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 12,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Class Register', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                Text(
                  role == PortalRole.parent
                      ? 'Child attendance history (staff uniform checks hidden).'
                      : 'Roll call for $_date. Tap a learner name to open their longitudinal profile.',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
            if (role != PortalRole.parent)
              SizedBox(
                width: 210,
                child: DropdownButtonFormField<String>(
                  value: _classroomId,
                  decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                  items: ecs.classrooms
                      .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _classroomId = v);
                  },
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        ...learners.map((learner) {
          final rec = ecs.attendanceRecords
              .where((r) => r.learnerId == learner.id && r.date == _date)
              .firstOrNull;
          final status = rec?.status ?? AttendanceStatus.present;
          final uniformOk = (rec?.customFields['uniform_compliant'] as bool?) ?? true;

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 12,
              runSpacing: 10,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(learner.admissionNo, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                    InkWell(
                      onTap: () => context.go('/learners/${learner.id}'),
                      child: Text(
                        learner.name,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1D4ED8)),
                      ),
                    ),
                    if (showUniform)
                      Text(
                        'Uniform (Staff Only): ${uniformOk ? 'Compliant' : 'Needs Follow-up'}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                      ),
                  ],
                ),
                if (canEdit)
                  Wrap(
                    spacing: 6,
                    children: AttendanceStatus.values.map((st) {
                      return ChoiceChip(
                        label: Text(st.label, style: const TextStyle(fontSize: 11)),
                        selected: status == st,
                        onSelected: (_) {
                          ref.read(schoolEcsProvider.notifier).upsertAttendance(
                                AttendanceRecordEntity(
                                  id: rec?.id ?? 'att_${learner.id}_$_date',
                                  learnerId: learner.id,
                                  classroomId: learner.classroomId,
                                  teacherId: teacherId,
                                  date: _date,
                                  status: st,
                                  remark: rec?.remark ?? 'Updated via Class Register.',
                                  customFields: rec?.customFields ?? const {'uniform_compliant': true},
                                ),
                              );
                        },
                      );
                    }).toList(),
                  )
                else
                  Text(status.label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
              ],
            ),
          );
        }),
      ],
    );
  }
}
