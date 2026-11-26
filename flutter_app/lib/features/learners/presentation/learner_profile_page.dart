import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/ecs/dynamic_field_factory.dart';
import '../../../core/ecs/ecs_providers.dart';
import '../../../core/ecs/ecs_seed_data.dart';
import '../../../core/ecs/school_entity.dart';
import '../../assessment_books/presentation/assessment_entry_dialog.dart';
import '../../auth/data/firebase_auth_repository.dart';
import '../../school_diary/presentation/diary_dialogs.dart';
import '../domain/learner.dart';
import '../domain/learner_longitudinal_system.dart';

class LearnerProfilePage extends ConsumerStatefulWidget {
  const LearnerProfilePage({super.key, required this.learnerId});

  final String learnerId;

  @override
  ConsumerState<LearnerProfilePage> createState() => _LearnerProfilePageState();
}

class _LearnerProfilePageState extends ConsumerState<LearnerProfilePage> {
  TimeframePreset _preset = TimeframePreset.sinceRegistration;
  String? _customFrom;
  String? _customTo;
  String _timelineFilter = 'all';

  Future<void> _pickCustomDateRange(LearnerEntity learner) async {
    final initialStart = DateTime.tryParse(_customFrom ?? learner.registeredAt) ??
        DateTime(2026, 9, 1);
    final initialEnd = DateTime.tryParse(
          _customTo ?? LearnerLongitudinalSystem.referenceToday,
        ) ??
        DateTime(2026, 11, 25);

    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020, 1, 1),
      lastDate: DateTime(2030, 12, 31),
      initialDateRange: DateTimeRange(
        start: initialStart.isAfter(initialEnd) ? initialEnd : initialStart,
        end: initialEnd,
      ),
    );
    if (picked == null) return;
    String fmt(DateTime d) =>
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

    setState(() {
      _preset = TimeframePreset.custom;
      _customFrom = fmt(picked.start);
      _customTo = fmt(picked.end);
    });
  }

  Future<void> _openExportReportDialog(
    SchoolEcsState ecs,
    LearnerLongitudinalReport report,
  ) async {
    final markdown = LearnerReportFormatter.toMarkdown(ecs, report);
    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: Text('Term Progress Report · ${report.learner.name}'),
        content: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 620, maxHeight: 460),
          child: SingleChildScrollView(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: SelectableText(
                markdown,
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.45,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Close'),
          ),
          FilledButton.icon(
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: markdown));
              if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Progress report copied to clipboard.'),
                  ),
                );
              }
            },
            icon: const Icon(Icons.copy, size: 16),
            label: const Text('Copy Report'),
          ),
        ],
      ),
    );
  }

  Future<void> _openEditLearnerDialog(
    LearnerEntity learner,
    List<DynamicFieldDefinition> learnerFields,
    PortalRole role,
  ) async {
    final nameCtrl = TextEditingController(text: learner.name);
    var status = learner.enrollmentStatus;
    final parentCtrl = TextEditingController(text: learner.parentName);
    final phoneCtrl = TextEditingController(text: learner.guardianPhone);
    final healthCtrl = TextEditingController(text: learner.internalHealthNote);
    final customValues = Map<String, dynamic>.from(learner.customFields);
    String? error;

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: const Text('Edit Learner Profile & Fields'),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Learner Name *',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: status,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Enrollment Status',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: const ['Active', 'Probation', 'Alumni']
                        .map(
                          (s) => DropdownMenuItem(
                            value: s,
                            child: Text(s, overflow: TextOverflow.ellipsis),
                          ),
                        )
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setModalState(() => status = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: parentCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Guardian Name',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: phoneCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Guardian Phone',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: healthCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Internal Staff Health Note',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  if (learnerFields.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    DynamicFieldInputs(
                      fields: learnerFields,
                      values: customValues,
                      role: role,
                      onChanged: (k, v) => customValues[k] = v,
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
                if (nameCtrl.text.trim().isEmpty) {
                  setModalState(() => error = 'Learner name is required.');
                  return;
                }
                await ref.read(schoolEcsProvider.notifier).updateLearnerProfile(
                      learnerId: learner.id,
                      name: nameCtrl.text,
                      enrollmentStatus: status,
                      parentName: parentCtrl.text,
                      guardianPhone: phoneCtrl.text,
                      internalHealthNote: healthCtrl.text,
                      customFields: customValues,
                    );
                if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
              },
              child: const Text('Save Learner Fields'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openConfigureWidgetsDialog() async {
    await showDialog<void>(
      context: context,
      builder: (dialogCtx) {
        return Consumer(
          builder: (ctx, modalRef, _) {
            final widgets = [...modalRef.watch(schoolEcsProvider).pageWidgets]
              ..sort((a, b) => a.order.compareTo(b.order));
            final notifier = modalRef.read(schoolEcsProvider.notifier);

            return AlertDialog(
              title: const Text('Learner Page Widget Composition'),
              content: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (var i = 0; i < widgets.length; i++)
                        Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Checkbox(
                                value: widgets[i].enabled,
                                onChanged: (_) =>
                                    notifier.togglePageWidgetEnabled(widgets[i].id),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      widgets[i].title,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    Text(
                                      widgets[i].description,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Wrap(
                                  spacing: 4,
                                  runSpacing: 4,
                                  alignment: WrapAlignment.end,
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  children: [
                                    FilterChip(
                                      label: const Text('Teacher', style: TextStyle(fontSize: 11)),
                                      selected: widgets[i].allowedRoles.contains(PortalRole.teacher),
                                      onSelected: (_) => notifier.togglePageWidgetRole(
                                        widgets[i].id,
                                        PortalRole.teacher,
                                      ),
                                    ),
                                    FilterChip(
                                      label: const Text('Parent', style: TextStyle(fontSize: 11)),
                                      selected: widgets[i].allowedRoles.contains(PortalRole.parent),
                                      onSelected: (_) => notifier.togglePageWidgetRole(
                                        widgets[i].id,
                                        PortalRole.parent,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.arrow_upward, size: 16),
                                      onPressed: i == 0
                                          ? null
                                          : () => notifier.movePageWidget(widgets[i].id, -1),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.arrow_downward, size: 16),
                                      onPressed: i == widgets.length - 1
                                          ? null
                                          : () => notifier.movePageWidget(widgets[i].id, 1),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              actions: [
                FilledButton(
                  onPressed: () => Navigator.of(dialogCtx).pop(),
                  child: const Text('Done'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    final role = user?.role ?? PortalRole.admin;
    final ecs = ref.watch(schoolEcsProvider);
    final selectedParentChildId = ref.watch(selectedParentLearnerIdProvider);

    final effectiveLearnerId = role == PortalRole.parent &&
            (user?.linkedLearnerIds.isNotEmpty ?? false)
        ? (user!.linkedLearnerIds.contains(widget.learnerId)
            ? widget.learnerId
            : (selectedParentChildId != null &&
                    user.linkedLearnerIds.contains(selectedParentChildId)
                ? selectedParentChildId
                : user.linkedLearnerIds.first))
        : widget.learnerId;

    final report = LearnerLongitudinalSystem.buildReport(
      ecs,
      effectiveLearnerId,
      role,
      LearnerTimeframe(
        preset: _preset,
        fromDate: _customFrom,
        toDate: _customTo,
      ),
    );
    final activeWidgets = LearnerLongitudinalSystem.getWidgetsForRole(ecs, role);

    if (report == null) {
      return Center(
        child: FilledButton(
          onPressed: () => context.go('/learners'),
          child: const Text('Return to Learners'),
        ),
      );
    }

    final classroom =
        ecs.classrooms.where((c) => c.id == report.learner.classroomId).firstOrNull;
    final teacherId = user?.teacherId ?? ecs.teachers.first.id;
    final learnerFields = ecs.dynamicFields
        .where((f) => f.targetEntityType == EntityType.learner && f.isVisibleTo(role))
        .toList();

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Container(
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
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        OutlinedButton.icon(
                          onPressed: () => context.go('/learners'),
                          icon: const Icon(Icons.arrow_back, size: 15),
                          label: const Text('Back'),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${report.learner.admissionNo} · ${classroom?.name ?? ''} · Registered ${report.learner.registeredAt}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                              Text(
                                report.learner.name,
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Flexible(
                    flex: 0,
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.end,
                      children: [
                        OutlinedButton.icon(
                          onPressed: () => _openExportReportDialog(ecs, report),
                          icon: const Icon(Icons.description_outlined, size: 16),
                          label: const Text('Export Report'),
                        ),
                        if (role == PortalRole.admin) ...[
                          FilledButton.icon(
                            onPressed: () => _openEditLearnerDialog(
                              report.learner,
                              learnerFields.where((f) => !f.archived).toList(),
                              role,
                            ),
                            icon: const Icon(Icons.edit_outlined, size: 16),
                            label: const Text('Edit Learner Fields'),
                          ),
                          OutlinedButton.icon(
                            onPressed: _openConfigureWidgetsDialog,
                            icon: const Icon(Icons.tune, size: 16),
                            label: const Text('Configure Page Widgets'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  const Text(
                    'Time Period:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  ...TimeframePreset.values
                      .where((p) => p != TimeframePreset.custom)
                      .map(
                        (p) => ChoiceChip(
                          label: Text(p.label, style: const TextStyle(fontSize: 12)),
                          selected: _preset == p,
                          onSelected: (_) => setState(() => _preset = p),
                        ),
                      ),
                  ChoiceChip(
                    label: Text(
                      _preset == TimeframePreset.custom &&
                              _customFrom != null &&
                              _customTo != null
                          ? 'Custom ($_customFrom → $_customTo)'
                          : 'Custom Range',
                      style: const TextStyle(fontSize: 12),
                    ),
                    selected: _preset == TimeframePreset.custom,
                    onSelected: (_) => _pickCustomDateRange(report.learner),
                  ),
                  Text(
                    'Showing ${report.fromDate} → ${report.toDate} · ${activeWidgets.length} widgets for ${role.label}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...activeWidgets.map(
          (w) => _buildWidget(context, w.id, ecs, report, role, teacherId, learnerFields),
        ),
      ],
    );
  }

  Widget _buildWidget(
    BuildContext context,
    PageWidgetId widgetId,
    SchoolEcsState ecs,
    LearnerLongitudinalReport report,
    PortalRole role,
    String teacherId,
    List<DynamicFieldDefinition> learnerFields,
  ) {
    final canLog = role == PortalRole.admin || role == PortalRole.teacher;
    final diaryFields = ecs.dynamicFields
        .where((f) => f.targetEntityType == EntityType.diaryEntry && f.isVisibleTo(role))
        .toList();
    final assessFields = ecs.dynamicFields
        .where((f) => f.targetEntityType == EntityType.assessmentEntry && f.isVisibleTo(role))
        .toList();

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: switch (widgetId) {
        PageWidgetId.learnerOverview => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LayoutBuilder(
                builder: (ctx, constraints) {
                  if (constraints.maxWidth >= 560) {
                    return Row(
                      children: [
                        Expanded(child: _kpi('Registered', report.learner.registeredAt)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _kpi(
                            'Avg Assessment',
                            report.averageScore != null ? '${report.averageScore}%' : '—',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _kpi(
                            'Attendance',
                            report.attendanceRate != null ? '${report.attendanceRate}%' : '—',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _kpi(
                            'Awards / Logs',
                            '${report.awardsCount} / ${report.diary.length}',
                          ),
                        ),
                      ],
                    );
                  }
                  return Column(
                    children: [
                      Row(
                        children: [
                          Expanded(child: _kpi('Registered', report.learner.registeredAt)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _kpi(
                              'Avg Assessment',
                              report.averageScore != null ? '${report.averageScore}%' : '—',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _kpi(
                              'Attendance',
                              report.attendanceRate != null ? '${report.attendanceRate}%' : '—',
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _kpi(
                              'Awards / Logs',
                              '${report.awardsCount} / ${report.diary.length}',
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
              DynamicFieldReadout(
                fields: learnerFields,
                values: report.learner.customFields,
                role: role,
              ),
            ],
          ),
        PageWidgetId.learnerTimeline => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  Text(
                    'Unified Longitudinal Timeline (${report.timeline.length} events)',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: ['all', 'assessment', 'diary', 'attendance'].map((cat) {
                      return ChoiceChip(
                        label: Text(cat, style: const TextStyle(fontSize: 11)),
                        selected: _timelineFilter == cat,
                        onSelected: (_) => setState(() => _timelineFilter = cat),
                      );
                    }).toList(),
                  ),
                ],
              ),
              const Divider(height: 20),
              ...report.timeline
                  .where((e) => _timelineFilter == 'all' || e.category == _timelineFilter)
                  .map(
                    (ev) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${ev.date} · ${ev.category.toUpperCase()}',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                ),
                                Text(
                                  ev.title,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  ev.detail,
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Flexible(
                            flex: 0,
                            child: Text(
                              ev.meta,
                              textAlign: TextAlign.end,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
            ],
          ),
        PageWidgetId.learnerAssessments => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Assessment Book & Subject Progression',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                  ),
                  if (canLog) ...[
                    const SizedBox(width: 8),
                    Flexible(
                      flex: 0,
                      child: FilledButton.tonalIcon(
                        onPressed: () => showAssessmentEntryDialog(
                          context: context,
                          ref: ref,
                          role: role,
                          teacherId: teacherId,
                          initialLearnerId: report.learner.id,
                        ),
                        icon: const Icon(Icons.add, size: 15),
                        label: const Text('Record Assessment'),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 10),
              ...LearnerLongitudinalSystem.computeSubjectProgression(
                ecs,
                report.learner.id,
                report.fromDate,
                report.toDate,
              ).map((series) {
                final deltaText = series.delta == 0
                    ? 'Steady'
                    : (series.delta > 0
                        ? '+${series.delta}%'
                        : '${series.delta}%');
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              series.subjectName,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Flexible(
                            flex: 0,
                            child: Text(
                              'Latest ${series.latestScore}% · $deltaText',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: series.delta >= 0
                                    ? const Color(0xFF15803D)
                                    : const Color(0xFFB45309),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...series.points.map(
                        (pt) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 84,
                                child: Text(
                                  pt.date,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: (pt.scorePercent / 100).clamp(0.0, 1.0),
                                    minHeight: 8,
                                    backgroundColor: const Color(0xFFE2E8F0),
                                    color: const Color(0xFF2563EB),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              SizedBox(
                                width: 42,
                                child: Text(
                                  '${pt.scorePercent}%',
                                  textAlign: TextAlign.end,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 4),
              ...report.assessments.map((a) {
                final sub = ecs.substrands.where((s) => s.id == a.substrandId).firstOrNull;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${a.date} · ${sub?.code ?? ''} ${sub?.title ?? ''} · ${a.mastery.label} (${a.scorePercent}%)',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      Text(a.performanceComment, style: const TextStyle(fontSize: 12)),
                      DynamicFieldReadout(fields: assessFields, values: a.customFields, role: role),
                    ],
                  ),
                );
              }),
            ],
          ),
        PageWidgetId.learnerDiary => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'School Diary & Dynamic Awards',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                  ),
                  if (canLog) ...[
                    const SizedBox(width: 8),
                    Flexible(
                      flex: 0,
                      child: OutlinedButton.icon(
                        onPressed: () => showDiaryEntryDialog(
                          context: context,
                          ref: ref,
                          role: role,
                          teacherId: teacherId,
                          initialLearnerId: report.learner.id,
                        ),
                        icon: const Icon(Icons.add, size: 15),
                        label: const Text('Add Diary Entry'),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 10),
              ...report.diary.map(
                (d) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${d.date} · ${d.homeworkSummary}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      if (d.teacherNote.isNotEmpty)
                        Text(d.teacherNote, style: const TextStyle(fontSize: 12)),
                      DynamicFieldReadout(fields: diaryFields, values: d.customFields, role: role),
                    ],
                  ),
                ),
              ),
            ],
          ),
        PageWidgetId.learnerAttendance => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Class Register History',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              ...report.attendance.map(
                (r) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    '${r.date} · ${r.status.label} · ${r.remark.isEmpty ? 'Daily roll' : r.remark}',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ),
            ],
          ),
        PageWidgetId.learnerTimetable => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Weekly Class Timetable',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: ecs.timetableSlots
                    .where((s) => s.classroomId == report.learner.classroomId)
                    .map((slot) {
                  final subj = ecs.subjects.where((s) => s.id == slot.subjectId).firstOrNull;
                  return Chip(
                    label: Text('${slot.day} P${slot.period}: ${subj?.name ?? ''} (${slot.room})'),
                  );
                }).toList(),
              ),
            ],
          ),
        PageWidgetId.learnerEnrollment => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Registration & Confidential Staff Health Note',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                'Guardian: ${report.learner.parentName} · ${report.learner.guardianPhone} (${report.learner.enrollmentStatus})',
              ),
              Text('Staff Note: ${report.learner.internalHealthNote}'),
              DynamicFieldReadout(
                fields: learnerFields,
                values: report.learner.customFields,
                role: role,
              ),
            ],
          ),
      },
    );
  }

  Widget _kpi(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
      ],
    );
  }
}
