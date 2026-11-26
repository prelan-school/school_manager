import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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
    roles: [PortalRole.admin, PortalRole.teacher],
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
    final role = user?.role ?? PortalRole.admin;
    final items = _navItems.where((i) => i.roles.contains(role)).toList();
    final selectedIdx = items.indexWhere((i) => currentPath.startsWith(i.path));
    final isWide = MediaQuery.sizeOf(context).width >= 900;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Text(
          'ScholaECS',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        actions: [
          if (user?.isDemoMode ?? false)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: DropdownButton<PortalRole>(
                value: role,
                underline: const SizedBox.shrink(),
                items: PortalRole.values
                    .map((r) => DropdownMenuItem(value: r, child: Text(r.label)))
                    .toList(),
                onChanged: (nextRole) {
                  if (nextRole == null) return;
                  ref.read(demoSessionProvider.notifier).state = AuthUser(
                    uid: 'demo_${nextRole.key}',
                    email: '${nextRole.key}@scholaecs.edu',
                    displayName: nextRole.label,
                    role: nextRole,
                    teacherId: 'tch_amara',
                    linkedLearnerIds: const ['lrn_01'],
                    isDemoMode: true,
                  );
                },
              ),
            ),
          TextButton.icon(
            onPressed: () => context.go('/login'),
            icon: const Icon(Icons.logout, size: 16),
            label: const Text('Account'),
          ),
          const SizedBox(width: 8),
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
          Expanded(child: child),
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
