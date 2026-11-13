class DiaryEntry {
  final String id;
  final String title;
  final String imageData; // Base64 data URL or file path/url
  final double latitude;
  final double longitude;
  final String createdAt; // ISO 8601
  final String? address;

  const DiaryEntry({
    required this.id,
    required this.title,
    required this.imageData,
    required this.latitude,
    required this.longitude,
    required this.createdAt,
    this.address,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'imageData': imageData,
        'latitude': latitude,
        'longitude': longitude,
        'createdAt': createdAt,
        'address': address,
      };

  factory DiaryEntry.fromMap(Map<String, dynamic> map) => DiaryEntry(
        id: map['id'] as String,
        title: map['title'] as String,
        imageData: map['imageData'] as String,
        latitude: (map['latitude'] as num).toDouble(),
        longitude: (map['longitude'] as num).toDouble(),
        createdAt: map['createdAt'] as String,
        address: map['address'] as String?,
      );
}

class LocationDataResult {
  final double latitude;
  final double longitude;
  final double? accuracy;
  final String? address;

  const LocationDataResult({
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.address,
  });
}
