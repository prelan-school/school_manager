class SchemeStrandEntity {
  const SchemeStrandEntity({
    required this.id,
    required this.subjectId,
    required this.code,
    required this.title,
    required this.term,
    required this.createdByTeacherId,
  });

  final String id;
  final String subjectId;
  final String code;
  final String title;
  final String term;
  final String createdByTeacherId;

  factory SchemeStrandEntity.fromMap(String id, Map<String, dynamic> map) {
    return SchemeStrandEntity(
      id: id,
      subjectId: map['subjectId'] as String? ?? '',
      code: map['code'] as String? ?? '',
      title: map['title'] as String? ?? '',
      term: map['term'] as String? ?? 'Term 1',
      createdByTeacherId: map['createdByTeacherId'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() => {
        'subjectId': subjectId,
        'code': code,
        'title': title,
        'term': term,
        'createdByTeacherId': createdByTeacherId,
      };
}

class SchemeSubstrandEntity {
  const SchemeSubstrandEntity({
    required this.id,
    required this.strandId,
    required this.subjectId,
    required this.code,
    required this.title,
    required this.learningOutcome,
    required this.targetLessons,
  });

  final String id;
  final String strandId;
  final String subjectId;
  final String code;
  final String title;
  final String learningOutcome;
  final int targetLessons;

  factory SchemeSubstrandEntity.fromMap(String id, Map<String, dynamic> map) {
    return SchemeSubstrandEntity(
      id: id,
      strandId: map['strandId'] as String? ?? '',
      subjectId: map['subjectId'] as String? ?? '',
      code: map['code'] as String? ?? '',
      title: map['title'] as String? ?? '',
      learningOutcome: map['learningOutcome'] as String? ?? '',
      targetLessons: (map['targetLessons'] as num?)?.toInt() ?? 4,
    );
  }

  Map<String, dynamic> toMap() => {
        'strandId': strandId,
        'subjectId': subjectId,
        'code': code,
        'title': title,
        'learningOutcome': learningOutcome,
        'targetLessons': targetLessons,
      };
}
