class LearnerEntity {
  const LearnerEntity({
    required this.id,
    required this.name,
    required this.admissionNo,
    required this.classroomId,
    required this.parentName,
    required this.parentEmail,
    required this.guardianPhone,
    required this.registeredAt,
    required this.enrollmentStatus,
    required this.internalHealthNote,
    this.customFields = const {},
  });

  final String id;
  final String name;
  final String admissionNo;
  final String classroomId;
  final String parentName;
  final String parentEmail;
  final String guardianPhone;
  final String registeredAt; // YYYY-MM-DD
  final String enrollmentStatus;
  final String internalHealthNote;
  final Map<String, dynamic> customFields;

  LearnerEntity copyWith({
    String? name,
    String? enrollmentStatus,
    String? parentName,
    String? guardianPhone,
    String? internalHealthNote,
    Map<String, dynamic>? customFields,
  }) {
    return LearnerEntity(
      id: id,
      name: name ?? this.name,
      admissionNo: admissionNo,
      classroomId: classroomId,
      parentName: parentName ?? this.parentName,
      parentEmail: parentEmail,
      guardianPhone: guardianPhone ?? this.guardianPhone,
      registeredAt: registeredAt,
      enrollmentStatus: enrollmentStatus ?? this.enrollmentStatus,
      internalHealthNote: internalHealthNote ?? this.internalHealthNote,
      customFields: customFields ?? this.customFields,
    );
  }

  factory LearnerEntity.fromMap(String id, Map<String, dynamic> map) {
    return LearnerEntity(
      id: id,
      name: map['name'] as String? ?? '',
      admissionNo: map['admissionNo'] as String? ?? '',
      classroomId: map['classroomId'] as String? ?? '',
      parentName: map['parentName'] as String? ?? '',
      parentEmail: map['parentEmail'] as String? ?? '',
      guardianPhone: map['guardianPhone'] as String? ?? '',
      registeredAt: map['registeredAt'] as String? ?? '2025-09-01',
      enrollmentStatus: map['enrollmentStatus'] as String? ?? 'Active',
      internalHealthNote: map['internalHealthNote'] as String? ?? '',
      customFields: Map<String, dynamic>.from(
        map['customFields'] as Map<dynamic, dynamic>? ?? const {},
      ),
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'admissionNo': admissionNo,
        'classroomId': classroomId,
        'parentName': parentName,
        'parentEmail': parentEmail,
        'guardianPhone': guardianPhone,
        'registeredAt': registeredAt,
        'enrollmentStatus': enrollmentStatus,
        'internalHealthNote': internalHealthNote,
        'customFields': customFields,
      };
}

enum TimeframePreset {
  sinceRegistration('Since Registration'),
  thisTerm('This Term'),
  last30Days('Last 30 Days'),
  custom('Custom Range');

  const TimeframePreset(this.label);
  final String label;
}

class LearnerTimeframe {
  const LearnerTimeframe({
    required this.preset,
    this.fromDate,
    this.toDate,
  });

  final TimeframePreset preset;
  final String? fromDate;
  final String? toDate;
}

class LearnerTimelineEvent {
  const LearnerTimelineEvent({
    required this.id,
    required this.date,
    required this.category,
    required this.title,
    required this.detail,
    required this.meta,
  });

  final String id;
  final String date;
  final String category; // diary | assessment | attendance
  final String title;
  final String detail;
  final String meta;
}
