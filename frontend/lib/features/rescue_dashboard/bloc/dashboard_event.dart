/// @fileoverview BLoC Events for the Rescue Dashboard.
library;

import 'package:equatable/equatable.dart';

/// Base class for all Dashboard events.
sealed class DashboardEvent extends Equatable {
  const DashboardEvent();

  @override
  List<Object?> get props => [];
}

/// Emitted once when the Dashboard is first displayed.
/// Triggers loading expeditions and connecting to the socket.
final class DashboardStarted extends DashboardEvent {
  const DashboardStarted();
}

/// Emitted periodically or on pull-to-refresh to reload the expedition list.
final class DashboardRefreshRequested extends DashboardEvent {
  const DashboardRefreshRequested();
}

/// Emitted internally by the BLoC when the Socket.io stream delivers
/// an EMERGENCY_ALERT event from the backend Dead Man's Switch.
final class DashboardEmergencyReceived extends DashboardEvent {
  const DashboardEmergencyReceived({required this.expeditionId});

  /// UUID of the expedition that has become CRITICAL.
  final String expeditionId;

  @override
  List<Object?> get props => [expeditionId];
}

/// Emitted when the user dismisses the emergency alert overlay.
final class DashboardAlertDismissed extends DashboardEvent {
  const DashboardAlertDismissed();
}
