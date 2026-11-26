class TimetableSlotEntity {
  const TimetableSlotEntity({
    required this.id,
    required this.classroomId,
    required this.subjectId,
    required this.teacherId,
    required this.day,
    required this.period,
    required this.timeRange,
    required this.room,
  });

  final String id;
  final String classroomId;
  final String subjectId;
  final String teacherId;
  final String day; // Mon..Fri
  final int period;
  final String timeRange;
  final String room;

  TimetableSlotEntity copyWith({
    String? classroomId,
    String? subjectId,
    String? teacherId,
    String? day,
    int? period,
    String? timeRange,
    String? room,
  }) {
    return TimetableSlotEntity(
      id: id,
      classroomId: classroomId ?? this.classroomId,
      subjectId: subjectId ?? this.subjectId,
      teacherId: teacherId ?? this.teacherId,
      day: day ?? this.day,
      period: period ?? this.period,
      timeRange: timeRange ?? this.timeRange,
      room: room ?? this.room,
    );
  }

  factory TimetableSlotEntity.fromMap(String id, Map<String, dynamic> map) {
    return TimetableSlotEntity(
      id: id,
      classroomId: map['classroomId'] as String? ?? '',
      subjectId: map['subjectId'] as String? ?? '',
      teacherId: map['teacherId'] as String? ?? '',
      day: map['day'] as String? ?? 'Mon',
      period: (map['period'] as num?)?.toInt() ?? 1,
      timeRange: map['timeRange'] as String? ?? '',
      room: map['room'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() => {
        'classroomId': classroomId,
        'subjectId': subjectId,
        'teacherId': teacherId,
        'day': day,
        'period': period,
        'timeRange': timeRange,
        'room': room,
      };
}

class TimetableConflictValidator {
  const TimetableConflictValidator._();

  static String? detectConflict({
    required List<TimetableSlotEntity> existingSlots,
    required TimetableSlotEntity candidate,
    String? ignoreSlotId,
  }) {
    final normalizedRoom = candidate.room.trim().toLowerCase();
    for (final slot in existingSlots) {
      if (ignoreSlotId != null && slot.id == ignoreSlotId) continue;
      if (slot.id == candidate.id) continue;
      if (slot.day != candidate.day || slot.period != candidate.period) continue;

      if (slot.classroomId == candidate.classroomId) {
        return 'Classroom already has a period scheduled on ${candidate.day} P${candidate.period}.';
      }
      if (slot.teacherId == candidate.teacherId) {
        return 'Teacher is already booked on ${candidate.day} P${candidate.period}.';
      }
      if (normalizedRoom.isNotEmpty &&
          slot.room.trim().toLowerCase() == normalizedRoom) {
        return 'Room "${candidate.room.trim()}" is already occupied on ${candidate.day} P${candidate.period}.';
      }
    }
    return null;
  }
}

