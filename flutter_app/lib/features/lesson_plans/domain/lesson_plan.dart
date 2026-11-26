enum LessonStatus {
  planned('planned', 'Planned'),
  inProgress('in_progress', 'In Progress'),
  taught('taught', 'Taught');

  const LessonStatus(this.key, this.label);
  final String key;
  final String label;

  static LessonStatus fromKey(String? raw) {
    return LessonStatus.values.firstWhere(
      (s) => s.key == raw,
      orElse: () => LessonStatus.planned,
    );
  }
}

class LessonPlanEntity {
  const LessonPlanEntity({
    required this.id,
    required this.teacherId,
    required this.classroomId,
    required this.subjectId,
    required this.strandId,
    required this.substrandId,
    this.timetableSlotId,
    required this.title,
    required this.scheduledDate,
    required this.lessonsDelivered,
    required this.status,
    required this.reflectionNote,
  });

  final String id;
  final String teacherId;
  final String classroomId;
  final String subjectId;
  final String strandId;
  final String substrandId;
  final String? timetableSlotId;
  final String title;
  final String scheduledDate;
  final int lessonsDelivered;
  final LessonStatus status;
  final String reflectionNote;

  LessonPlanEntity copyWith({
    LessonStatus? status,
    int? lessonsDelivered,
    String? reflectionNote,
  }) {
    return LessonPlanEntity(
      id: id,
      teacherId: teacherId,
      classroomId: classroomId,
      subjectId: subjectId,
      strandId: strandId,
      substrandId: substrandId,
      timetableSlotId: timetableSlotId,
      title: title,
      scheduledDate: scheduledDate,
      lessonsDelivered: lessonsDelivered ?? this.lessonsDelivered,
      status: status ?? this.status,
      reflectionNote: reflectionNote ?? this.reflectionNote,
    );
  }

  factory LessonPlanEntity.fromMap(String id, Map<String, dynamic> map) {
    return LessonPlanEntity(
      id: id,
      teacherId: map['teacherId'] as String? ?? '',
      classroomId: map['classroomId'] as String? ?? '',
      subjectId: map['subjectId'] as String? ?? '',
      strandId: map['strandId'] as String? ?? '',
      substrandId: map['substrandId'] as String? ?? '',
      timetableSlotId: map['timetableSlotId'] as String?,
      title: map['title'] as String? ?? '',
      scheduledDate: map['scheduledDate'] as String? ?? '',
      lessonsDelivered: (map['lessonsDelivered'] as num?)?.toInt() ?? 0,
      status: LessonStatus.fromKey(map['status'] as String?),
      reflectionNote: map['reflectionNote'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() => {
        'teacherId': teacherId,
        'classroomId': classroomId,
        'subjectId': subjectId,
        'strandId': strandId,
        'substrandId': substrandId,
        'timetableSlotId': timetableSlotId,
        'title': title,
        'scheduledDate': scheduledDate,
        'lessonsDelivered': lessonsDelivered,
        'status': status.key,
        'reflectionNote': reflectionNote,
      };
}
