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
}
