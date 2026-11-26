import '../../../core/ecs/school_entity.dart';

class AuthUser {
  const AuthUser({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.role,
    this.teacherId,
    this.linkedLearnerIds = const [],
    this.isDemoMode = false,
  });

  final String uid;
  final String email;
  final String displayName;
  final PortalRole role;
  final String? teacherId;
  final List<String> linkedLearnerIds;
  final bool isDemoMode;

  AuthUser copyWith({
    PortalRole? role,
    String? teacherId,
    List<String>? linkedLearnerIds,
  }) {
    return AuthUser(
      uid: uid,
      email: email,
      displayName: displayName,
      role: role ?? this.role,
      teacherId: teacherId ?? this.teacherId,
      linkedLearnerIds: linkedLearnerIds ?? this.linkedLearnerIds,
      isDemoMode: isDemoMode,
    );
  }
}
