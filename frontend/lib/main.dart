import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'features/rescue_dashboard/bloc/dashboard_bloc.dart';
import 'features/rescue_dashboard/bloc/dashboard_event.dart';
import 'features/rescue_dashboard/data/repositories/dashboard_repository.dart';
import 'features/rescue_dashboard/presentation/pages/dashboard_page.dart';
import 'core/theme/dark_theme.dart';

void main() {
  runApp(const GeoSentinelApp());
}

class GeoSentinelApp extends StatelessWidget {
  const GeoSentinelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GeoSentinel Rescue Dashboard',
      theme: tacticalDarkTheme,
      debugShowCheckedModeBanner: false,
      home: BlocProvider(
        create: (_) => DashboardBloc(repository: DashboardRepository())
          ..add(const DashboardStarted()),
        child: const DashboardPage(),
      ),
    );
  }
}
