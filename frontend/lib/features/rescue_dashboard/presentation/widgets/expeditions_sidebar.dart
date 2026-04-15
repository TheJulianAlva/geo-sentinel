/// @fileoverview Expeditions sidebar widget.
/// Reads state from the DashboardBloc via [DashboardState] and renders
/// the list of active, delayed, and critical expeditions.
library;

import 'package:flutter/material.dart';
import '../../bloc/dashboard_state.dart';
import '../../data/models/expedition_model.dart';
import '../../../../core/theme/dark_theme.dart';

class ExpeditionsSidebar extends StatelessWidget {
  const ExpeditionsSidebar({super.key, required this.state});

  final DashboardState state;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Theme.of(context).colorScheme.surface,
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Row(
              children: [
                Icon(Icons.radar, color: Theme.of(context).primaryColor, size: 28),
                const SizedBox(width: 12),
                const Text(
                  'GeoSentinel',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                // Connection indicator
                if (state case DashboardActive(isConnected: true))
                  Tooltip(
                    message: 'WebSocket conectado',
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: statusSafe,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          const SizedBox(height: 16),

          // Content
          Expanded(
            child: switch (state) {
              DashboardInitial() || DashboardLoading() => const Center(
                  child: CircularProgressIndicator(),
                ),
              DashboardError(:final message) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      'Error: $message',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: statusCritical),
                    ),
                  ),
                ),
              DashboardActive(:final expeditions) when expeditions.isEmpty => const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle_outline, color: statusSafe, size: 40),
                      SizedBox(height: 12),
                      Text(
                        'Sin expediciones activas.\nTodo en calma.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              DashboardActive(:final expeditions) => ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  itemCount: expeditions.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) =>
                      _ExpeditionCard(expedition: expeditions[index]),
                ),
            },
          ),
        ],
      ),
    );
  }
}

/// Card widget for a single expedition in the sidebar list.
class _ExpeditionCard extends StatelessWidget {
  const _ExpeditionCard({required this.expedition});

  final ExpeditionModel expedition;

  @override
  Widget build(BuildContext context) {
    final Color badgeColor;
    final String badgeText;
    final Color borderColor;

    switch (expedition.statusEnum) {
      case ExpeditionStatus.critical:
        badgeColor = statusCritical;
        badgeText = 'CRÍTICO';
        borderColor = statusCritical;
      case ExpeditionStatus.delayed:
        badgeColor = statusDelayed;
        badgeText = 'RETRASADO';
        borderColor = statusDelayed.withOpacity(0.4);
      default:
        badgeColor = statusSafe;
        badgeText = 'EN RUTA';
        borderColor = Colors.white.withOpacity(0.08);
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: expedition.statusEnum == ExpeditionStatus.critical
            ? statusCritical.withOpacity(0.06)
            : Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
        boxShadow: expedition.statusEnum == ExpeditionStatus.critical
            ? [BoxShadow(color: statusCritical.withOpacity(0.2), blurRadius: 12)]
            : [],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  expedition.explorerName,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    color: badgeColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _infoRow('TME', _formatDateTime(expedition.expectedEndTime)),
          _infoRow('Registrado', _formatDateTime(expedition.createdAt)),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(
          children: [
            Text('$label: ', style: const TextStyle(color: Colors.grey, fontSize: 13)),
            Text(value, style: const TextStyle(fontSize: 13)),
          ],
        ),
      );

  String _formatDateTime(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/'
        '${dt.month.toString().padLeft(2, '0')} '
        '${dt.hour.toString().padLeft(2, '0')}:'
        '${dt.minute.toString().padLeft(2, '0')}';
  }
}
