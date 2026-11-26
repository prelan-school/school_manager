import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/assessment_books/domain/assessment_entry.dart';
import '../../features/auth/domain/auth_user.dart';
import '../../features/class_register/domain/attendance_record.dart';
import '../../features/learners/domain/learner.dart';
import '../../features/lesson_plans/domain/lesson_plan.dart';
import '../../features/schemes/domain/scheme_nodes.dart';
import '../../features/school_diary/domain/diary_entry.dart';
import '../../features/timetable/domain/timetable_slot.dart';
import 'ecs_seed_data.dart';
import 'school_entity.dart';

class SchoolEcsNotifier extends StateNotifier<SchoolEcsState> {
  SchoolEcsNotifier({
    required this.useFirestore,
    FirebaseFirestore? firestore,
    AuthUser? currentUser,
  })  : _db = firestore,
        super(initialSchoolEcsState) {
    if (useFirestore && _db != null && currentUser != null) {
      _startFirestoreSubscriptions(currentUser);
    }
  }

  final bool useFirestore;
  final FirebaseFirestore? _db;
  final List<StreamSubscription<dynamic>> _subscriptions = [];

  void _startFirestoreSubscriptions(AuthUser user) {
    final db = _db;
    if (db == null) return;
    _cancelSubscriptions();

    void handleSyncError(Object err) {
      state = state.copyWith(syncError: err.toString());
    }

    _subscriptions.add(
      db.collection('subjects').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          state = state.copyWith(
            subjects: snap.docs
                .map((d) => SubjectEntity.fromMap(d.id, d.data()))
                .toList(),
            isLiveSynced: true,
          );
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('classrooms').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          state = state.copyWith(
            classrooms: snap.docs
                .map((d) => ClassroomEntity.fromMap(d.id, d.data()))
                .toList(),
            isLiveSynced: true,
          );
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('teachers').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          state = state.copyWith(
            teachers: snap.docs
                .map((d) => TeacherEntity.fromMap(d.id, d.data()))
                .toList(),
            isLiveSynced: true,
          );
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('component_schemas').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          state = state.copyWith(
            dynamicFields: snap.docs
                .map((d) => DynamicFieldDefinition.fromMap(d.id, d.data()))
                .toList(),
            isLiveSynced: true,
          );
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('page_widgets').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          final widgets = snap.docs
              .map((d) => PageWidgetDefinition.fromMap(d.id, d.data()))
              .toList()
            ..sort((a, b) => a.order.compareTo(b.order));
          state = state.copyWith(pageWidgets: widgets, isLiveSynced: true);
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('scheme_strands').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          state = state.copyWith(
            strands: snap.docs
                .map((d) => SchemeStrandEntity.fromMap(d.id, d.data()))
                .toList(),
            isLiveSynced: true,
          );
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('scheme_substrands').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          state = state.copyWith(
            substrands: snap.docs
                .map((d) => SchemeSubstrandEntity.fromMap(d.id, d.data()))
                .toList(),
            isLiveSynced: true,
          );
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('timetable_slots').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          state = state.copyWith(
            timetableSlots: snap.docs
                .map((d) => TimetableSlotEntity.fromMap(d.id, d.data()))
                .toList(),
            isLiveSynced: true,
          );
        },
        onError: handleSyncError,
      ),
    );

    if (user.role == PortalRole.parent) {
      final scopedIds = user.linkedLearnerIds.take(10).toList();
      if (scopedIds.isEmpty) {
        state = state.copyWith(
          learners: const [],
          diaryEntries: const [],
          assessments: const [],
          attendanceRecords: const [],
          lessonPlans: const [],
          isLiveSynced: true,
        );
        return;
      }

      _subscriptions.add(
        db
            .collection('learners')
            .where(FieldPath.documentId, whereIn: scopedIds)
            .snapshots()
            .listen(
          (snap) {
            state = state.copyWith(
              learners: snap.docs
                  .map((d) => LearnerEntity.fromMap(d.id, d.data()))
                  .toList(),
              lessonPlans: const [],
              isLiveSynced: true,
            );
          },
          onError: handleSyncError,
        ),
      );

      _subscriptions.add(
        db
            .collection('diary_entries')
            .where('learnerId', whereIn: scopedIds)
            .snapshots()
            .listen(
          (snap) {
            final entries = snap.docs
                .map((d) => DiaryEntryEntity.fromMap(d.id, d.data()))
                .toList()
              ..sort((a, b) => b.date.compareTo(a.date));
            state = state.copyWith(diaryEntries: entries, isLiveSynced: true);
          },
          onError: handleSyncError,
        ),
      );

      _subscriptions.add(
        db
            .collection('assessment_entries')
            .where('learnerId', whereIn: scopedIds)
            .snapshots()
            .listen(
          (snap) {
            final items = snap.docs
                .map((d) => AssessmentEntryEntity.fromMap(d.id, d.data()))
                .toList()
              ..sort((a, b) => b.date.compareTo(a.date));
            state = state.copyWith(assessments: items, isLiveSynced: true);
          },
          onError: handleSyncError,
        ),
      );

      _subscriptions.add(
        db
            .collection('attendance_records')
            .where('learnerId', whereIn: scopedIds)
            .snapshots()
            .listen(
          (snap) {
            final items = snap.docs
                .map((d) => AttendanceRecordEntity.fromMap(d.id, d.data()))
                .toList()
              ..sort((a, b) => b.date.compareTo(a.date));
            state = state.copyWith(
              attendanceRecords: items,
              isLiveSynced: true,
            );
          },
          onError: handleSyncError,
        ),
      );
      return;
    }

    // Staff (Admin / Teacher) school-wide live collection subscriptions
    _subscriptions.add(
      db.collection('learners').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          state = state.copyWith(
            learners: snap.docs
                .map((d) => LearnerEntity.fromMap(d.id, d.data()))
                .toList(),
            isLiveSynced: true,
          );
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('diary_entries').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          final entries = snap.docs
              .map((d) => DiaryEntryEntity.fromMap(d.id, d.data()))
              .toList()
            ..sort((a, b) => b.date.compareTo(a.date));
          state = state.copyWith(diaryEntries: entries, isLiveSynced: true);
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('assessment_entries').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          final items = snap.docs
              .map((d) => AssessmentEntryEntity.fromMap(d.id, d.data()))
              .toList()
            ..sort((a, b) => b.date.compareTo(a.date));
          state = state.copyWith(assessments: items, isLiveSynced: true);
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('lesson_plans').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          final plans = snap.docs
              .map((d) => LessonPlanEntity.fromMap(d.id, d.data()))
              .toList()
            ..sort((a, b) => b.scheduledDate.compareTo(a.scheduledDate));
          state = state.copyWith(lessonPlans: plans, isLiveSynced: true);
        },
        onError: handleSyncError,
      ),
    );

    _subscriptions.add(
      db.collection('attendance_records').snapshots().listen(
        (snap) {
          if (snap.docs.isEmpty) return;
          final items = snap.docs
              .map((d) => AttendanceRecordEntity.fromMap(d.id, d.data()))
              .toList()
            ..sort((a, b) => b.date.compareTo(a.date));
          state = state.copyWith(
            attendanceRecords: items,
            isLiveSynced: true,
          );
        },
        onError: handleSyncError,
      ),
    );
  }

  void _cancelSubscriptions() {
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    _subscriptions.clear();
  }

  @override
  void dispose() {
    _cancelSubscriptions();
    super.dispose();
  }

  /// Idempotent one-click Admin seed script writing initial demo data to Firestore.
  Future<int> seedFirestoreDemoData() async {
    final seed = initialSchoolEcsState;
    if (!useFirestore || _db == null) {
      state = seed;
      return 0;
    }

    final batch = _db.batch();
    var count = 0;

    for (final s in seed.subjects) {
      batch.set(_db.collection('subjects').doc(s.id), s.toMap());
      count++;
    }
    for (final c in seed.classrooms) {
      batch.set(_db.collection('classrooms').doc(c.id), c.toMap());
      count++;
    }
    for (final t in seed.teachers) {
      batch.set(_db.collection('teachers').doc(t.id), t.toMap());
      count++;
    }
    for (final l in seed.learners) {
      batch.set(_db.collection('learners').doc(l.id), l.toMap());
      count++;
    }
    for (final f in seed.dynamicFields) {
      batch.set(_db.collection('component_schemas').doc(f.id), f.toMap());
      count++;
    }
    for (final w in seed.pageWidgets) {
      batch.set(_db.collection('page_widgets').doc(w.id.key), w.toMap());
      count++;
    }
    for (final str in seed.strands) {
      batch.set(_db.collection('scheme_strands').doc(str.id), str.toMap());
      count++;
    }
    for (final sub in seed.substrands) {
      batch.set(_db.collection('scheme_substrands').doc(sub.id), sub.toMap());
      count++;
    }
    for (final d in seed.diaryEntries) {
      batch.set(_db.collection('diary_entries').doc(d.id), d.toMap());
      count++;
    }
    for (final a in seed.assessments) {
      batch.set(_db.collection('assessment_entries').doc(a.id), a.toMap());
      count++;
    }
    for (final lp in seed.lessonPlans) {
      batch.set(_db.collection('lesson_plans').doc(lp.id), lp.toMap());
      count++;
    }
    for (final tt in seed.timetableSlots) {
      batch.set(_db.collection('timetable_slots').doc(tt.id), tt.toMap());
      count++;
    }
    for (final att in seed.attendanceRecords) {
      batch.set(
        _db.collection('attendance_records').doc('${att.learnerId}_${att.date}'),
        att.toMap(),
      );
      count++;
    }

    await batch.commit();
    return count;
  }

  Future<void> toggleDiaryAcknowledgment(String entryId) async {
    state = state.copyWith(
      diaryEntries: state.diaryEntries
          .map((e) => e.id == entryId
              ? e.copyWith(parentAcknowledged: !e.parentAcknowledged)
              : e)
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

  /// Broadcasts one homework/note payload across every learner in a classroom.
  Future<int> broadcastClassroomDiary({
    required String classroomId,
    required String teacherId,
    required String date,
    required String homeworkSummary,
    required String teacherNote,
    required Map<String, dynamic> customFields,
  }) async {
    final learners =
        state.learners.where((l) => l.classroomId == classroomId).toList();
    if (learners.isEmpty) return 0;

    final stamp = DateTime.now().millisecondsSinceEpoch;
    final generated = [
      for (var i = 0; i < learners.length; i++)
        DiaryEntryEntity(
          id: 'dry_${stamp}_$i',
          learnerId: learners[i].id,
          classroomId: learners[i].classroomId,
          teacherId: teacherId,
          date: date,
          homeworkSummary: homeworkSummary.trim(),
          teacherNote: teacherNote.trim(),
          parentAcknowledged: false,
          customFields: Map<String, dynamic>.from(customFields),
        ),
    ];

    state = state.copyWith(diaryEntries: [...generated, ...state.diaryEntries]);
    if (useFirestore && _db != null) {
      final batch = _db.batch();
      for (final entry in generated) {
        batch.set(_db.collection('diary_entries').doc(entry.id), entry.toMap());
      }
      await batch.commit();
    }
    return generated.length;
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
      await _db
          .collection('scheme_substrands')
          .doc(substrand.id)
          .set(substrand.toMap());
    }
  }

  Future<void> addAssessmentEntry(AssessmentEntryEntity entry) async {
    state = state.copyWith(assessments: [entry, ...state.assessments]);
    if (useFirestore && _db != null) {
      await _db
          .collection('assessment_entries')
          .doc(entry.id)
          .set(entry.toMap());
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
                ? lp.copyWith(
                    status: nextStatus,
                    lessonsDelivered: deliveredCount,
                  )
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
            .map((r) =>
                (r.learnerId == record.learnerId && r.date == record.date)
                    ? record
                    : r)
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

  /// Marks every learner in [classroomId] present for [date] in one batch.
  Future<int> markClassroomAllPresent({
    required String classroomId,
    required String teacherId,
    required String date,
  }) async {
    final learners =
        state.learners.where((l) => l.classroomId == classroomId).toList();
    if (learners.isEmpty) return 0;

    final records = [...state.attendanceRecords];
    final updatedRecords = <AttendanceRecordEntity>[];
    for (final learner in learners) {
      final idx = records.indexWhere(
        (r) => r.learnerId == learner.id && r.date == date,
      );
      final existing = idx >= 0 ? records[idx] : null;
      final rec = AttendanceRecordEntity(
        id: existing?.id ?? 'att_${learner.id}_$date',
        learnerId: learner.id,
        classroomId: learner.classroomId,
        teacherId: teacherId,
        date: date,
        status: AttendanceStatus.present,
        remark: (existing?.remark.isNotEmpty ?? false)
            ? existing!.remark
            : 'Batch roll call: Present.',
        customFields: Map<String, dynamic>.from(
          existing?.customFields ?? const {'uniform_compliant': true},
        ),
      );
      if (idx >= 0) {
        records[idx] = rec;
      } else {
        records.insert(0, rec);
      }
      updatedRecords.add(rec);
    }

    state = state.copyWith(attendanceRecords: records);
    if (useFirestore && _db != null) {
      final batch = _db.batch();
      for (final rec in updatedRecords) {
        batch.set(
          _db.collection('attendance_records').doc('${rec.learnerId}_${rec.date}'),
          rec.toMap(),
        );
      }
      await batch.commit();
    }
    return updatedRecords.length;
  }

  /// Validates against classroom/teacher/room double-booking before saving.
  Future<String?> upsertTimetableSlot(
    TimetableSlotEntity slot, {
    String? ignoreSlotId,
  }) async {
    if (slot.room.trim().isEmpty || slot.timeRange.trim().isEmpty) {
      return 'Time range and room code are required.';
    }
    final conflict = TimetableConflictValidator.detectConflict(
      existingSlots: state.timetableSlots,
      candidate: slot,
      ignoreSlotId: ignoreSlotId,
    );
    if (conflict != null) {
      return conflict;
    }

    final exists = state.timetableSlots.any((s) => s.id == slot.id);
    final nextSlots = exists
        ? state.timetableSlots.map((s) => s.id == slot.id ? slot : s).toList()
        : [...state.timetableSlots, slot];

    state = state.copyWith(timetableSlots: nextSlots);
    if (useFirestore && _db != null) {
      await _db.collection('timetable_slots').doc(slot.id).set(slot.toMap());
    }
    return null;
  }

  Future<void> registerDynamicField(DynamicFieldDefinition field) async {
    state = state.copyWith(dynamicFields: [...state.dynamicFields, field]);
    if (useFirestore && _db != null) {
      await _db.collection('component_schemas').doc(field.id).set(field.toMap());
    }
  }

  Future<void> updateDynamicField(DynamicFieldDefinition updated) async {
    final ensuredVisible = updated.visibleTo.contains(PortalRole.admin)
        ? updated.visibleTo
        : [PortalRole.admin, ...updated.visibleTo];
    final ensuredEditable = updated.editableBy.contains(PortalRole.admin)
        ? updated.editableBy
        : [PortalRole.admin, ...updated.editableBy];
    final normalized = updated.copyWith(
      visibleTo: ensuredVisible,
      editableBy: ensuredEditable,
    );

    state = state.copyWith(
      dynamicFields: state.dynamicFields
          .map((f) => f.id == normalized.id ? normalized : f)
          .toList(),
    );
    if (useFirestore && _db != null) {
      await _db
          .collection('component_schemas')
          .doc(normalized.id)
          .set(normalized.toMap());
    }
  }

  /// Safe soft-archive: keeps historical records able to render old field labels.
  Future<void> archiveDynamicField(String fieldId) async {
    state = state.copyWith(
      dynamicFields: state.dynamicFields
          .map((f) => f.id == fieldId ? f.copyWith(archived: true) : f)
          .toList(),
    );
    if (useFirestore && _db != null) {
      await _db
          .collection('component_schemas')
          .doc(fieldId)
          .update({'archived': true});
    }
  }

  Future<void> restoreDynamicField(String fieldId) async {
    state = state.copyWith(
      dynamicFields: state.dynamicFields
          .map((f) => f.id == fieldId ? f.copyWith(archived: false) : f)
          .toList(),
    );
    if (useFirestore && _db != null) {
      await _db
          .collection('component_schemas')
          .doc(fieldId)
          .update({'archived': false});
    }
  }

  Future<void> removeDynamicField(String fieldId) async {
    await archiveDynamicField(fieldId);
  }

  Future<void> updateLearnerProfile({
    required String learnerId,
    required String name,
    required String enrollmentStatus,
    required String parentName,
    required String guardianPhone,
    required String internalHealthNote,
    required Map<String, dynamic> customFields,
  }) async {
    state = state.copyWith(
      learners: state.learners.map((l) {
        if (l.id != learnerId) return l;
        return l.copyWith(
          name: name.trim(),
          enrollmentStatus: enrollmentStatus,
          parentName: parentName.trim(),
          guardianPhone: guardianPhone.trim(),
          internalHealthNote: internalHealthNote.trim(),
          customFields: Map<String, dynamic>.from(customFields),
        );
      }).toList(),
    );
    if (useFirestore && _db != null) {
      await _db.collection('learners').doc(learnerId).update({
        'name': name.trim(),
        'enrollmentStatus': enrollmentStatus,
        'parentName': parentName.trim(),
        'guardianPhone': guardianPhone.trim(),
        'internalHealthNote': internalHealthNote.trim(),
        'customFields': customFields,
      });
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

  Future<void> togglePageWidgetRole(
    PageWidgetId widgetId,
    PortalRole role,
  ) async {
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
    final sorted = [...state.pageWidgets]
      ..sort((a, b) => a.order.compareTo(b.order));
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
