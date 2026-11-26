import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../../auth/data/firebase_auth_repository.dart';
import '../domain/scheme_nodes.dart';

class SchemesPage extends ConsumerWidget {
  const SchemesPage({super.key});

  Future<void> _showStrandDialog(BuildContext context, WidgetRef ref, String teacherId) async {
    final state = ref.read(schoolEcsProvider);
    var subjectId = state.subjects.first.id;
    var term = 'Term 1';
    final codeCtrl = TextEditingController();
    final titleCtrl = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Register Curriculum Strand'),
          content: SizedBox(
            width: 440,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: subjectId,
                  decoration: const InputDecoration(labelText: 'Subject', border: OutlineInputBorder(), isDense: true),
                  items: state.subjects.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))).toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => subjectId = v);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: codeCtrl,
                  decoration: const InputDecoration(labelText: 'Strand Code *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(labelText: 'Strand Title *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: term,
                  decoration: const InputDecoration(labelText: 'Term', border: OutlineInputBorder(), isDense: true),
                  items: const ['Term 1', 'Term 2', 'Term 3']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => term = v);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(dialogCtx).pop(), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                if (codeCtrl.text.trim().isEmpty || titleCtrl.text.trim().isEmpty) return;
                await ref.read(schoolEcsProvider.notifier).addSchemeStrand(
                      SchemeStrandEntity(
                        id: 'str_${DateTime.now().millisecondsSinceEpoch}',
                        subjectId: subjectId,
                        code: codeCtrl.text.trim(),
                        title: titleCtrl.text.trim(),
                        term: term,
                        createdByTeacherId: teacherId,
                      ),
                    );
                if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
              },
              child: const Text('Register Strand'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showSubstrandDialog(BuildContext context, WidgetRef ref, String initialStrandId) async {
    final state = ref.read(schoolEcsProvider);
    var strandId = initialStrandId;
    final codeCtrl = TextEditingController();
    final titleCtrl = TextEditingController();
    final outcomeCtrl = TextEditingController();
    final lessonsCtrl = TextEditingController(text: '4');

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Add Substrand Under Strand'),
          content: SizedBox(
            width: 460,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: strandId,
                  decoration: const InputDecoration(labelText: 'Parent Strand', border: OutlineInputBorder(), isDense: true),
                  items: state.strands
                      .map((st) => DropdownMenuItem(value: st.id, child: Text('${st.code} — ${st.title}')))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => strandId = v);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: codeCtrl,
                  decoration: const InputDecoration(labelText: 'Substrand Code *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(labelText: 'Substrand Title *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: outcomeCtrl,
                  decoration: const InputDecoration(labelText: 'Learning Outcome', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: lessonsCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Target Lessons', border: OutlineInputBorder(), isDense: true),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(dialogCtx).pop(), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                if (codeCtrl.text.trim().isEmpty || titleCtrl.text.trim().isEmpty) return;
                final strand = state.strands.firstWhere((s) => s.id == strandId);
                await ref.read(schoolEcsProvider.notifier).addSchemeSubstrand(
                      SchemeSubstrandEntity(
                        id: 'sub_${DateTime.now().millisecondsSinceEpoch}',
                        strandId: strand.id,
                        subjectId: strand.subjectId,
                        code: codeCtrl.text.trim(),
                        title: titleCtrl.text.trim(),
                        learningOutcome: outcomeCtrl.text.trim(),
                        targetLessons: int.tryParse(lessonsCtrl.text) ?? 4,
                      ),
                    );
                if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
              },
              child: const Text('Add Substrand'),
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
                Text('Schemes of Work Database', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                Text(
                  'Register Strands & Substrands once; Assessments & Lesson Plans pull them automatically.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
            if (canEdit)
              Wrap(
                spacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _showStrandDialog(context, ref, teacherId),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Register Strand'),
                  ),
                  FilledButton.icon(
                    onPressed: () => _showSubstrandDialog(context, ref, ecs.strands.first.id),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add Substrand'),
                  ),
                ],
              ),
          ],
        ),
        const SizedBox(height: 16),
        ...ecs.strands.map((strand) {
          final subj = ecs.subjects.where((s) => s.id == strand.subjectId).firstOrNull;
          final children = ecs.substrands.where((sub) => sub.strandId == strand.id).toList();
          return Container(
            margin: const EdgeInsets.only(bottom: 14),
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${subj?.name ?? ''} · ${strand.term}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                        Text('${strand.code}: ${strand.title}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      ],
                    ),
                    if (canEdit)
                      TextButton(
                        onPressed: () => _showSubstrandDialog(context, ref, strand.id),
                        child: const Text('+ Add Substrand'),
                      ),
                  ],
                ),
                const Divider(height: 20),
                ...children.map((sub) {
                  final planCount = ecs.lessonPlans.where((lp) => lp.substrandId == sub.id).length;
                  final assessCount = ecs.assessments.where((a) => a.substrandId == sub.id).length;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${sub.code}: ${sub.title}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                              Text(sub.learningOutcome, style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                            ],
                          ),
                        ),
                        Text(
                          '${sub.targetLessons} lessons · $planCount plans · $assessCount assessments',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          );
        }),
      ],
    );
  }
}
