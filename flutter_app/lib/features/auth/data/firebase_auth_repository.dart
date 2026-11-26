import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/ecs/school_entity.dart';
import '../domain/auth_user.dart';

/// Bootstrapped Default Admin email. Override at build time via:
/// `flutter build web --dart-define=DEFAULT_ADMIN_EMAIL=you@school.edu`
const String defaultAdminEmail = String.fromEnvironment(
  'DEFAULT_ADMIN_EMAIL',
  defaultValue: 'prelanadm@gmail.com',
);

bool isDefaultAdminEmail(String? email) {
  if (email == null) return false;
  return email.trim().toLowerCase() == defaultAdminEmail.trim().toLowerCase();
}

/// Resolves the initial or synced Firestore role for an authenticated account.
/// Only a verified default admin email auto-claims `admin`; all other self-signups
/// safely default to `parent` until promoted by an Admin.
PortalRole resolveBootstrapRole({
  required String? email,
  required bool emailVerified,
  PortalRole? existingRole,
}) {
  if (isDefaultAdminEmail(email) && emailVerified) {
    return PortalRole.admin;
  }
  return existingRole ?? PortalRole.parent;
}

abstract interface class AuthRepository {
  Stream<AuthUser?> watchSession();
  Future<AuthUser> signInWithEmail(String email, String password);
  Future<AuthUser> registerWithEmail(String email, String password, String displayName);
  Future<AuthUser> signInWithGoogle();
  Future<void> resendVerificationEmail();
  Future<AuthUser?> reloadCurrentUser();
  Future<void> signOut();
}

class FirebaseAuthRepository implements AuthRepository {
  FirebaseAuthRepository(this._auth, this._db);

  final FirebaseAuth _auth;
  final FirebaseFirestore _db;

  @override
  Stream<AuthUser?> watchSession() {
    return _auth.userChanges().asyncMap((user) async {
      if (user == null) return null;
      return _resolveUserProfile(user);
    });
  }

  @override
  Future<AuthUser> signInWithEmail(String email, String password) async {
    final cred = await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await _ensureUserDocExists(cred.user!);
    return _resolveUserProfile(cred.user!);
  }

  @override
  Future<AuthUser> registerWithEmail(
    String email,
    String password,
    String displayName,
  ) async {
    final normalizedEmail = email.trim();
    final trimmedName = displayName.trim();
    final cred = await _auth.createUserWithEmailAndPassword(
      email: normalizedEmail,
      password: password,
    );
    await cred.user!.updateDisplayName(trimmedName);
    if (!cred.user!.emailVerified) {
      await cred.user!.sendEmailVerification();
    }
    final assignedRole = resolveBootstrapRole(
      email: normalizedEmail,
      emailVerified: cred.user!.emailVerified,
    );
    await _db.collection('users').doc(cred.user!.uid).set({
      'email': normalizedEmail,
      'displayName': trimmedName.isEmpty ? 'School User' : trimmedName,
      'role': assignedRole.key,
      'linkedLearnerIds': <String>[],
      'createdAt': FieldValue.serverTimestamp(),
    });
    return _resolveUserProfile(cred.user!);
  }

  @override
  Future<AuthUser> signInWithGoogle() async {
    if (kIsWeb) {
      final provider = GoogleAuthProvider()
        ..addScope('email')
        ..addScope('profile');
      final cred = await _auth.signInWithPopup(provider);
      await _ensureUserDocExists(cred.user!);
      return _resolveUserProfile(cred.user!);
    }
    final googleUser = await GoogleSignIn().signIn();
    if (googleUser == null) {
      throw FirebaseAuthException(
        code: 'cancelled-by-user',
        message: 'Google Sign-In was cancelled.',
      );
    }
    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    final cred = await _auth.signInWithCredential(credential);
    await _ensureUserDocExists(cred.user!);
    return _resolveUserProfile(cred.user!);
  }

  @override
  Future<void> resendVerificationEmail() async {
    final user = _auth.currentUser;
    if (user != null && !user.emailVerified) {
      await user.sendEmailVerification();
    }
  }

