import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/ecs/school_entity.dart';
import '../data/firebase_auth_repository.dart';
import '../domain/auth_user.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _isRegister = false;
  bool _loading = false;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitEmail() async {
    final firebaseReady = ref.read(firebaseReadyProvider);
    if (!firebaseReady) {
      setState(
        () => _error =
            'Configure Firebase via flutterfire configure to use live Auth, or choose a Demo Portal below.',
      );
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final repo = FirebaseAuthRepository(
        FirebaseAuth.instance,
        FirebaseFirestore.instance,
      );
      final user = _isRegister
          ? await repo.registerWithEmail(
              _emailCtrl.text,
              _passwordCtrl.text,
              _nameCtrl.text,
            )
          : await repo.signInWithEmail(_emailCtrl.text, _passwordCtrl.text);
      if (isDefaultAdminEmail(user.email) && !user.emailVerified) {
        if (mounted) {
          setState(
            () => _info =
                'Verification email sent to ${user.email}. Verify your email first to activate your "admin" role, then continue.',
          );
        }
        return;
      }
      if (mounted) context.go('/learners');
    } on FirebaseAuthException catch (e) {
      setState(() => _error = e.message ?? 'Authentication failed.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitGoogle() async {
    final firebaseReady = ref.read(firebaseReadyProvider);
    if (!firebaseReady) {
      setState(
        () => _error =
            'Configure Firebase first, or enter via a Demo Portal below.',
      );
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final repo = FirebaseAuthRepository(
        FirebaseAuth.instance,
        FirebaseFirestore.instance,
      );
      await repo.signInWithGoogle();
      if (mounted) context.go('/learners');
    } on FirebaseAuthException catch (e) {
      setState(() => _error = e.message ?? 'Google Sign-In failed.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _enterDemo(PortalRole role) {
    ref.read(demoSessionProvider.notifier).state = AuthUser(
      uid: 'demo_${role.key}',
      email: switch (role) {
        PortalRole.admin => defaultAdminEmail,
        PortalRole.teacher => 'teacher@scholaecs.edu',
        PortalRole.parent => 'parent@scholaecs.edu',
      },
      displayName: switch (role) {
        PortalRole.admin => 'Default Admin',
        PortalRole.teacher => 'Amara Okafor',
        PortalRole.parent => 'Grace Mwangi',
      },
      role: role,
      teacherId: 'tch_amara',
      linkedLearnerIds: const ['lrn_01'],
      emailVerified: true,
      isDemoMode: true,
    );
    context.go('/learners');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'ScholaECS',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _isRegister
                        ? 'Create an account with Email/Password'
                        : 'Sign in with Email/Password or Google',
                    style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Default Admin Account (role: "admin")',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E3A8A),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign in via Google or register & verify $defaultAdminEmail to automatically claim the "admin" role. Other accounts default to "parent".',
                          style: TextStyle(fontSize: 11, color: Color(0xFF1E40AF)),
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: OutlinedButton(
                            onPressed: () {
                              setState(() {
                                _emailCtrl.text = defaultAdminEmail;
                              });
                            },
                            style: OutlinedButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                            ),
                            child: const Text(
                              'Use $defaultAdminEmail',
                              style: TextStyle(fontSize: 11),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  if (_isRegister) ...[
                    TextField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  TextField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email Address',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _passwordCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      _error!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFFDC2626),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                  if (_info != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _info!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF065F46),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextButton(
                            onPressed: () => context.go('/learners'),
                            child: const Text('Continue to Portal'),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _loading ? null : _submitEmail,
                    child: Text(_isRegister ? 'Create Account' : 'Sign In'),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: _loading ? null : _submitGoogle,
                    icon: const Icon(Icons.account_circle_outlined, size: 18),
                    label: const Text('Continue with Google'),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => setState(() => _isRegister = !_isRegister),
                    child: Text(
                      _isRegister
                          ? 'Already have an account? Sign In'
                          : 'Need an account? Register',
                    ),
                  ),
                  const Divider(height: 28),
                  const Text(
                    'Quick Role Preview (Offline / Pre-Firebase)',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: PortalRole.values
                        .map(
                          (role) => ActionChip(
                            label: Text(role.label),
                            onPressed: () => _enterDemo(role),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
