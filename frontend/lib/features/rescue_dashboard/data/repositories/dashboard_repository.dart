/// @fileoverview Dashboard repository: HTTP calls + Socket.io subscription.
/// Exposes streams consumed by the DashboardBloc to maintain a reactive
/// connection to the running GeoSentinel backend.
library;

import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/expedition_model.dart';

/// Base URL for the GeoSentinel backend.
/// Update this to your production URL when deploying.
const String _kBaseUrl = 'http://localhost:3000';

/// Provides data access and real-time event streaming for the Rescue Dashboard.
class DashboardRepository {
  late final io.Socket _socket;

  final _emergencyStreamController = StreamController<String>.broadcast();

  /// Stream of expedition IDs that have just become CRITICAL via the backend
  /// Dead Man's Switch. The BLoC listens to this and updates state accordingly.
  Stream<String> get emergencyStream => _emergencyStreamController.stream;

  /// Fetches all active/delayed/critical expeditions from the backend API.
  ///
  /// Returns an empty list if the backend is unreachable.
  Future<List<ExpeditionModel>> fetchExpeditions() async {
    try {
      final response = await http.get(
        Uri.parse('$_kBaseUrl/api/expeditions'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body) as List<dynamic>;
        return body
            .map((e) => ExpeditionModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (_) {
      // Backend may be unreachable — dashboard shows empty state gracefully.
      return [];
    }
  }

  /// Establishes the Socket.io connection and subscribes to emergency events.
  ///
  /// Emits the [expeditionId] to [emergencyStream] when an `EMERGENCY_ALERT`
  /// event is received from the server.
  void connectSocket() {
    _socket = io.io(
      _kBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    _socket.onConnect((_) {
      // ignore: avoid_print
      print('[SOCKET] Connected to GeoSentinel backend.');
    });

    _socket.on('EMERGENCY_ALERT', (data) {
      final payload = data as Map<String, dynamic>;
      final expeditionId = payload['expeditionId'] as String?;
      if (expeditionId != null) {
        _emergencyStreamController.add(expeditionId);
      }
    });

    _socket.onDisconnect((_) {
      // ignore: avoid_print
      print('[SOCKET] Disconnected from backend.');
    });

    _socket.connect();
  }

  /// Closes the Socket.io connection and the internal stream.
  void dispose() {
    _socket.dispose();
    _emergencyStreamController.close();
  }
}
