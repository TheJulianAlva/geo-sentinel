/// @fileoverview Data model for an expedition returned by the GeoSentinel API.
/// Maps the JSON response from `GET /api/expeditions` into a typed Dart object.
library;

import 'dart:math';
import 'package:equatable/equatable.dart';

/// Possible statuses mirrors the database CHECK constraint.
enum ExpeditionStatus { active, delayed, critical, finished, unknown }

/// A single expedition as returned by the Rescue Dashboard API.
class ExpeditionModel extends Equatable {
  final String id;
  final String userId;
  final String explorerName;
  final DateTime expectedEndTime;
  final String status;
  final DateTime createdAt;

  const ExpeditionModel({
    required this.id,
    required this.userId,
    required this.explorerName,
    required this.expectedEndTime,
    required this.status,
    required this.createdAt,
  });

  /// Parses a JSON map as returned by Supabase (with `profiles` join).
  factory ExpeditionModel.fromJson(Map<String, dynamic> json) {
    final profileMap = json['profiles'] as Map<String, dynamic>?;
    return ExpeditionModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      explorerName: profileMap?['full_name'] as String? ?? 'Explorador Desconocido',
      expectedEndTime: DateTime.parse(json['expected_end_time'] as String).toLocal(),
      status: json['status'] as String? ?? 'active',
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
    );
  }

  /// Returns a copy with an updated [status] (used by BLoC when socket event arrives).
  ExpeditionModel copyWith({String? status}) => ExpeditionModel(
        id: id,
        userId: userId,
        explorerName: explorerName,
        expectedEndTime: expectedEndTime,
        status: status ?? this.status,
        createdAt: createdAt,
      );

  /// Parsed enum for use in UI switch statements.
  ExpeditionStatus get statusEnum {
    switch (status) {
      case 'active':
        return ExpeditionStatus.active;
      case 'delayed':
        return ExpeditionStatus.delayed;
      case 'critical':
        return ExpeditionStatus.critical;
      case 'finished':
        return ExpeditionStatus.finished;
      default:
        return ExpeditionStatus.unknown;
    }
  }

  /// Deterministic demo coordinates derived from the expedition ID hash.
  /// These scatter markers around the Ajusco area for visual demonstration.
  /// Phase 4 will replace this with real PostGIS coordinates.
  (double lat, double lng) get demoCoords {
    final hash = id.hashCode.abs();
    final rng = Random(hash);
    final lat = 19.20 + rng.nextDouble() * 0.15;
    final lng = -99.35 + rng.nextDouble() * 0.15;
    return (lat, lng);
  }

  @override
  List<Object?> get props => [id, status];
}
