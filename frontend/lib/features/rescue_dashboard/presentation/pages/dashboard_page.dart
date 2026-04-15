/// @fileoverview Dashboard page — root layout that connects the BLoC to the UI tree.
library;

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/dashboard_bloc.dart';
import '../../bloc/dashboard_event.dart';
import '../../bloc/dashboard_state.dart';
import '../widgets/expeditions_sidebar.dart';
import '../widgets/tactical_map.dart';
import '../widgets/emergency_alert_overlay.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<DashboardBloc, DashboardState>(
        builder: (context, state) {
          return Row(
            children: [
              // Left sidebar — passes current state down
              SizedBox(
                width: 380,
                child: ExpeditionsSidebar(state: state),
              ),

              // Tactical map + emergency overlay stack
              Expanded(
                child: Stack(
                  children: [
                    TacticalMap(state: state),

                    // Overlay: only visible when activeEmergency is set.
                    if (state case DashboardActive(activeEmergency: final emergency)
                        when emergency != null)
                      EmergencyAlertOverlay(expedition: emergency),
                  ],
                ),
              ),
            ],
          );
        },
      ),

      // Floating refresh button
      floatingActionButton: FloatingActionButton(
        mini: true,
        backgroundColor: const Color(0xFF1A1D2D),
        tooltip: 'Recargar expediciones',
        onPressed: () =>
            context.read<DashboardBloc>().add(const DashboardRefreshRequested()),
        child: const Icon(Icons.refresh, color: Color(0xFF3B82F6)),
      ),
    );
  }
}
