import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';

class SchemaStudioPage extends ConsumerWidget {
  const SchemaStudioPage({super.key});

  Future<void> _showRegisterFieldDialog(BuildContext context, WidgetRef ref) async {
    var target = EntityType.diaryEntry;
    var type = DynamicFieldType.text;
    var teacherVisible = true;
    var parentVisible = true;
    final labelCtrl = TextEditingController();
    final descCtrl = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Register New Component Field'),
          content: SizedBox(
            width: 440,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<EntityType>(
                  value: target,
                  decoration: const InputDecoration(labelText: 'Target Entity', border: OutlineInputBorder(), isDense: true),
                  items: const [
                    EntityType.diaryEntry,
                    EntityType.assessmentEntry,
                    EntityType.lessonPlan,
                    EntityType.attendanceRecord,
                  ].map((e) => DropdownMenuItem(value: e, child: Text(e.key))).toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => target = v);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: labelCtrl,
                  decoration: const InputDecoration(labelText: 'Field Label *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<DynamicFieldType>(
                  value: type,
                  decoration: const InputDecoration(labelText: 'Data Type', border: OutlineInputBorder(), isDense: true),
                  items: DynamicFieldType.values
                      .map((t) => DropdownMenuItem(value: t, child: Text(t.key)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => type = v);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder(), isDense: true),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Visible to Teacher'),
                  value: teacherVisible,
                  onChanged: (v) => setState(() => teacherVisible = v ?? true),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Visible to Parent'),
                  value: parentVisible,
                  onChanged: (v) => setState(() => parentVisible = v ?? true),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(dialogCtx).pop(), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                final key = slugifyFieldKey(labelCtrl.text);
                if (key.isEmpty) return;
                await ref.read(schoolEcsProvider.notifier).registerDynamicField(
                      DynamicFieldDefinition(
                        id: 'fld_${DateTime.now().millisecondsSinceEpoch}',
                        targetEntityType: target,
                        key: key,
                        label: labelCtrl.text.trim(),
                        fieldType: type,
                        visibleTo: [
                          PortalRole.admin,
                          if (teacherVisible) PortalRole.teacher,
                          if (parentVisible) PortalRole.parent,
                        ],
                        editableBy: const [PortalRole.admin, PortalRole.teacher],
                        description: descCtrl.text.trim().isEmpty
                            ? 'Custom ECS component field'
                            : descCtrl.text.trim(),
                      ),
                    );
                if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
              },
              child: const Text('Register'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ecs = ref.watch(schoolEcsProvider);
    final notifier = ref.read(schoolEcsProvider.notifier);
    final sortedWidgets = [...ecs.pageWidgets]..sort((a, b) => a.order.compareTo(b.order));

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 12,
          children: [
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('ECS Component & Page Widget Studio', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                Text(
                  'Register dynamic fields and compose role-aligned Learner Page widgets at runtime.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
            FilledButton.icon(
              onPressed: () => _showRegisterFieldDialog(context, ref),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Register Component Field'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const Text('Registered Component Fields', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        ...ecs.dynamicFields.map(
          (f) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${f.targetEntityType.key}.${f.key} · ${f.fieldType.key}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                    Text(f.label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    Text('Visible: ${f.visibleTo.map((r) => r.key).join(', ')}', style: const TextStyle(fontSize: 11, color: Color(0xFF475569))),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Color(0xFFDC2626)),
                  onPressed: () => notifier.removeDynamicField(f.id),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Learner Page Widgets', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        ...sortedWidgets.map(
          (w) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Checkbox(
                  value: w.enabled,
                  onChanged: (_) => notifier.togglePageWidgetEnabled(w.id),
                ),
                Expanded(child: Text(w.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
                FilterChip(
                  label: const Text('Teacher', style: TextStyle(fontSize: 11)),
                  selected: w.allowedRoles.contains(PortalRole.teacher),
                  onSelected: (_) => notifier.togglePageWidgetRole(w.id, PortalRole.teacher),
                ),
                const SizedBox(width: 6),
                FilterChip(
                  label: const Text('Parent', style: TextStyle(fontSize: 11)),
                  selected: w.allowedRoles.contains(PortalRole.parent),
                  onSelected: (_) => notifier.togglePageWidgetRole(w.id, PortalRole.parent),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
