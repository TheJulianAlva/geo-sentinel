/// @fileoverview The core BLoC for the Rescue Dashboard.
///
/// Orchestrates loading expeditions from the HTTP API and reacting to
/// real-time [EMERGENCY_ALERT] events from the backend Socket.io server.
/// Delegates all data access to [DashboardRepository].
library;

import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/expedition_model.dart';
import '../data/repositories/dashboard_repository.dart';
import 'dashboard_event.dart';
import 'dashboard_state.dart';

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  DashboardBloc({required DashboardRepository repository})
      : _repository = repository,
        super(const DashboardInitial()) {
    on<DashboardStarted>(_onStarted);
    on<DashboardRefreshRequested>(_onRefreshRequested);
    on<DashboardEmergencyReceived>(_onEmergencyReceived);
    on<DashboardAlertDismissed>(_onAlertDismissed);
  }

  final DashboardRepository _repository;
  StreamSubscription<String>? _emergencySubscription;

  /// Loads the initial expedition list and opens the Socket.io connection.
  Future<void> _onStarted(
    DashboardStarted event,
    Emitter<DashboardState> emit,
  ) async {
    emit(const DashboardLoading());

    // 1. Connect to the Socket.io server and listen for emergency events.
    _repository.connectSocket();
    _emergencySubscription = _repository.emergencyStream.listen(
      (expeditionId) => add(DashboardEmergencyReceived(expeditionId: expeditionId)),
    );

    // 2. Fetch the current expedition list from the REST API.
    final expeditions = await _repository.fetchExpeditions();

    emit(DashboardActive(
      expeditions: expeditions,
      isConnected: true,
    ));
  }

  /// Refreshes the expedition list (e.g., on user pull-to-refresh).
  Future<void> _onRefreshRequested(
    DashboardRefreshRequested event,
    Emitter<DashboardState> emit,
  ) async {
    final current = state;
    if (current is! DashboardActive) return;

    final expeditions = await _repository.fetchExpeditions();
    emit(current.copyWith(expeditions: expeditions));
  }

  /// Handles an incoming EMERGENCY_ALERT from the socket.
  /// Finds the affected expedition and surfaces it as [activeEmergency].
  void _onEmergencyReceived(
    DashboardEmergencyReceived event,
    Emitter<DashboardState> emit,
  ) {
    final current = state;
    if (current is! DashboardActive) return;

    // Update the affected expedition's status in the list.
    final updatedList = current.expeditions.map((exp) {
      if (exp.id == event.expeditionId) {
        return exp.copyWith(status: 'critical');
      }
      return exp;
    }).toList();

    // Find the expedition to display as the alert overlay.
    final emergency = updatedList.firstWhere(
      (e) => e.id == event.expeditionId,
      orElse: () => ExpeditionModel(
        id: event.expeditionId,
        userId: '',
        explorerName: 'Explorador',
        expectedEndTime: DateTime.now(),
        status: 'critical',
        createdAt: DateTime.now(),
      ),
    );

    emit(current.copyWith(
      expeditions: updatedList,
      activeEmergency: emergency,
    ));
  }

  /// Dismisses the emergency alert overlay without clearing the critical status.
  void _onAlertDismissed(
    DashboardAlertDismissed event,
    Emitter<DashboardState> emit,
  ) {
    final current = state;
    if (current is! DashboardActive) return;
    emit(current.copyWith(clearEmergency: true));
  }

  @override
  Future<void> close() {
    _emergencySubscription?.cancel();
    _repository.dispose();
    return super.close();
  }
}
