enum AttendanceStatus {
  present('present', 'Present'),
  late('late', 'Late'),
  absent('absent', 'Absent'),
  excused('excused', 'Excused');

  const AttendanceStatus(this.key, this.label);
  final String key;
  final String label;

  static AttendanceStatus fromKey(String? raw) {
    return AttendanceStatus.values.firstWhere(
      (s) => s.key == raw,
      orElse: () => AttendanceStatus.present,
    );
  }
}

class AttendanceRecordEntity {
  const AttendanceRecordEntity({
    required this.id,
    required this.learnerId,
    required this.classroomId,
    required this.teacherId,
    required this.date,
    required this.status,
    required this.remark,
    this.customFields = const {},
  });

  final String id;
  final String learnerId;
  final String classroomId;
  final String teacherId;
  final String date;
  final AttendanceStatus status;
  final String remark;
  final Map<String, dynamic> customFields;

  factory AttendanceRecordEntity.fromMap(String id, Map<String, dynamic> map) {
    return AttendanceRecordEntity(
      id: id,
      learnerId: map['learnerId'] as String? ?? '',
      classroomId: map['classroomId'] as String? ?? '',
      teacherId: map['teacherId'] as String? ?? '',
      date: map['date'] as String? ?? '',
      status: AttendanceStatus.fromKey(map['status'] as String?),
      remark: map['remark'] as String? ?? '',
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
        'status': status.key,
        'remark': remark,
        'customFields': customFields,
      };
}
