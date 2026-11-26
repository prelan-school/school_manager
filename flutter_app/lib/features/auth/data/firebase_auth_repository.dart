import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/ecs/school_entity.dart';
import '../domain/auth_user.dart';

abstract interface class AuthRepository {
  Stream<AuthUser?> watchSession();
  Future<AuthUser> signInWithEmail(String email, String password);
  Future<AuthUser> registerWithEmail(String email, String password, String displayName);
  Future<AuthUser> signInWithGoogle();
  Future<void> signOut();
}

class FirebaseAuthRepository implements AuthRepository {
  FirebaseAuthRepository(this._auth, this._db);

  final FirebaseAuth _auth;
  final FirebaseFirestore _db;

  @override
  Stream<AuthUser?> watchSession() {
    return _auth.authStateChanges().asyncMap((user) async {
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
    return _resolveUserProfile(cred.user!);
  }

  @override
  Future<AuthUser> registerWithEmail(
    String email,
    String password,
    String displayName,
  ) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await cred.user!.updateDisplayName(displayName.trim());
    await _db.collection('users').doc(cred.user!.uid).set({
      'email': email.trim(),
      'displayName': displayName.trim(),
      'role': PortalRole.parent.key,
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
  Future<void> signOut() async {
    await _auth.signOut();
  }

  Future<void> _ensureUserDocExists(User user) async {
    final ref = _db.collection('users').doc(user.uid);
    final snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        'email': user.email ?? '',
        'displayName': user.displayName ?? 'School User',
        'role': PortalRole.parent.key,
        'linkedLearnerIds': <String>[],
        'createdAt': FieldValue.serverTimestamp(),
      });
    }
  }

  Future<AuthUser> _resolveUserProfile(User user) async {
    final doc = await _db.collection('users').doc(user.uid).get();
    final data = doc.data() ?? <String, dynamic>{};
    return AuthUser(
      uid: user.uid,
      email: user.email ?? '',
      displayName: (data['displayName'] as String?) ?? user.displayName ?? 'User',
      role: PortalRole.fromKey(data['role'] as String?),
      teacherId: data['teacherId'] as String?,
      linkedLearnerIds: List<String>.from(data['linkedLearnerIds'] as List<dynamic>? ?? const []),
    );
  }
}

/// Supports both live Firebase Auth and instant offline/demo portal preview.
final firebaseReadyProvider = Provider<bool>((ref) => false);

final demoSessionProvider = StateProvider<AuthUser?>((ref) {
  return const AuthUser(
    uid: 'demo_admin',
    email: 'admin@scholaecs.edu',
    displayName: 'Principal Demo',
    role: PortalRole.admin,
    teacherId: 'tch_amara',
    linkedLearnerIds: ['lrn_01'],
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
