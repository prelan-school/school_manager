enum PortalRole {
  admin('admin', 'Admin Side'),
  teacher('teacher', 'Teacher Side'),
  parent('parent', 'Parent Portal');

  const PortalRole(this.key, this.label);
  final String key;
  final String label;

  static PortalRole fromKey(String? raw) {
    return PortalRole.values.firstWhere(
      (r) => r.key == raw,
      orElse: () => PortalRole.parent,
    );
  }
}

enum EntityType {
  learner('learner'),
  diaryEntry('diary_entry'),
  schemeStrand('scheme_strand'),
  schemeSubstrand('scheme_substrand'),
  assessmentEntry('assessment_entry'),
  lessonPlan('lesson_plan'),
  timetableSlot('timetable_slot'),
  attendanceRecord('attendance_record');

  const EntityType(this.key);
  final String key;

  static EntityType fromKey(String raw) {
    return EntityType.values.firstWhere(
      (e) => e.key == raw,
      orElse: () => EntityType.diaryEntry,
    );
  }
}

enum DynamicFieldType {
  text('text'),
  number('number'),
  boolean('boolean'),
  select('select'),
  date('date');

  const DynamicFieldType(this.key);
  final String key;

  static DynamicFieldType fromKey(String? raw) {
    return DynamicFieldType.values.firstWhere(
      (t) => t.key == raw,
      orElse: () => DynamicFieldType.text,
    );
  }
}

class DynamicFieldDefinition {
  const DynamicFieldDefinition({
    required this.id,
    required this.targetEntityType,
    required this.key,
    required this.label,
    required this.fieldType,
    this.options = const [],
    this.required = false,
    required this.visibleTo,
    required this.editableBy,
    required this.description,
  });

  final String id;
  final EntityType targetEntityType;
  final String key;
  final String label;
  final DynamicFieldType fieldType;
  final List<String> options;
  final bool required;
  final List<PortalRole> visibleTo;
  final List<PortalRole> editableBy;
  final String description;

  bool isVisibleTo(PortalRole role) => visibleTo.contains(role);
  bool isEditableBy(PortalRole role) => editableBy.contains(role);

  factory DynamicFieldDefinition.fromMap(String id, Map<String, dynamic> map) {
    return DynamicFieldDefinition(
      id: id,
      targetEntityType: EntityType.fromKey(map['targetEntityType'] as String? ?? ''),
      key: map['key'] as String? ?? '',
      label: map['label'] as String? ?? '',
      fieldType: DynamicFieldType.fromKey(map['fieldType'] as String?),
      options: List<String>.from(map['options'] as List<dynamic>? ?? const []),
      required: map['required'] as bool? ?? false,
      visibleTo: (map['visibleTo'] as List<dynamic>? ?? const ['admin'])
          .map((e) => PortalRole.fromKey(e as String?))
          .toList(),
      editableBy: (map['editableBy'] as List<dynamic>? ?? const ['admin'])
          .map((e) => PortalRole.fromKey(e as String?))
          .toList(),
      description: map['description'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() => {
        'targetEntityType': targetEntityType.key,
        'key': key,
        'label': label,
        'fieldType': fieldType.key,
        'options': options,
        'required': required,
        'visibleTo': visibleTo.map((r) => r.key).toList(),
        'editableBy': editableBy.map((r) => r.key).toList(),
        'description': description,
      };
}

enum PageWidgetId {
  learnerOverview('learner_overview'),
  learnerTimeline('learner_timeline'),
  learnerAssessments('learner_assessments'),
  learnerDiary('learner_diary'),
  learnerAttendance('learner_attendance'),
  learnerTimetable('learner_timetable'),
  learnerEnrollment('learner_enrollment');

  const PageWidgetId(this.key);
  final String key;

  static PageWidgetId fromKey(String? raw) {
    return PageWidgetId.values.firstWhere(
      (w) => w.key == raw,
      orElse: () => PageWidgetId.learnerOverview,
    );
  }
}

class PageWidgetDefinition {
  const PageWidgetDefinition({
    required this.id,
    required this.pageId,
    required this.title,
    required this.description,
    required this.allowedRoles,
    required this.order,
    required this.enabled,
  });

  final PageWidgetId id;
  final String pageId;
  final String title;
  final String description;
  final List<PortalRole> allowedRoles;
  final int order;
  final bool enabled;

  PageWidgetDefinition copyWith({
    List<PortalRole>? allowedRoles,
    int? order,
    bool? enabled,
  }) {
    return PageWidgetDefinition(
      id: id,
      pageId: pageId,
      title: title,
      description: description,
      allowedRoles: allowedRoles ?? this.allowedRoles,
      order: order ?? this.order,
      enabled: enabled ?? this.enabled,
    );
  }

  factory PageWidgetDefinition.fromMap(String id, Map<String, dynamic> map) {
    return PageWidgetDefinition(
      id: PageWidgetId.fromKey(id),
      pageId: map['pageId'] as String? ?? 'learner_profile',
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      allowedRoles: (map['allowedRoles'] as List<dynamic>? ?? const ['admin'])
          .map((r) => PortalRole.fromKey(r as String?))
          .toList(),
      order: (map['order'] as num?)?.toInt() ?? 0,
      enabled: map['enabled'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toMap() => {
        'pageId': pageId,
        'title': title,
        'description': description,
        'allowedRoles': allowedRoles.map((r) => r.key).toList(),
        'order': order,
        'enabled': enabled,
      };
}

class SubjectEntity {
  const SubjectEntity({
    required this.id,
    required this.code,
    required this.name,
  });

  final String id;
  final String code;
  final String name;
}

class ClassroomEntity {
  const ClassroomEntity({
    required this.id,
    required this.name,
    required this.gradeLevel,
  });

  final String id;
  final String name;
  final String gradeLevel;
}

class TeacherEntity {
  const TeacherEntity({
    required this.id,
    required this.name,
    required this.email,
    required this.subjectIds,
  });

  final String id;
  final String name;
  final String email;
  final List<String> subjectIds;
}

String slugifyFieldKey(String label) {
  return label
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
      .replaceAll(RegExp(r'^_+|_+$'), '');
}

extension IterableFirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
