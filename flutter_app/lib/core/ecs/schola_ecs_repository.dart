import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../assessment_books/domain/assessment_entry.dart';
import '../../class_register/domain/attendance_record.dart';
import '../../lesson_plans/domain/lesson_plan.dart';
import '../../schemes/domain/scheme_nodes.dart';
import '../../school_diary/domain/diary_entry.dart';
import 'ecs_seed_data.dart';
import 'school_entity.dart';

class SchoolEcsNotifier extends StateNotifier<SchoolEcsState> {
  SchoolEcsNotifier({
    required this.useFirestore,
    FirebaseFirestore? firestore,
  })  : _db = firestore,
        super(initialSchoolEcsState);

  final bool useFirestore;
  final FirebaseFirestore? _db;

  Future<void> toggleDiaryAcknowledgment(String entryId) async {
    state = state.copyWith(
      diaryEntries: state.diaryEntries
          .map((e) => e.id == entryId ? e.copyWith(parentAcknowledged: !e.parentAcknowledged) : e)
          .toList(),
    );
    if (useFirestore && _db != null) {
      final updated = state.diaryEntries.firstWhere((e) => e.id == entryId);
      await _db.collection('diary_entries').doc(entryId).update({
        'parentAcknowledged': updated.parentAcknowledged,
      });
    }
  }

  Future<void> addDiaryEntry(DiaryEntryEntity entry) async {
    state = state.copyWith(diaryEntries: [entry, ...state.diaryEntries]);
    if (useFirestore && _db != null) {
      await _db.collection('diary_entries').doc(entry.id).set(entry.toMap());
    }
  }

  Future<void> addSchemeStrand(SchemeStrandEntity strand) async {
    state = state.copyWith(strands: [...state.strands, strand]);
    if (useFirestore && _db != null) {
      await _db.collection('scheme_strands').doc(strand.id).set(strand.toMap());
    }
  }

  Future<void> addSchemeSubstrand(SchemeSubstrandEntity substrand) async {
    state = state.copyWith(substrands: [...state.substrands, substrand]);
    if (useFirestore && _db != null) {
      await _db.collection('scheme_substrands').doc(substrand.id).set(substrand.toMap());
    }
  }

  Future<void> addAssessmentEntry(AssessmentEntryEntity entry) async {
    state = state.copyWith(assessments: [entry, ...state.assessments]);
    if (useFirestore && _db != null) {
      await _db.collection('assessment_entries').doc(entry.id).set(entry.toMap());
    }
  }

  Future<void> addLessonPlan(LessonPlanEntity plan) async {
    state = state.copyWith(lessonPlans: [plan, ...state.lessonPlans]);
    if (useFirestore && _db != null) {
      await _db.collection('lesson_plans').doc(plan.id).set(plan.toMap());
    }
  }

  Future<void> updateLessonPlanStatus(
    String planId,
    LessonStatus nextStatus,
    int deliveredCount,
  ) async {
    state = state.copyWith(
      lessonPlans: state.lessonPlans
          .map(
            (lp) => lp.id == planId
                ? lp.copyWith(status: nextStatus, lessonsDelivered: deliveredCount)
                : lp,
          )
          .toList(),
    );
    if (useFirestore && _db != null) {
      await _db.collection('lesson_plans').doc(planId).update({
        'status': nextStatus.key,
        'lessonsDelivered': deliveredCount,
      });
    }
  }

  Future<void> upsertAttendance(AttendanceRecordEntity record) async {
    final exists = state.attendanceRecords.any(
      (r) => r.learnerId == record.learnerId && r.date == record.date,
    );
    final nextList = exists
        ? state.attendanceRecords
            .map((r) => (r.learnerId == record.learnerId && r.date == record.date) ? record : r)
            .toList()
        : [record, ...state.attendanceRecords];
    state = state.copyWith(attendanceRecords: nextList);
    if (useFirestore && _db != null) {
      await _db
          .collection('attendance_records')
          .doc('${record.learnerId}_${record.date}')
          .set(record.toMap());
    }
  }

  Future<void> registerDynamicField(DynamicFieldDefinition field) async {
    state = state.copyWith(dynamicFields: [...state.dynamicFields, field]);
    if (useFirestore && _db != null) {
      await _db.collection('component_schemas').doc(field.id).set(field.toMap());
    }
  }

  Future<void> removeDynamicField(String fieldId) async {
    state = state.copyWith(
      dynamicFields: state.dynamicFields.where((f) => f.id != fieldId).toList(),
    );
    if (useFirestore && _db != null) {
      await _db.collection('component_schemas').doc(fieldId).delete();
    }
  }

  Future<void> togglePageWidgetEnabled(PageWidgetId widgetId) async {
    state = state.copyWith(
      pageWidgets: state.pageWidgets
          .map((w) => w.id == widgetId ? w.copyWith(enabled: !w.enabled) : w)
          .toList(),
    );
    if (useFirestore && _db != null) {
      final w = state.pageWidgets.firstWhere((item) => item.id == widgetId);
      await _db.collection('page_widgets').doc(widgetId.key).set(w.toMap());
    }
  }

  Future<void> togglePageWidgetRole(PageWidgetId widgetId, PortalRole role) async {
    if (role == PortalRole.admin) return;
    state = state.copyWith(
      pageWidgets: state.pageWidgets.map((w) {
        if (w.id != widgetId) return w;
        final roles = w.allowedRoles.contains(role)
            ? w.allowedRoles.where((r) => r != role).toList()
            : [...w.allowedRoles, role];
        return w.copyWith(allowedRoles: roles);
      }).toList(),
    );
    if (useFirestore && _db != null) {
      final w = state.pageWidgets.firstWhere((item) => item.id == widgetId);
      await _db.collection('page_widgets').doc(widgetId.key).set(w.toMap());
    }
  }

  Future<void> movePageWidget(PageWidgetId widgetId, int delta) async {
    final sorted = [...state.pageWidgets]..sort((a, b) => a.order.compareTo(b.order));
    final idx = sorted.indexWhere((w) => w.id == widgetId);
    final swapIdx = idx + delta;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    final temp = sorted[idx];
    sorted[idx] = sorted[swapIdx];
    sorted[swapIdx] = temp;

    final reindexed = [
      for (var i = 0; i < sorted.length; i++) sorted[i].copyWith(order: i + 1),
    ];
    state = state.copyWith(pageWidgets: reindexed);
    if (useFirestore && _db != null) {
      final batch = _db.batch();
      for (final w in reindexed) {
        batch.set(_db.collection('page_widgets').doc(w.id.key), w.toMap());
      }
      await batch.commit();
    }
  }
}
