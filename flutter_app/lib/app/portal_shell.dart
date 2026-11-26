import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/ecs/ecs_providers.dart';
import '../core/ecs/school_entity.dart';
import '../features/auth/data/firebase_auth_repository.dart';
import '../features/auth/domain/auth_user.dart';

class _NavItem {
  const _NavItem({
    required this.path,
    required this.label,
    required this.icon,
    required this.roles,
  });

  final String path;
  final String label;
  final IconData icon;
  final List<PortalRole> roles;
}

const _navItems = [
  _NavItem(
    path: '/learners',
    label: 'Learners',
    icon: Icons.people_outline,
    roles: [PortalRole.admin, PortalRole.teacher, PortalRole.parent],
  ),
  _NavItem(
    path: '/diary',
    label: 'School Diary',
    icon: Icons.book_outlined,
    roles: [PortalRole.admin, PortalRole.teacher, PortalRole.parent],
  ),
  _NavItem(
    path: '/schemes',
    label: 'Schemes DB',
    icon: Icons.account_tree_outlined,
    roles: [PortalRole.admin, PortalRole.teacher],
  ),
  _NavItem(
    path: '/assessments',
    label: 'Assessment Books',
    icon: Icons.grading_outlined,
    roles: [PortalRole.admin, PortalRole.teacher, PortalRole.parent],
  ),
  _NavItem(
    path: '/lessons',
    label: 'Lesson Plans',
    icon: Icons.edit_calendar_outlined,
    roles: [PortalRole.admin, PortalRole.teacher],
  ),
  _NavItem(
    path: '/timetable',
    label: 'Timetable',
    icon: Icons.schedule_outlined,
    roles: [PortalRole.admin, PortalRole.teacher, PortalRole.parent],
  ),
  _NavItem(
    path: '/register',
    label: 'Class Register',
    icon: Icons.fact_check_outlined,
    roles: [PortalRole.admin, PortalRole.teacher, PortalRole.parent],
  ),
  _NavItem(
    path: '/coverage',
    label: 'Admin Coverage',
    icon: Icons.analytics_outlined,
    roles: [PortalRole.admin],
  ),
  _NavItem(
    path: '/schema',
    label: 'Schema Studio',
    icon: Icons.tune_outlined,
    roles: [PortalRole.admin],
  ),
];

class PortalShell extends ConsumerWidget {
  const PortalShell({
    super.key,
    required this.currentPath,
    required this.child,
  });

  final String currentPath;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    final firebaseReady = ref.watch(firebaseReadyProvider);
    final ecsState = ref.watch(schoolEcsProvider);
    final selectedParentChildId = ref.watch(selectedParentLearnerIdProvider);
    final role = user?.role ?? PortalRole.admin;
    final items = _navItems.where((i) => i.roles.contains(role)).toList();
    final selectedIdx = items.indexWhere((i) => currentPath.startsWith(i.path));
    final isWide = MediaQuery.sizeOf(context).width >= 900;
    final needsAdminVerification = firebaseReady &&
        user != null &&
        isDefaultAdminEmail(user.email) &&
        !user.emailVerified;

    final parentChildren = role == PortalRole.parent
        ? ecsState.learners
            .where((l) =>
                user == null ||
                user.linkedLearnerIds.isEmpty ||
                user.linkedLearnerIds.contains(l.id))
            .toList()
        : const [];
    final activeChildId = parentChildren.any((l) => l.id == selectedParentChildId)
        ? selectedParentChildId
        : (parentChildren.isNotEmpty ? parentChildren.first.id : null);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Text(
          'ScholaECS',
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        actions: [
          if (role == PortalRole.parent && parentChildren.length > 1)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 180),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    isExpanded: true,
                    value: activeChildId,
                    items: parentChildren
                        .map(
                          (l) => DropdownMenuItem<String>(
                            value: l.id,
                            child: Text(
                              'Child: ${l.name}',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (nextId) {
                      if (nextId == null) return;
                      ref.read(selectedParentLearnerIdProvider.notifier).state =
                          nextId;
                      if (currentPath.startsWith('/learners/')) {
                        context.go('/learners/$nextId');
                      }
                    },
                  ),
                ),
              ),
            ),
          if (user?.isDemoMode ?? false)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<PortalRole>(
                  value: role,
                  items: PortalRole.values
                      .map(
                        (r) => DropdownMenuItem(
                          value: r,
                          child: Text(r.label, style: const TextStyle(fontSize: 13)),
                        ),
                      )
                      .toList(),
                  onChanged: (nextRole) {
                    if (nextRole == null) return;
                    ref.read(demoSessionProvider.notifier).state = AuthUser(
                      uid: 'demo_${nextRole.key}',
                      email: nextRole == PortalRole.admin
                          ? defaultAdminEmail
                          : '${nextRole.key}@scholaecs.edu',
                      displayName: nextRole == PortalRole.admin
                          ? 'Default Admin'
                          : nextRole.label,
                      role: nextRole,
                      teacherId: 'tch_amara',
                      linkedLearnerIds: nextRole == PortalRole.parent
                          ? const ['lrn_01', 'lrn_02']
                          : const ['lrn_01'],
                      emailVerified: true,
                      isDemoMode: true,
                    );
                  },
                ),
              ),
            ),
          TextButton.icon(
            onPressed: () => context.go('/login'),
            icon: const Icon(Icons.logout, size: 16),
            label: const Text('Account'),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Row(
        children: [
          if (isWide)
            NavigationRail(
              backgroundColor: Colors.white,
              extended: MediaQuery.sizeOf(context).width >= 1200,
              selectedIndex: selectedIdx < 0 ? 0 : selectedIdx,
              onDestinationSelected: (idx) => context.go(items[idx].path),
              destinations: items
                  .map(
                    (i) => NavigationRailDestination(
                      icon: Icon(i.icon),
                      label: Text(i.label),
                    ),
                  )
                  .toList(),
            ),
          Expanded(
            child: Column(
              children: [
                if (needsAdminVerification)
                  Container(
                    width: double.infinity,
                    color: const Color(0xFFFEF3C7),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    child: Wrap(
                      spacing: 10,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          'Verify ${user.email} to activate Default Admin ("admin") permissions.',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF92400E),
                          ),
                        ),
                        OutlinedButton(
                          onPressed: () async {
                            await FirebaseAuthRepository(
                              FirebaseAuth.instance,
                              FirebaseFirestore.instance,
                            ).resendVerificationEmail();
                          },
                          child: const Text('Resend Email', style: TextStyle(fontSize: 12)),
                        ),
                        FilledButton(
                          onPressed: () async {
                            await FirebaseAuthRepository(
                              FirebaseAuth.instance,
                              FirebaseFirestore.instance,
                            ).reloadCurrentUser();
                          },
                          child: const Text("I've Verified", style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: isWide
          ? null
          : NavigationBar(
              selectedIndex: selectedIdx < 0 ? 0 : selectedIdx.clamp(0, 4),
              onDestinationSelected: (idx) => context.go(items[idx].path),
              destinations: items
                  .take(5)
                  .map(
                    (i) => NavigationDestination(
                      icon: Icon(i.icon),
                      label: i.label,
                    ),
                  )
                  .toList(),
            ),
    );
  }
}
