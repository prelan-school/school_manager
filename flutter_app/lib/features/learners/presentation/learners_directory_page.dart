import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../../auth/data/firebase_auth_repository.dart';
import '../domain/learner.dart';
import '../domain/learner_longitudinal_system.dart';

class LearnersDirectoryPage extends ConsumerStatefulWidget {
  const LearnersDirectoryPage({super.key});

  @override
  ConsumerState<LearnersDirectoryPage> createState() => _LearnersDirectoryPageState();
}

class _LearnersDirectoryPageState extends ConsumerState<LearnersDirectoryPage> {
  String _search = '';
  String _classroomId = 'all';

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    final role = user?.role ?? PortalRole.admin;
    final ecs = ref.watch(schoolEcsProvider);
    final selectedParentLearnerId = ref.watch(selectedParentLearnerIdProvider);

    final scopedLearners = role == PortalRole.parent
        ? ecs.learners.where((l) => user?.linkedLearnerIds.contains(l.id) ?? false).toList()
        : ecs.learners.where((l) {
            final matchClass = _classroomId == 'all' || l.classroomId == _classroomId;
            final q = _search.trim().toLowerCase();
            final matchSearch = q.isEmpty ||
                l.name.toLowerCase().contains(q) ||
                l.admissionNo.toLowerCase().contains(q);
            return matchClass && matchSearch;
          }).toList();

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
                  'Learners',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                Text(
                  'Open any learner to inspect their loosely coupled longitudinal profile (${role.label}).',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
            if (role != PortalRole.parent)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  SizedBox(
                    width: 220,
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Search name or admission no...',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      onChanged: (v) => setState(() => _search = v),
                    ),
                  ),
                  Flexible(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 210),
                      child: DropdownButtonFormField<String>(
                        value: _classroomId,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: [
                          const DropdownMenuItem(
                            value: 'all',
                            child: Text('All Classrooms', overflow: TextOverflow.ellipsis),
                          ),
                          ...ecs.classrooms.map(
                            (c) => DropdownMenuItem(
                              value: c.id,
                              child: Text(c.name, overflow: TextOverflow.ellipsis),
                            ),
                          ),
                        ],
                        onChanged: (v) {
                          if (v != null) setState(() => _classroomId = v);
                        },
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
        const SizedBox(height: 16),
        ...scopedLearners.map((learner) {
          final classroom = ecs.classrooms.where((c) => c.id == learner.classroomId).firstOrNull;
          final report = LearnerLongitudinalSystem.buildReport(
            ecs,
            learner.id,
            role,
            const LearnerTimeframe(preset: TimeframePreset.sinceRegistration),
          );
          final isSelectedChild = role == PortalRole.parent &&
              selectedParentLearnerId == learner.id;
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelectedChild
                    ? const Color(0xFF2563EB)
                    : const Color(0xFFE2E8F0),
                width: isSelectedChild ? 1.5 : 1,
              ),
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
                            '${learner.admissionNo} · ${classroom?.name ?? ''} · Registered ${learner.registeredAt}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            learner.name,
                            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      flex: 0,
                      child: Text(
                        learner.enrollmentStatus,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF15803D),
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 22),
                Row(
                  children: [
                    Expanded(
                      child: _MetricTile(
                        label: 'Avg Mastery',
                        value: report?.averageScore != null ? '${report!.averageScore}%' : '—',
                      ),
                    ),
                    Expanded(
                      child: _MetricTile(
                        label: 'Attendance',
                        value: report?.attendanceRate != null ? '${report!.attendanceRate}%' : '—',
                      ),
                    ),
                    Expanded(
                      child: _MetricTile(
                        label: 'Diary Logs',
                        value: '${report?.diary.length ?? 0}',
                      ),
                    ),
                  ],
                ),
                const Divider(height: 22),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Guardian: ${learner.parentName}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      flex: 0,
                      child: FilledButton.icon(
                        onPressed: () {
                          if (role == PortalRole.parent) {
                            ref.read(selectedParentLearnerIdProvider.notifier).state =
                                learner.id;
                          }
                          context.go('/learners/${learner.id}');
                        },
                        icon: const Icon(Icons.arrow_forward, size: 15),
                        label: const Text('Open Learner Page'),
                      ),
                    ),
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

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
      ],
    );
  }
}
