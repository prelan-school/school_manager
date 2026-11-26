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
      setState(() => _error = 'Configure Firebase via flutterfire configure to use live Auth, or choose a Demo Portal below.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = FirebaseAuthRepository(
        FirebaseAuth.instance,
        FirebaseFirestore.instance,
      );
      if (_isRegister) {
        await repo.registerWithEmail(
          _emailCtrl.text,
          _passwordCtrl.text,
          _nameCtrl.text,
        );
      } else {
        await repo.signInWithEmail(_emailCtrl.text, _passwordCtrl.text);
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
      setState(() => _error = 'Configure Firebase first, or enter via a Demo Portal below.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
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
      email: '${role.key}@scholaecs.edu',
      displayName: switch (role) {
        PortalRole.admin => 'Admin Demo',
        PortalRole.teacher => 'Amara Okafor',
        PortalRole.parent => 'Grace Mwangi',
      },
      role: role,
      teacherId: 'tch_amara',
      linkedLearnerIds: const ['lrn_01'],
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
            constraints: const BoxConstraints(maxWidth: 420),
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
                        ? 'Create a parent or staff account'
                        : 'Sign in with Email/Password or Google',
                    style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                  ),
                  const SizedBox(height: 20),
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
