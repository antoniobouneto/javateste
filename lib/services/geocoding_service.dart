import 'dart:convert';
import 'package:http/http.dart' as http;

class GeocodingService {
  static Future<String?> reverseGeocode(double lat, double lng) async {
    try {
      final uri = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lng&format=json');
      final resp = await http.get(uri, headers: {
        'User-Agent': 'GeoDiario-App',
        'Accept': 'application/json',
      }).timeout(const Duration(seconds: 8));
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        return data['display_name'] as String?;
      }
    } catch (_) {}
    return null;
  }
}
