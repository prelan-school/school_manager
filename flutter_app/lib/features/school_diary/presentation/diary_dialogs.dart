import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/ecs/dynamic_field_factory.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../domain/diary_entry.dart';

Future<void> showDiaryEntryDialog({
  required BuildContext context,
  required WidgetRef ref,
  required PortalRole role,
  required String teacherId,
  String? initialLearnerId,
}) async {
  final state = ref.read(schoolEcsProvider);
  var selectedLearnerId = initialLearnerId ?? state.learners.first.id;
  final dateCtrl = TextEditingController(text: '2026-11-25');
  final hwCtrl = TextEditingController();
  final noteCtrl = TextEditingController();
  final customValues = <String, dynamic>{};
  String? error;

  final diaryFields = state.dynamicFields
      .where((f) => f.targetEntityType == EntityType.diaryEntry)
      .toList();

  await showDialog<void>(
    context: context,
    builder: (dialogCtx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          return AlertDialog(
            title: const Text('Log Daily Diary Entry'),
            content: SizedBox(
              width: 480,
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
                          .map(
                            (l) => DropdownMenuItem(
                              value: l.id,
                              child: Text('${l.name} (${l.admissionNo})'),
                            ),
                          )
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => selectedLearnerId = v);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: dateCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Date (YYYY-MM-DD)',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: hwCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Homework & Tasks *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: noteCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Teacher Remark',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 12),
                    DynamicFieldInputs(
                      fields: diaryFields,
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
                onPressed: () async {
                  if (hwCtrl.text.trim().isEmpty) {
                    setState(() => error = 'Homework summary is required.');
                    return;
                  }
                  final learner = state.learners.firstWhere((l) => l.id == selectedLearnerId);
                  await ref.read(schoolEcsProvider.notifier).addDiaryEntry(
                        DiaryEntryEntity(
                          id: 'dry_${DateTime.now().millisecondsSinceEpoch}',
                          learnerId: learner.id,
                          classroomId: learner.classroomId,
                          teacherId: teacherId,
                          date: dateCtrl.text.trim(),
                          homeworkSummary: hwCtrl.text.trim(),
                          teacherNote: noteCtrl.text.trim(),
                          parentAcknowledged: false,
                          customFields: Map<String, dynamic>.from(customValues),
                        ),
                      );
                  if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
                },
                child: const Text('Publish Diary Entry'),
              ),
            ],
          );
        },
      );
    },
  );
}

Future<void> showAddDiaryFieldDialog({
  required BuildContext context,
  required WidgetRef ref,
}) async {
  final labelCtrl = TextEditingController();
  final optsCtrl = TextEditingController();
  var fieldType = DynamicFieldType.text;
  var parentVisible = true;
  String? error;

  await showDialog<void>(
    context: context,
    builder: (dialogCtx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          return AlertDialog(
            title: const Text('Add Custom Diary Field'),
            content: SizedBox(
              width: 440,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: labelCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Field Label * (e.g. Citizenship Merit)',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<DynamicFieldType>(
                    value: fieldType,
                    decoration: const InputDecoration(
                      labelText: 'Data Type',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: DynamicFieldType.values
                        .map((t) => DropdownMenuItem(value: t, child: Text(t.key)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => fieldType = v);
                    },
                  ),
                  if (fieldType == DynamicFieldType.select) ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: optsCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Options (comma-separated)',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Visible in Parent Portal', style: TextStyle(fontSize: 13)),
                    value: parentVisible,
                    onChanged: (v) => setState(() => parentVisible = v ?? true),
                  ),
                  if (error != null)
                    Text(
                      error!,
                      style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12),
                    ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogCtx).pop(),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () async {
                  final key = slugifyFieldKey(labelCtrl.text);
                  if (key.isEmpty) {
                    setState(() => error = 'Enter a valid field label.');
                    return;
                  }
                  await ref.read(schoolEcsProvider.notifier).registerDynamicField(
                        DynamicFieldDefinition(
                          id: 'fld_${DateTime.now().millisecondsSinceEpoch}',
                          targetEntityType: EntityType.diaryEntry,
                          key: key,
                          label: labelCtrl.text.trim(),
                          fieldType: fieldType,
                          options: fieldType == DynamicFieldType.select
                              ? optsCtrl.text
                                  .split(',')
                                  .map((e) => e.trim())
                                  .where((e) => e.isNotEmpty)
                                  .toList()
                              : const [],
                          visibleTo: parentVisible
                              ? const [PortalRole.admin, PortalRole.teacher, PortalRole.parent]
                              : const [PortalRole.admin, PortalRole.teacher],
                          editableBy: const [PortalRole.admin, PortalRole.teacher],
                          description: 'Custom diary ECS component field',
                        ),
                      );
                  if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
                },
                child: const Text('Register Field'),
              ),
            ],
          );
        },
      );
    },
  );
}
