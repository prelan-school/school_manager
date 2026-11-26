import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/ecs/dynamic_field_factory.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../domain/assessment_entry.dart';

Future<void> showAssessmentEntryDialog({
  required BuildContext context,
  required WidgetRef ref,
  required PortalRole role,
  required String teacherId,
  String? initialLearnerId,
}) async {
  final state = ref.read(schoolEcsProvider);
  var selectedLearnerId = initialLearnerId ?? state.learners.first.id;
  var selectedSubjectId = state.subjects.first.id;
  var selectedStrandId =
      state.strands.where((s) => s.subjectId == selectedSubjectId).firstOrNull?.id ?? '';
  var selectedSubstrandId =
      state.substrands.where((sub) => sub.strandId == selectedStrandId).firstOrNull?.id ?? '';
  var mastery = MasteryLevel.meeting;
  final scoreCtrl = TextEditingController(text: '82');
  final commentCtrl = TextEditingController();
  final customValues = <String, dynamic>{};
  String? error;

  final assessFields = state.dynamicFields
      .where((f) => f.targetEntityType == EntityType.assessmentEntry)
      .toList();

  await showDialog<void>(
    context: context,
    builder: (dialogCtx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          final strands = state.strands.where((s) => s.subjectId == selectedSubjectId).toList();
          if (!strands.any((s) => s.id == selectedStrandId)) {
            selectedStrandId = strands.firstOrNull?.id ?? '';
          }
          final substrands =
              state.substrands.where((sub) => sub.strandId == selectedStrandId).toList();
          if (!substrands.any((sub) => sub.id == selectedSubstrandId)) {
            selectedSubstrandId = substrands.firstOrNull?.id ?? '';
          }

          return AlertDialog(
            title: const Text('Record Assessment (Pulled from Schemes)'),
            content: SizedBox(
              width: 500,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    DropdownButtonFormField<String>(
                      value: selectedLearnerId,
                      decoration: const InputDecoration(
                        labelText: 'Learner',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: state.learners
                          .map((l) => DropdownMenuItem(value: l.id, child: Text(l.name)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => selectedLearnerId = v);
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: selectedSubjectId,
                      decoration: const InputDecoration(
                        labelText: 'Subject',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: state.subjects
                          .map((s) => DropdownMenuItem(value: s.id, child: Text(s.name)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => selectedSubjectId = v);
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: selectedStrandId.isEmpty ? null : selectedStrandId,
                      decoration: const InputDecoration(
                        labelText: 'Strand (Linked)',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: strands
                          .map(
                            (st) => DropdownMenuItem(
                              value: st.id,
                              child: Text('${st.code}: ${st.title}'),
                            ),
                          )
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => selectedStrandId = v);
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: selectedSubstrandId.isEmpty ? null : selectedSubstrandId,
                      decoration: const InputDecoration(
                        labelText: 'Substrand (Linked)',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: substrands
                          .map(
                            (sub) => DropdownMenuItem(
                              value: sub.id,
                              child: Text('${sub.code}: ${sub.title}'),
                            ),
                          )
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => selectedSubstrandId = v);
                      },
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<MasteryLevel>(
                            value: mastery,
                            decoration: const InputDecoration(
                              labelText: 'Mastery',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            items: MasteryLevel.values
                                .map((m) => DropdownMenuItem(value: m, child: Text(m.label)))
                                .toList(),
                            onChanged: (v) {
                              if (v != null) setState(() => mastery = v);
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        SizedBox(
                          width: 110,
                          child: TextField(
                            controller: scoreCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Score %',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: commentCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Performance Comment *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    DynamicFieldInputs(
                      fields: assessFields,
                      values: customValues,
                      role: role,
                      onChanged: (k, v) => customValues[k] = v,
                    ),
                    if (error != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        error!,
                        style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12),
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
                onPressed: selectedSubstrandId.isEmpty
                    ? null
                    : () async {
                        if (commentCtrl.text.trim().isEmpty) {
                          setState(() => error = 'Enter a learner performance comment.');
                          return;
                        }
                        await ref.read(schoolEcsProvider.notifier).addAssessmentEntry(
                              AssessmentEntryEntity(
                                id: 'ass_${DateTime.now().millisecondsSinceEpoch}',
                                learnerId: selectedLearnerId,
                                subjectId: selectedSubjectId,
                                strandId: selectedStrandId,
                                substrandId: selectedSubstrandId,
                                teacherId: teacherId,
                                date: '2026-11-25',
                                mastery: mastery,
                                scorePercent: (int.tryParse(scoreCtrl.text) ?? 0).clamp(0, 100),
                                performanceComment: commentCtrl.text.trim(),
                                customFields: Map<String, dynamic>.from(customValues),
                              ),
                            );
                        if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
                      },
                child: const Text('Save Assessment'),
              ),
            ],
          );
        },
      );
    },
  );
}
