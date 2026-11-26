import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/school_entity.dart';
import '../../auth/data/firebase_auth_repository.dart';
import '../../auth/domain/auth_user.dart';

class SchemaStudioPage extends ConsumerStatefulWidget {
  const SchemaStudioPage({super.key});

  @override
  ConsumerState<SchemaStudioPage> createState() => _SchemaStudioPageState();
}

class _SchemaStudioPageState extends ConsumerState<SchemaStudioPage> {
  EntityType? _filterEntityType;
  bool _showArchived = false;
  bool _seeding = false;

  Future<void> _openUserLinkDialog({AuthUser? existing}) async {
    final ecs = ref.read(schoolEcsProvider);
    final firebaseReady = ref.read(firebaseReadyProvider);
    final emailCtrl = TextEditingController(text: existing?.email ?? '');
    final nameCtrl = TextEditingController(text: existing?.displayName ?? '');
    var role = existing?.role ?? PortalRole.parent;
    var teacherId = existing?.teacherId ?? ecs.teachers.firstOrNull?.id ?? 'tch_amara';
    final linkedIds = Set<String>.from(existing?.linkedLearnerIds ?? const <String>[]);
    String? error;

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: Text(
            existing == null
                ? 'Invite / Pre-Provision User & Guardians'
                : 'Edit User & Guardian Links',
          ),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: emailCtrl,
                    enabled: existing == null,
                    decoration: const InputDecoration(
                      labelText: 'Email Address *',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Display Name *',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<PortalRole>(
                    value: role,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Portal Role',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: PortalRole.values
                        .map(
                          (r) => DropdownMenuItem(
                            value: r,
                            child: Text(r.label, overflow: TextOverflow.ellipsis),
                          ),
                        )
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setModalState(() => role = v);
                    },
                  ),
                  if (role != PortalRole.parent && ecs.teachers.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: ecs.teachers.any((t) => t.id == teacherId)
                          ? teacherId
                          : ecs.teachers.first.id,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Linked Teacher Profile',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: ecs.teachers
                          .map(
                            (t) => DropdownMenuItem(
                              value: t.id,
                              child: Text(t.name, overflow: TextOverflow.ellipsis),
                            ),
                          )
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setModalState(() => teacherId = v);
                      },
                    ),
                  ],
                  if (role == PortalRole.parent) ...[
                    const SizedBox(height: 12),
                    const Text(
                      'Linked Learners (Multi-Child Guardian Access)',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    ...ecs.learners.map(
                      (l) => CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        title: Text(
                          '${l.name} (${l.admissionNo})',
                          style: const TextStyle(fontSize: 13),
                        ),
                        value: linkedIds.contains(l.id),
                        onChanged: (checked) {
                          setModalState(() {
                            if (checked ?? false) {
                              linkedIds.add(l.id);
                            } else {
                              linkedIds.remove(l.id);
                            }
                          });
                        },
                      ),
                    ),
                  ],
                  if (!firebaseReady) ...[
                    const SizedBox(height: 8),
                    const Text(
                      'Demo preview mode: Firestore writes activate once Firebase is configured.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                  ],
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
                if (!emailCtrl.text.contains('@') || nameCtrl.text.trim().isEmpty) {
                  setModalState(() => error = 'Enter a valid email and display name.');
                  return;
                }
                if (firebaseReady) {
                  await FirebaseAuthRepository(
                    FirebaseAuth.instance,
                    FirebaseFirestore.instance,
                  ).createOrUpdateUserRecord(
                    uid: existing?.uid,
                    email: emailCtrl.text,
                    displayName: nameCtrl.text,
                    role: role,
                    teacherId: role == PortalRole.parent ? null : teacherId,
                    linkedLearnerIds:
                        role == PortalRole.parent ? linkedIds.toList() : const [],
                  );
                }
                if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        firebaseReady
                            ? 'Saved user & guardian links for ${emailCtrl.text.trim()}.'
                            : 'Demo mode: configure Firebase to persist user accounts.',
                      ),
                    ),
                  );
                }
              },
              child: const Text('Save Account'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showFieldDialog({DynamicFieldDefinition? existing}) async {
    var target = existing?.targetEntityType ?? EntityType.diaryEntry;
    var type = existing?.fieldType ?? DynamicFieldType.text;
    var requiredField = existing?.required ?? false;
    var teacherVisible =
        existing == null ? true : existing.visibleTo.contains(PortalRole.teacher);
    var parentVisible =
        existing == null ? true : existing.visibleTo.contains(PortalRole.parent);
    var teacherEditable =
        existing == null ? true : existing.editableBy.contains(PortalRole.teacher);
    var parentEditable =
        existing?.editableBy.contains(PortalRole.parent) ?? false;

    final labelCtrl = TextEditingController(text: existing?.label ?? '');
    final optionsCtrl = TextEditingController(
      text: existing != null ? existing.options.join(', ') : '',
    );
    final descCtrl = TextEditingController(text: existing?.description ?? '');
    String? error;

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: Text(
            existing == null
                ? 'Register New Component Field'
                : 'Edit Component Field',
          ),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<EntityType>(
                    value: target,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Target Entity Type',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: EntityType.values
                        .map(
                          (e) => DropdownMenuItem(
                            value: e,
                            child: Text(
                              e.key,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setModalState(() => target = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: labelCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Field Label *',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<DynamicFieldType>(
                    value: type,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Data Type',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: DynamicFieldType.values
                        .map(
                          (t) => DropdownMenuItem(
                            value: t,
                            child: Text(t.key, overflow: TextOverflow.ellipsis),
                          ),
                        )
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setModalState(() => type = v);
                    },
                  ),
                  if (type == DynamicFieldType.select) ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: optionsCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Options (comma-separated) *',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: descCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: const Text('Required field'),
                    value: requiredField,
                    onChanged: (v) =>
                        setModalState(() => requiredField = v ?? false),
                  ),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: const Text('Visible to Teacher'),
                    value: teacherVisible,
                    onChanged: (v) =>
                        setModalState(() => teacherVisible = v ?? true),
                  ),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: const Text('Visible to Parent'),
                    value: parentVisible,
                    onChanged: (v) =>
                        setModalState(() => parentVisible = v ?? true),
                  ),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: const Text('Editable by Teacher'),
                    value: teacherEditable,
                    onChanged: (v) =>
                        setModalState(() => teacherEditable = v ?? true),
                  ),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: const Text('Editable by Parent'),
                    value: parentEditable,
                    onChanged: (v) =>
                        setModalState(() => parentEditable = v ?? false),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      error!,
                      style: const TextStyle(
                        color: Color(0xFFDC2626),
                        fontSize: 12,
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
                final key = slugifyFieldKey(labelCtrl.text);
                if (key.isEmpty) {
                  setModalState(() => error = 'Enter a valid field label.');
                  return;
                }
                final parsedOptions = type == DynamicFieldType.select
                    ? optionsCtrl.text
                        .split(',')
                        .map((o) => o.trim())
                        .where((o) => o.isNotEmpty)
                        .toList()
                    : const <String>[];
                if (type == DynamicFieldType.select && parsedOptions.isEmpty) {
                  setModalState(
                    () => error = 'Select fields require at least one option.',
                  );
                  return;
                }

                final ecs = ref.read(schoolEcsProvider);
                final duplicate = ecs.dynamicFields.any(
                  (f) =>
                      f.id != existing?.id &&
                      f.targetEntityType == target &&
                      f.key == key,
                );
                if (duplicate) {
                  setModalState(
                    () => error = 'Field "$key" already exists on ${target.key}.',
                  );
                  return;
                }

                final def = DynamicFieldDefinition(
                  id: existing?.id ?? 'fld_${DateTime.now().millisecondsSinceEpoch}',
                  targetEntityType: target,
                  key: key,
                  label: labelCtrl.text.trim(),
                  fieldType: type,
                  options: parsedOptions,
                  required: requiredField,
                  visibleTo: [
                    PortalRole.admin,
                    if (teacherVisible) PortalRole.teacher,
                    if (parentVisible) PortalRole.parent,
                  ],
                  editableBy: [
                    PortalRole.admin,
                    if (teacherEditable) PortalRole.teacher,
                    if (parentEditable) PortalRole.parent,
                  ],
                  description: descCtrl.text.trim().isEmpty
                      ? 'Custom ECS component field'
                      : descCtrl.text.trim(),
                  archived: existing?.archived ?? false,
                );

                final notifier = ref.read(schoolEcsProvider.notifier);
                if (existing == null) {
                  await notifier.registerDynamicField(def);
                } else {
                  await notifier.updateDynamicField(def);
                }
                if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
              },
              child: Text(existing == null ? 'Register' : 'Save Changes'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    final firebaseReady = ref.watch(firebaseReadyProvider);
    final role = user?.role ?? PortalRole.admin;
    final isAdmin = role == PortalRole.admin;
    final ecs = ref.watch(schoolEcsProvider);
    final notifier = ref.read(schoolEcsProvider.notifier);
    final usersAsync = ref.watch(allUsersStreamProvider);

    final archivedCount = ecs.dynamicFields.where((f) => f.archived).length;
    final filteredFields = ecs.dynamicFields.where((f) {
      final matchesArchive = _showArchived ? f.archived : !f.archived;
      final matchesType =
          _filterEntityType == null || f.targetEntityType == _filterEntityType;
      return matchesArchive && matchesType;
    }).toList();
    final sortedWidgets = [...ecs.pageWidgets]
      ..sort((a, b) => a.order.compareTo(b.order));

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        if (ecs.syncError != null)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: Text(
              'Firestore sync notice: ${ecs.syncError}',
              style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C)),
            ),
          ),
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
                  'ECS Component & Page Widget Studio',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  isAdmin
                      ? 'Full Admin CRUD over component schemas, soft-archiving, and guardian linking.'
                      : 'Read-only registry of dynamic ECS fields and page widgets.',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                ),
              ],
            ),
            if (isAdmin)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: _seeding
                        ? null
                        : () async {
                            setState(() => _seeding = true);
                            try {
                              final count = await notifier.seedFirestoreDemoData();
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    count > 0
                                        ? 'Seeded $count Firestore documents.'
                                        : 'Demo mode active: local seed reset.',
                                  ),
                                ),
                              );
                            } finally {
                              if (mounted) setState(() => _seeding = false);
                            }
                          },
                    icon: const Icon(Icons.cloud_upload_outlined, size: 16),
                    label: Text(_seeding ? 'Seeding...' : 'Seed Firestore DB'),
                  ),
                  FilledButton.icon(
                    onPressed: () => _showFieldDialog(),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Register Field'),
                  ),
                ],
              ),
          ],
        ),
        const SizedBox(height: 16),
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 12,
          runSpacing: 10,
          children: [
            Text(
              '${_showArchived ? 'Archived' : 'Active'} Component Fields (${filteredFields.length})',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                FilterChip(
                  label: Text('Archived ($archivedCount)', style: const TextStyle(fontSize: 12)),
                  selected: _showArchived,
                  onSelected: (v) => setState(() => _showArchived = v),
                ),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 220),
                  child: DropdownButtonFormField<EntityType?>(
                    value: _filterEntityType,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem<EntityType?>(
                        value: null,
                        child: Text('All Entities', overflow: TextOverflow.ellipsis),
                      ),
                      ...EntityType.values.map(
                        (e) => DropdownMenuItem<EntityType?>(
                          value: e,
                          child: Text(e.key, overflow: TextOverflow.ellipsis),
                        ),
                      ),
                    ],
                    onChanged: (v) => setState(() => _filterEntityType = v),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...filteredFields.map(
          (f) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${f.targetEntityType.key}.${f.key} · ${f.fieldType.key}${f.required ? ' · Required' : ''}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        f.label,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                      if (f.description.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          f.description,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Text(
                        'Visible: ${f.visibleTo.map((r) => r.key).join(', ')} · Editable: ${f.editableBy.map((r) => r.key).join(', ')}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
                if (isAdmin)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        tooltip: 'Edit field ${f.label}',
                        icon: const Icon(Icons.edit_outlined, color: Color(0xFF1D4ED8)),
                        onPressed: () => _showFieldDialog(existing: f),
                      ),
                      if (f.archived)
                        IconButton(
                          tooltip: 'Restore field ${f.label}',
                          icon: const Icon(Icons.unarchive_outlined, color: Color(0xFF15803D)),
                          onPressed: () => notifier.restoreDynamicField(f.id),
                        )
                      else
                        IconButton(
                          tooltip: 'Archive field ${f.label}',
                          icon: const Icon(Icons.archive_outlined, color: Color(0xFFB45309)),
                          onPressed: () => notifier.archiveDynamicField(f.id),
                        ),
                    ],
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Learner Page Widgets',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        for (var i = 0; i < sortedWidgets.length; i++)
          Container(
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
                  value: sortedWidgets[i].enabled,
                  onChanged: isAdmin
                      ? (_) => notifier.togglePageWidgetEnabled(sortedWidgets[i].id)
                      : null,
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        sortedWidgets[i].title,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      Text(
                        sortedWidgets[i].description,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    alignment: WrapAlignment.end,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      FilterChip(
                        label: const Text('Teacher', style: TextStyle(fontSize: 11)),
                        selected:
                            sortedWidgets[i].allowedRoles.contains(PortalRole.teacher),
                        onSelected: isAdmin
                            ? (_) => notifier.togglePageWidgetRole(
                                  sortedWidgets[i].id,
                                  PortalRole.teacher,
                                )
                            : null,
                      ),
                      FilterChip(
                        label: const Text('Parent', style: TextStyle(fontSize: 11)),
                        selected:
                            sortedWidgets[i].allowedRoles.contains(PortalRole.parent),
                        onSelected: isAdmin
                            ? (_) => notifier.togglePageWidgetRole(
                                  sortedWidgets[i].id,
                                  PortalRole.parent,
                                )
                            : null,
                      ),
                      if (isAdmin) ...[
                        IconButton(
                          icon: const Icon(Icons.arrow_upward, size: 16),
                          onPressed: i == 0
                              ? null
                              : () => notifier.movePageWidget(sortedWidgets[i].id, -1),
                        ),
                        IconButton(
                          icon: const Icon(Icons.arrow_downward, size: 16),
                          onPressed: i == sortedWidgets.length - 1
                              ? null
                              : () => notifier.movePageWidget(sortedWidgets[i].id, 1),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        if (isAdmin) ...[
          const SizedBox(height: 16),
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 8,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Portal Users & Guardian Linking',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Default Admin ($defaultAdminEmail) claims "admin". Assign Teacher profiles or multi-child Parent links.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
                  ),
                ],
              ),
              FilledButton.tonalIcon(
                onPressed: () => _openUserLinkDialog(),
                icon: const Icon(Icons.person_add_alt_1, size: 16),
                label: const Text('Invite / Link User'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...usersAsync.when(
            loading: () => const [
              Padding(
                padding: EdgeInsets.all(12),
                child: Center(child: CircularProgressIndicator()),
              ),
            ],
            error: (err, _) => [
              Text(
                'Unable to load users: $err',
                style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626)),
              ),
            ],
            data: (users) => users.map(
              (u) {
                final childNames = u.linkedLearnerIds
                    .map((id) =>
                        ecs.learners.where((l) => l.id == id).firstOrNull?.name ?? id)
                    .join(', ');
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              u.displayName,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                            Text(
                              '${u.email} · role: "${u.role.key}"${childNames.isNotEmpty ? ' · Children: $childNames' : ''}',
                              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        tooltip: 'Edit guardian/staff links',
                        icon: const Icon(Icons.link, size: 18, color: Color(0xFF1D4ED8)),
                        onPressed: () => _openUserLinkDialog(existing: u),
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 150),
                          child: DropdownButtonFormField<PortalRole>(
                            value: u.role,
                            isExpanded: true,
                            decoration: const InputDecoration(
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            items: PortalRole.values
                                .map(
                                  (r) => DropdownMenuItem(
                                    value: r,
                                    child: Text(r.key, overflow: TextOverflow.ellipsis),
                                  ),
                                )
                                .toList(),
                            onChanged: firebaseReady
                                ? (nextRole) async {
                                    if (nextRole == null || nextRole == u.role) return;
                                    await FirebaseAuthRepository(
                                      FirebaseAuth.instance,
                                      FirebaseFirestore.instance,
                                    ).updateUserRole(uid: u.uid, role: nextRole);
                                  }
                                : null,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }
}