  @override
  Future<AuthUser?> reloadCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) return null;
    await user.reload();
    final refreshed = _auth.currentUser;
    if (refreshed == null) return null;
    return _resolveUserProfile(refreshed);
  }

  @override
  Future<void> signOut() async {
    await _auth.signOut();
  }

  Stream<List<AuthUser>> watchAllUsers() {
    return _db.collection('users').snapshots().map(
          (snap) => snap.docs
              .map((doc) => AuthUser.fromMap(doc.id, doc.data()))
              .toList()
            ..sort((a, b) => a.email.compareTo(b.email)),
        );
  }

  Future<void> updateUserRole({
    required String uid,
    required PortalRole role,
    String? teacherId,
    List<String>? linkedLearnerIds,
  }) async {
    final payload = <String, dynamic>{
      'role': role.key,
      'updatedAt': FieldValue.serverTimestamp(),
    };
    if (teacherId != null) {
      payload['teacherId'] = teacherId.trim().isEmpty ? null : teacherId.trim();
    }
    if (linkedLearnerIds != null) {
      payload['linkedLearnerIds'] = linkedLearnerIds;
    }
    await _db.collection('users').doc(uid).update(payload);
  }

  /// Admin utility to pre-provision or update a staff/guardian record in `/users/{uid}`.
  Future<void> createOrUpdateUserRecord({
    String? uid,
    required String email,
    required String displayName,
    required PortalRole role,
    String? teacherId,
    required List<String> linkedLearnerIds,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    final targetId = (uid != null && uid.trim().isNotEmpty)
        ? uid.trim()
        : 'invited_${normalizedEmail.replaceAll(RegExp(r'[^a-z0-9]+'), '_')}';

    await _db.collection('users').doc(targetId).set(
      {
        'email': normalizedEmail,
        'displayName': displayName.trim(),
        'role': role.key,
        'teacherId': role == PortalRole.parent
            ? null
            : (teacherId?.trim().isEmpty ?? true)
                ? null
                : teacherId!.trim(),
        'linkedLearnerIds': linkedLearnerIds.toSet().toList(),
        'updatedAt': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );
  }

  Future<void> _ensureUserDocExists(User user) async {
    final ref = _db.collection('users').doc(user.uid);
    final snap = await ref.get();
    final initialRole = resolveBootstrapRole(
      email: user.email,
      emailVerified: user.emailVerified,
    );
    if (!snap.exists) {
      await ref.set({
        'email': user.email ?? '',
        'displayName': user.displayName ??
            (initialRole == PortalRole.admin ? 'Default Admin' : 'School User'),
        'role': initialRole.key,
        'linkedLearnerIds': <String>[],
        'createdAt': FieldValue.serverTimestamp(),
      });
    } else {
      final data = snap.data() ?? <String, dynamic>{};
      final existingRole = PortalRole.fromKey(data['role'] as String?);
      if (isDefaultAdminEmail(user.email) &&
          user.emailVerified &&
          existingRole != PortalRole.admin) {
        await ref.update({
          'role': PortalRole.admin.key,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    }
  }

  Future<AuthUser> _resolveUserProfile(User user) async {
    final ref = _db.collection('users').doc(user.uid);
    final doc = await ref.get();
    if (!doc.exists) {
      await _ensureUserDocExists(user);
      final created = await ref.get();
      final createdData = created.data() ?? <String, dynamic>{};
      return AuthUser.fromMap(
        user.uid,
        createdData,
        emailVerified: user.emailVerified,
      );
    }
    final data = doc.data() ?? <String, dynamic>{};
    final existingRole = PortalRole.fromKey(data['role'] as String?);
    final resolvedRole = resolveBootstrapRole(
      email: user.email,
      emailVerified: user.emailVerified,
      existingRole: existingRole,
    );
    if (resolvedRole == PortalRole.admin && existingRole != PortalRole.admin) {
      await ref.update({
        'role': PortalRole.admin.key,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
    return AuthUser(
      uid: user.uid,
      email: user.email ?? '',
      displayName: (data['displayName'] as String?) ?? user.displayName ?? 'User',
      role: resolvedRole,
      teacherId: data['teacherId'] as String?,
      linkedLearnerIds: List<String>.from(data['linkedLearnerIds'] as List<dynamic>? ?? const []),
      emailVerified: user.emailVerified,
    );
  }
}

/// Supports both live Firebase Auth and instant offline/demo portal preview.
final firebaseReadyProvider = Provider<bool>((ref) => false);

final demoSessionProvider = StateProvider<AuthUser?>((ref) {
  return const AuthUser(
    uid: 'demo_admin',
    email: defaultAdminEmail,
    displayName: 'Default Admin',
    role: PortalRole.admin,
    teacherId: 'tch_amara',
    linkedLearnerIds: ['lrn_01'],
    emailVerified: true,
    isDemoMode: true,
  );
});

final currentUserProvider = StreamProvider<AuthUser?>((ref) {
  final firebaseReady = ref.watch(firebaseReadyProvider);
  if (!firebaseReady) {
    return Stream.value(ref.watch(demoSessionProvider));
  }
  return FirebaseAuthRepository(
    FirebaseAuth.instance,
    FirebaseFirestore.instance,
  ).watchSession();
});

final allUsersStreamProvider = StreamProvider<List<AuthUser>>((ref) {
  final firebaseReady = ref.watch(firebaseReadyProvider);
  final user = ref.watch(currentUserProvider).valueOrNull;
  if (!firebaseReady || user?.role != PortalRole.admin) {
    return Stream.value(const [
      AuthUser(
        uid: 'demo_admin',
        email: defaultAdminEmail,
        displayName: 'Default Admin',
        role: PortalRole.admin,
        teacherId: 'tch_amara',
        linkedLearnerIds: ['lrn_01'],
        isDemoMode: true,
      ),
      AuthUser(
        uid: 'demo_teacher',
        email: 'teacher@scholaecs.edu',
        displayName: 'Amara Okafor',
        role: PortalRole.teacher,
        teacherId: 'tch_amara',
        isDemoMode: true,
      ),
      AuthUser(
        uid: 'demo_parent',
        email: 'parent@scholaecs.edu',
        displayName: 'Grace Mwangi',
        role: PortalRole.parent,
        linkedLearnerIds: ['lrn_01', 'lrn_02'],
        isDemoMode: true,
      ),
    ]);
  }
  return FirebaseAuthRepository(
    FirebaseAuth.instance,
    FirebaseFirestore.instance,
  ).watchAllUsers();
});
