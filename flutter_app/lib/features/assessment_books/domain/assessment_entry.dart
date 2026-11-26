enum MasteryLevel {
  exceeding('Exceeding'),
  meeting('Meeting'),
  approaching('Approaching'),
  developing('Developing');

  const MasteryLevel(this.label);
  final String label;

  static MasteryLevel fromLabel(String? raw) {
    return MasteryLevel.values.firstWhere(
      (m) => m.label == raw,
      orElse: () => MasteryLevel.meeting,
    );
  }
}

class AssessmentEntryEntity {
  const AssessmentEntryEntity({
    required this.id,
    required this.learnerId,
    required this.subjectId,
    required this.strandId,
    required this.substrandId,
    required this.teacherId,
    required this.date,
    required this.mastery,
    required this.scorePercent,
    required this.performanceComment,
    this.customFields = const {},
  });

  final String id;
  final String learnerId;
  final String subjectId;
  final String strandId; // Pulled by reference from Schemes DB
  final String substrandId; // Pulled by reference from Schemes DB
  final String teacherId;
  final String date;
  final MasteryLevel mastery;
  final int scorePercent;
  final String performanceComment;
  final Map<String, dynamic> customFields;

  factory AssessmentEntryEntity.fromMap(String id, Map<String, dynamic> map) {
    return AssessmentEntryEntity(
      id: id,
      learnerId: map['learnerId'] as String? ?? '',
      subjectId: map['subjectId'] as String? ?? '',
      strandId: map['strandId'] as String? ?? '',
      substrandId: map['substrandId'] as String? ?? '',
      teacherId: map['teacherId'] as String? ?? '',
      date: map['date'] as String? ?? '',
      mastery: MasteryLevel.fromLabel(map['mastery'] as String?),
      scorePercent: (map['scorePercent'] as num?)?.toInt() ?? 0,
      performanceComment: map['performanceComment'] as String? ?? '',
      customFields: Map<String, dynamic>.from(
        map['customFields'] as Map<dynamic, dynamic>? ?? const {},
      ),
    );
  }

  Map<String, dynamic> toMap() => {
        'learnerId': learnerId,
        'subjectId': subjectId,
        'strandId': strandId,
        'substrandId': substrandId,
        'teacherId': teacherId,
        'date': date,
        'mastery': mastery.label,
        'scorePercent': scorePercent,
        'performanceComment': performanceComment,
        'customFields': customFields,
      };
}
