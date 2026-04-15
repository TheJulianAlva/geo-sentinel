import 'package:flutter/material.dart';

const Color _bgDark = Color(0xFF0F111A);
const Color _panelBg = Color(0xFF1A1D2D);
const Color _brandAccent = Color(0xFF3B82F6);
const Color _textPrimary = Color(0xFFF8FAFC);
const Color _textSecondary = Color(0xFF94A3B8);
const Color _borderColor = Color(0xFF2E334D);

// Status Colors
const Color statusCritical = Color(0xFFEF4444);
const Color statusDelayed = Color(0xFFF59E0B);
const Color statusSafe = Color(0xFF10B981);

final ThemeData tacticalDarkTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: _bgDark,
  primaryColor: _brandAccent,
  colorScheme: const ColorScheme.dark(
    primary: _brandAccent,
    surface: _panelBg,
    onSurface: _textPrimary,
  ),
  cardColor: _panelBg,
  dividerColor: _borderColor,
  appBarTheme: const AppBarTheme(
    backgroundColor: _panelBg,
    elevation: 0,
    scrolledUnderElevation: 0,
  ),
  textTheme: const TextTheme(
    bodyLarge: TextStyle(color: _textPrimary, fontFamily: 'Inter'),
    bodyMedium: TextStyle(color: _textPrimary, fontFamily: 'Inter'),
    titleLarge: TextStyle(color: _textPrimary, fontFamily: 'Inter', fontWeight: FontWeight.bold),
    titleMedium: TextStyle(color: _textSecondary, fontFamily: 'Inter', fontWeight: FontWeight.w500),
  ),
);
