import '../../../core/ecs/school_entity.dart';

class AuthUser {
  const AuthUser({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.role,
    this.teacherId,
    this.linkedLearnerIds = const [],
    this.emailVerified = true,
    this.isDemoMode = false,
  });

  final String uid;
  final String email;
  final String displayName;
  final PortalRole role;
  final String? teacherId;
  final List<String> linkedLearnerIds;
  final bool emailVerified;
  final bool isDemoMode;

  factory AuthUser.fromMap(String uid, Map<String, dynamic> map, {bool emailVerified = true}) {
    return AuthUser(
      uid: uid,
      email: map['email'] as String? ?? '',
      displayName: map['displayName'] as String? ?? 'School User',
      role: PortalRole.fromKey(map['role'] as String?),
      teacherId: map['teacherId'] as String?,
      linkedLearnerIds: List<String>.from(map['linkedLearnerIds'] as List<dynamic>? ?? const []),
      emailVerified: emailVerified,
    );
  }

  AuthUser copyWith({
    PortalRole? role,
    String? teacherId,
    List<String>? linkedLearnerIds,
    bool? emailVerified,
  }) {
    return AuthUser(
      uid: uid,
      email: email,
      displayName: displayName,
      role: role ?? this.role,
      teacherId: teacherId ?? this.teacherId,
      linkedLearnerIds: linkedLearnerIds ?? this.linkedLearnerIds,
      emailVerified: emailVerified ?? this.emailVerified,
      isDemoMode: isDemoMode,
    );
  }
}
