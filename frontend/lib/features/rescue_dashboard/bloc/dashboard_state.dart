/// @fileoverview BLoC States for the Rescue Dashboard.
library;

import 'package:equatable/equatable.dart';
import '../data/models/expedition_model.dart';

/// Base class for all Dashboard states.
sealed class DashboardState extends Equatable {
  const DashboardState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been loaded.
final class DashboardInitial extends DashboardState {
  const DashboardInitial();
}

/// Data is currently being fetched from the backend.
final class DashboardLoading extends DashboardState {
  const DashboardLoading();
}

/// Active state carrying the expedition list and optional emergency alert.
final class DashboardActive extends DashboardState {
  const DashboardActive({
    required this.expeditions,
    this.activeEmergency,
    this.isConnected = false,
  });

  /// List of non-finished expeditions from the backend.
  final List<ExpeditionModel> expeditions;

  /// The expedition currently triggering an emergency alert, if any.
  final ExpeditionModel? activeEmergency;

  /// Whether the Socket.io connection is established.
  final bool isConnected;

  DashboardActive copyWith({
    List<ExpeditionModel>? expeditions,
    ExpeditionModel? activeEmergency,
    bool clearEmergency = false,
    bool? isConnected,
  }) {
    return DashboardActive(
      expeditions: expeditions ?? this.expeditions,
      activeEmergency: clearEmergency ? null : (activeEmergency ?? this.activeEmergency),
      isConnected: isConnected ?? this.isConnected,
    );
  }

  @override
  List<Object?> get props => [expeditions, activeEmergency, isConnected];
}

/// Failed to load expeditions.
final class DashboardError extends DashboardState {
  const DashboardError({required this.message});

  final String message;

  @override
  List<Object?> get props => [message];
}
