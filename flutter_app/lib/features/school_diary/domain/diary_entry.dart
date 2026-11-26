class DiaryEntryEntity {
  const DiaryEntryEntity({
    required this.id,
    required this.learnerId,
    required this.classroomId,
    required this.teacherId,
    required this.date,
    required this.homeworkSummary,
    required this.teacherNote,
    required this.parentAcknowledged,
    this.customFields = const {},
  });

  final String id;
  final String learnerId;
  final String classroomId;
  final String teacherId;
  final String date;
  final String homeworkSummary;
  final String teacherNote;
  final bool parentAcknowledged;
  final Map<String, dynamic> customFields;

  DiaryEntryEntity copyWith({bool? parentAcknowledged}) {
    return DiaryEntryEntity(
      id: id,
      learnerId: learnerId,
      classroomId: classroomId,
      teacherId: teacherId,
      date: date,
      homeworkSummary: homeworkSummary,
      teacherNote: teacherNote,
      parentAcknowledged: parentAcknowledged ?? this.parentAcknowledged,
      customFields: customFields,
    );
  }

  factory DiaryEntryEntity.fromMap(String id, Map<String, dynamic> map) {
    return DiaryEntryEntity(
      id: id,
      learnerId: map['learnerId'] as String? ?? '',
      classroomId: map['classroomId'] as String? ?? '',
      teacherId: map['teacherId'] as String? ?? '',
      date: map['date'] as String? ?? '',
      homeworkSummary: map['homeworkSummary'] as String? ?? '',
      teacherNote: map['teacherNote'] as String? ?? '',
      parentAcknowledged: map['parentAcknowledged'] as bool? ?? false,
      customFields: Map<String, dynamic>.from(
        map['customFields'] as Map<dynamic, dynamic>? ?? const {},
      ),
    );
  }

  Map<String, dynamic> toMap() => {
        'learnerId': learnerId,
        'classroomId': classroomId,
        'teacherId': teacherId,
        'date': date,
        'homeworkSummary': homeworkSummary,
        'teacherNote': teacherNote,
        'parentAcknowledged': parentAcknowledged,
        'customFields': customFields,
      };
}
