import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/router.dart';
import 'features/auth/data/firebase_auth_repository.dart';
// Run `flutterfire configure` locally to generate firebase_options.dart, then uncomment:
// import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  var firebaseInitialized = false;
  try {
    // Replace with: await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    if (Firebase.apps.isNotEmpty) {
      firebaseInitialized = true;
      FirebaseFirestore.instance.settings = const Settings(
        persistenceEnabled: true,
      );
    }
  } catch (_) {
    firebaseInitialized = false;
  }

  runApp(
    ProviderScope(
      overrides: [
        firebaseReadyProvider.overrideWithValue(firebaseInitialized),
      ],
      child: const ScholaEcsApp(),
    ),
  );
}

class ScholaEcsApp extends ConsumerWidget {
  const ScholaEcsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'ScholaECS — School Platform',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF1D4ED8),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      ),
      routerConfig: router,
    );
  }
}
