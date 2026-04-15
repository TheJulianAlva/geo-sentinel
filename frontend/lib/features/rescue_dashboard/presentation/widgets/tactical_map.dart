/// @fileoverview Tactical map widget backed by flutter_map + OpenStreetMap.
/// Renders color-coded markers for each expedition based on its current status.
/// Positions are deterministic demo coordinates until Phase 4 introduces real GPS.
library;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../bloc/dashboard_state.dart';
import '../../data/models/expedition_model.dart';
import '../../../../core/theme/dark_theme.dart';

class TacticalMap extends StatelessWidget {
  const TacticalMap({super.key, required this.state});

  final DashboardState state;

  @override
  Widget build(BuildContext context) {
    final expeditions = switch (state) {
      DashboardActive(:final expeditions) => expeditions,
      _ => <ExpeditionModel>[],
    };

    return FlutterMap(
      options: const MapOptions(
        initialCenter: LatLng(19.2564, -99.3106),
        initialZoom: 12.0,
      ),
      children: [
        // Dark-filtered OpenStreetMap tile layer.
        ColorFiltered(
          colorFilter: const ColorFilter.matrix([
            -1, 0, 0, 0, 255,
            0, -1, 0, 0, 255,
            0, 0, -1, 0, 255,
            0, 0, 0, 1, 0,
          ]),
          child: TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'com.geosentinel.app',
          ),
        ),

        // Markers built from current expedition state.
        MarkerLayer(
          markers: expeditions.map((exp) {
            final (lat, lng) = exp.demoCoords;
            final color = switch (exp.statusEnum) {
              ExpeditionStatus.critical => statusCritical,
              ExpeditionStatus.delayed => statusDelayed,
              _ => statusSafe,
            };

            return Marker(
              point: LatLng(lat, lng),
              width: 24,
              height: 24,
              child: Tooltip(
                message: exp.explorerName,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 500),
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: color.withOpacity(
                          exp.statusEnum == ExpeditionStatus.critical ? 0.7 : 0.4,
                        ),
                        blurRadius:
                            exp.statusEnum == ExpeditionStatus.critical ? 16 : 8,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
