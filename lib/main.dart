import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'models/diary_entry.dart';
import 'services/geocoding_service.dart';
import 'services/storage_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GeoDiarioApp());
}

class GeoDiarioApp extends StatelessWidget {
  const GeoDiarioApp({super.key});
  @override
  Widget build(BuildContext context) {
    const seed = Color(0xFF047857);
    return MaterialApp(
      title: 'GeoDiÃ¡rio',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: seed), useMaterial3: true, scaffoldBackgroundColor: const Color(0xFFF5F5F4)),
      home: const HomeScreen(),
    );
  }
}

enum AppView { list, map, form, detail }

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<DiaryEntry> entries = [];
  bool loading = true;
  AppView view = AppView.list;
  DiaryEntry? selectedEntry;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => loading = true);
    final data = await StorageService.getAllEntries();
    if (!mounted) return;
    setState(() { entries = data; loading = false; });
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating));
  }

  String _fmtDate(String iso) {
    try { return DateFormat("dd/MM/yyyy 'Ã s' HH:mm").format(DateTime.parse(iso).toLocal()); }
    catch (_) { return iso; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF065F46), foregroundColor: Colors.white,
        title: Row(children: [
          const Icon(Icons.camera_alt, size: 22), const SizedBox(width: 8),
          const Text('GeoDiÃ¡rio', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: const Color(0xFF064E3B), borderRadius: BorderRadius.circular(12)),
            child: Text('${entries.length} ${entries.length == 1 ? 'registro' : 'registros'}',
              style: const TextStyle(fontSize: 11, color: Color(0xFFA7F3D0))),
          ),
        ]),
        actions: [
          IconButton(icon: Icon(Icons.list, color: view != AppView.map ? Colors.white : Colors.white70),
            onPressed: () => setState(() { view = AppView.list; selectedEntry = null; })),
          IconButton(icon: Icon(Icons.map, color: view == AppView.map ? Colors.white : Colors.white70),
            onPressed: () => setState(() { view = AppView.map; selectedEntry = null; })),
        ],
      ),
      body: loading ? const Center(child: CircularProgressIndicator()) : _body(),
      floatingActionButton: view == AppView.list ? FloatingActionButton.extended(
        onPressed: () => setState(() => view = AppView.form),
        backgroundColor: const Color(0xFF047857), foregroundColor: Colors.white,
        icon: const Icon(Icons.camera_alt), label: const Text('Novo registro'),
      ) : null,
    );
  }

  Widget _body() {
    switch (view) {
      case AppView.form:
        return EntryFormScreen(
          onBack: () => setState(() => view = AppView.list),
          onSaved: (e) { setState(() { entries = [e, ...entries]; selectedEntry = e; view = AppView.detail; }); _toast('Registro salvo com sucesso!'); },
        );
      case AppView.detail:
        return EntryDetailScreen(entry: selectedEntry!, fmtDate: _fmtDate,
          onBack: () => setState(() => view = AppView.list),
          onDeleted: (id) { setState(() { entries.removeWhere((x) => x.id == id); selectedEntry = null; view = AppView.list; }); _toast('Registro excluÃ­do com sucesso.'); });
      case AppView.map:
        return MapScreen(entries: entries, onSelect: (e) => setState(() { selectedEntry = e; view = AppView.detail; }));
      case AppView.list:
        return EntriesListScreen(entries: entries, fmtDate: _fmtDate,
          onSelect: (e) => setState(() { selectedEntry = e; view = AppView.detail; }),
          onNew: () => setState(() => view = AppView.form));
    }
  }
}

Widget entryImage(String data, {BoxFit fit = BoxFit.cover}) {
  if (data.startsWith('http://') || data.startsWith('https://')) {
    return Image.network(data, fit: fit, errorBuilder: (_, __, ___) => const Icon(Icons.broken_image));
  }
  if (data.startsWith('data:')) {
    try { return Image.memory(base64Decode(data.split(',').last), fit: fit); } catch (_) {}
  }
  try { final f = File(data); if (f.existsSync()) return Image.file(f, fit: fit); } catch (_) {}
  try { return Image.memory(base64Decode(data), fit: fit); } catch (_) {}
  return const Icon(Icons.image_not_supported);
}

class EntriesListScreen extends StatefulWidget {
  final List<DiaryEntry> entries; final String Function(String) fmtDate;
  final void Function(DiaryEntry) onSelect; final VoidCallback onNew;
  const EntriesListScreen({super.key, required this.entries, required this.fmtDate, required this.onSelect, required this.onNew});
  @override State<EntriesListScreen> createState() => _EntriesListScreenState();
}
class _EntriesListScreenState extends State<EntriesListScreen> {
  String search = '';
  @override Widget build(BuildContext context) {
    if (widget.entries.isEmpty) {
      return Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 80, height: 80, decoration: BoxDecoration(color: const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(24)),
          child: const Icon(Icons.camera_alt, size: 40, color: Color(0xFF047857))),
        const SizedBox(height: 16), const Text('Nenhum registro ainda', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8), const Text('Toque em "Novo registro" para fotografar um momento e salvar com data, hora e localizaÃ§Ã£o.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54)),
        const SizedBox(height: 16),
        FilledButton.icon(onPressed: widget.onNew, icon: const Icon(Icons.add), label: const Text('Criar primeiro registro'), style: FilledButton.styleFrom(backgroundColor: const Color(0xFF047857))),
      ])));
    }
    final filtered = widget.entries.where((e) {
      if (search.trim().isEmpty) return true; final t = search.toLowerCase();
      return e.title.toLowerCase().contains(t) || (e.address ?? '').toLowerCase().contains(t);
    }).toList();
    return ListView(padding: const EdgeInsets.fromLTRB(16,16,16,100), children: [
      TextField(decoration: InputDecoration(hintText: 'Buscar por tÃ­tulo ou endereÃ§o...', prefixIcon: const Icon(Icons.search), filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
        onChanged: (v) => setState(() => search = v)),
      const SizedBox(height: 12),
      if (filtered.isEmpty) ...[
        Center(child: Text('Nenhum registro encontrado para "$search".')), TextButton(onPressed: () => setState(()=>search=''), child: const Text('Limpar busca'))
      ] else ...filtered.map((e) => Card(
        margin: const EdgeInsets.only(bottom: 10), clipBehavior: Clip.antiAlias, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: InkWell(onTap: () => widget.onSelect(e), child: Row(children: [
          SizedBox(width: 110, height: 110, child: entryImage(e.imageData)),
          Expanded(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(e.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Row(children: [const Icon(Icons.calendar_today, size: 12, color: Colors.grey), const SizedBox(width: 4), Expanded(child: Text(widget.fmtDate(e.createdAt), style: const TextStyle(fontSize: 11, color: Colors.grey)))]),
            const SizedBox(height: 6),
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(8)),
              child: Text('ðŸ“ ${e.latitude.toStringAsFixed(4)}, ${e.longitude.toStringAsFixed(4)}', style: const TextStyle(fontSize: 10, color: Color(0xFF047857)))),
          ]))),
          const Padding(padding: EdgeInsets.only(right: 8), child: Icon(Icons.chevron_right, color: Colors.grey)),
        ])),
      )),
    ]);
  }
}

class EntryDetailScreen extends StatefulWidget {
  final DiaryEntry entry; final String Function(String) fmtDate; final VoidCallback onBack; final void Function(String) onDeleted;
  const EntryDetailScreen({super.key, required this.entry, required this.fmtDate, required this.onBack, required this.onDeleted});
  @override State<EntryDetailScreen> createState() => _EntryDetailScreenState();
}
class _EntryDetailScreenState extends State<EntryDetailScreen> {
  bool deleting = false;
  Future<void> _confirmDelete() async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Excluir registro?'),
      content: const Text('A foto e as informaÃ§Ãµes deste registro serÃ£o removidas permanentemente do dispositivo.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
        FilledButton(style: FilledButton.styleFrom(backgroundColor: Colors.red), onPressed: () => Navigator.pop(ctx, true), child: const Text('Excluir')),
      ]));
    if (ok == true) { setState(()=>deleting=true); await StorageService.deleteEntry(widget.entry.id); widget.onDeleted(widget.entry.id); }
  }
  @override Widget build(BuildContext context) {
    final e = widget.entry;
    final gUrl = Uri.parse('https://www.google.com/maps?q=${e.latitude},${e.longitude}');
    final oUrl = Uri.parse('https://www.openstreetmap.org/?mlat=${e.latitude}&mlon=${e.longitude}#map=16/${e.latitude}/${e.longitude}');
    return ListView(padding: const EdgeInsets.all(16), children: [
      Row(children: [
        OutlinedButton.icon(onPressed: widget.onBack, icon: const Icon(Icons.arrow_back), label: const Text('Voltar')),
        const Spacer(),
        IconButton(icon: const Icon(Icons.share), onPressed: () => Share.share('Registro GeoDiÃ¡rio: ${e.title} (${e.latitude}, ${e.longitude})')),
        IconButton(icon: deleting ? const SizedBox(width:18,height:18,child:CircularProgressIndicator(strokeWidth:2)) : const Icon(Icons.delete,color:Colors.red), onPressed: deleting?null:_confirmDelete),
      ]),
      const SizedBox(height: 12),
      ClipRRect(borderRadius: BorderRadius.circular(16), child: AspectRatio(aspectRatio: 4/3, child: entryImage(e.imageData))),
      const SizedBox(height: 16),
      Text(e.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
      if (e.address != null) Padding(padding: const EdgeInsets.only(top:4), child: Row(children:[const Icon(Icons.place,size:14,color:Color(0xFF047857)), const SizedBox(width:4), Expanded(child: Text(e.address!, style: const TextStyle(color: Colors.black54)))])),
      const SizedBox(height: 16),
      Card(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), child: Column(children: [
        ListTile(leading: const CircleAvatar(backgroundColor: Color(0xFFECFDF5), child: Icon(Icons.calendar_today,color:Color(0xFF047857))), title: const Text('Data e hora', style: TextStyle(fontSize:12,fontWeight:FontWeight.w600)), subtitle: Text(widget.fmtDate(e.createdAt))),
        const Divider(height:1),
        ListTile(leading: const CircleAvatar(backgroundColor: Color(0xFFECFDF5), child: Icon(Icons.navigation,color:Color(0xFF047857))), title: const Text('LocalizaÃ§Ã£o (GPS)', style: TextStyle(fontSize:12,fontWeight:FontWeight.w600)), subtitle: Text('Latitude: ${e.latitude.toStringAsFixed(6)}\nLongitude: ${e.longitude.toStringAsFixed(6)}')),
        Padding(padding: const EdgeInsets.fromLTRB(16,0,16,12), child: Wrap(spacing:8, children:[
          ActionChip(label: const Text('Google Maps'), onPressed: () => launchUrl(gUrl, mode: LaunchMode.externalApplication)),
          ActionChip(label: const Text('OpenStreetMap'), onPressed: () => launchUrl(oUrl, mode: LaunchMode.externalApplication)),
        ])),
      ])),
      const SizedBox(height: 12),
      SizedBox(height: 220, child: ClipRRect(borderRadius: BorderRadius.circular(16), child: FlutterMap(
        options: MapOptions(initialCenter: LatLng(e.latitude, e.longitude), initialZoom: 15),
        children: [
          TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.geodiario.app'),
          MarkerLayer(markers: [Marker(point: LatLng(e.latitude,e.longitude), width:40, height:40, child: const Icon(Icons.location_on,color:Colors.red,size:36))]),
        ],
      ))),
    ]);
  }
}

class MapScreen extends StatefulWidget {
  final List<DiaryEntry> entries; final void Function(DiaryEntry) onSelect;
  const MapScreen({super.key, required this.entries, required this.onSelect});
  @override State<MapScreen> createState() => _MapScreenState();
}
class _MapScreenState extends State<MapScreen> {
  DiaryEntry? selected;
  @override void initState(){ super.initState(); if (widget.entries.isNotEmpty) selected = widget.entries.first; }
  @override Widget build(BuildContext context) {
    if (widget.entries.isEmpty) return const Center(child: Text('Nenhum registro com coordenadas para exibir no mapa.'));
    final active = selected ?? widget.entries.first;
    return Column(children:[
      Padding(padding: const EdgeInsets.all(16), child: Row(children:[const Icon(Icons.navigation,color:Color(0xFF047857)), const SizedBox(width:8),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children:[const Text('Mapa de Registros', style: TextStyle(fontSize:18,fontWeight:FontWeight.bold)),
          Text('${widget.entries.length} localizaÃ§Ãµes marcadas', style: const TextStyle(fontSize:12,color:Colors.grey))])])),
      Expanded(child: Stack(children:[
        FlutterMap(options: MapOptions(initialCenter: LatLng(active.latitude, active.longitude), initialZoom: 13), children:[
          TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.geodiario.app'),
          MarkerLayer(markers: widget.entries.map((e)=>Marker(point: LatLng(e.latitude,e.longitude), width:40, height:40,
            child: GestureDetector(onTap: ()=>setState(()=>selected=e), child: Icon(Icons.location_on, size: selected?.id==e.id?40:32, color: selected?.id==e.id?Colors.red:Colors.deepOrange)))).toList()),
        ]),
        Positioned(left:12,right:12,bottom:12, child: Card(child: Padding(padding: const EdgeInsets.all(8), child: Row(children:[
          ClipRRect(borderRadius: BorderRadius.circular(8), child: SizedBox(width:64,height:64,child: entryImage(active.imageData))),
          const SizedBox(width:10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children:[
            Text(active.title, maxLines:1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text('${active.latitude.toStringAsFixed(4)}, ${active.longitude.toStringAsFixed(4)}', style: const TextStyle(fontSize:11)),
            TextButton(onPressed: ()=>widget.onSelect(active), child: const Text('Ver detalhes completos')),
          ])),
        ])))),
      ])),
      SizedBox(height:54, child: ListView.separated(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal:12,vertical:8),
        itemCount: widget.entries.length, separatorBuilder: (_,__)=>const SizedBox(width:8),
        itemBuilder: (c,i){ final e=widget.entries[i]; final sel=e.id==selected?.id; return ChoiceChip(label: Text(e.title), selected: sel, onSelected: (_)=>setState(()=>selected=e), selectedColor: const Color(0xFF047857), labelStyle: TextStyle(color: sel?Colors.white:null)); })),
    ]);
  }
}

class EntryFormScreen extends StatefulWidget {
  final VoidCallback onBack; final void Function(DiaryEntry) onSaved;
  const EntryFormScreen({super.key, required this.onBack, required this.onSaved});
  @override State<EntryFormScreen> createState() => _EntryFormScreenState();
}
class _EntryFormScreenState extends State<EntryFormScreen> {
  final titleCtrl = TextEditingController();
  String? imageData; LocationDataResult? location; bool saving = false; final now = DateTime.now();
  bool get isValid => titleCtrl.text.trim().isNotEmpty && imageData != null && location != null;
  @override void dispose(){ titleCtrl.dispose(); super.dispose(); }
  Future<void> _save() async {
    if (!isValid || saving) return; setState(()=>saving=true);
    final n = DateTime.now();
    final entry = DiaryEntry(id: n.millisecondsSinceEpoch.toString(), title: titleCtrl.text.trim(), imageData: imageData!, latitude: location!.latitude, longitude: location!.longitude, createdAt: n.toIso8601String(), address: location!.address);
    await StorageService.insertEntry(entry); widget.onSaved(entry);
  }
  @override Widget build(BuildContext context){
    final fmt = DateFormat("dd/MM/yyyy 'Ã s' HH:mm").format(now);
    return ListView(padding: const EdgeInsets.all(16), children:[
      Row(children:[IconButton(onPressed: widget.onBack, icon: const Icon(Icons.arrow_back)), const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children:[Text('Novo Registro', style: TextStyle(fontSize:20,fontWeight:FontWeight.bold)), Text('Associe uma foto Ã s coordenadas geogrÃ¡ficas e data/hora', style: TextStyle(fontSize:12,color:Colors.grey))]))]),
      const SizedBox(height:12), const Text('1. Fotografia do momento', style: TextStyle(fontWeight:FontWeight.w600)), const SizedBox(height:6),
      ImageCaptureWidget(imageData: imageData, onChanged: (v)=>setState(()=>imageData=v)),
      const SizedBox(height:16), const Text('2. TÃ­tulo ou descriÃ§Ã£o', style: TextStyle(fontWeight:FontWeight.w600)), const SizedBox(height:6),
      TextField(controller: titleCtrl, decoration: InputDecoration(hintText: 'Ex.: PraÃ§a central no fim da tarde', prefixIcon: const Icon(Icons.edit), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))), onChanged: (_)=>setState((){})),
      const SizedBox(height:16), const Text('3. LocalizaÃ§Ã£o geogrÃ¡fica (GPS)', style: TextStyle(fontWeight:FontWeight.w600)), const SizedBox(height:6),
      LocationCaptureWidget(location: location, onChanged: (v)=>setState(()=>location=v)),
      const SizedBox(height:16),
      Card(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), child: ListTile(leading: const CircleAvatar(backgroundColor: Color(0xFFECFDF5), child: Icon(Icons.access_time,color:Color(0xFF047857))), title: const Text('Data e hora'), subtitle: Text('$fmt (registrada automaticamente ao salvar)'))),
      const SizedBox(height:16),
      FilledButton.icon(onPressed: isValid && !saving ? _save : null, icon: saving ? const SizedBox(width:18,height:18,child:CircularProgressIndicator(strokeWidth:2,color:Colors.white)) : const Icon(Icons.save), label: Text(saving?'Salvando registro...':'Salvar registro'), style: FilledButton.styleFrom(backgroundColor: const Color(0xFF047857), padding: const EdgeInsets.symmetric(vertical:14))),
      if (!isValid) const Padding(padding: EdgeInsets.only(top:8), child: Text('Preencha o tÃ­tulo, capture uma foto e obtenha a localizaÃ§Ã£o para salvar.', textAlign: TextAlign.center, style: TextStyle(fontSize:12,color:Colors.grey))),
    ]);
  }
}

class ImageCaptureWidget extends StatelessWidget {
  final String? imageData; final ValueChanged<String?> onChanged;
  const ImageCaptureWidget({super.key, required this.imageData, required this.onChanged});
  Future<void> _pick(ImageSource src) async {
    final x = await ImagePicker().pickImage(source: src, imageQuality: 85, maxWidth: 1280);
    if (x == null) return; final b = await x.readAsBytes(); onChanged('data:image/jpeg;base64,${base64Encode(b)}');
  }
  @override Widget build(BuildContext context){
    return Column(children:[
      Container(height:220,width:double.infinity, clipBehavior: Clip.antiAlias, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade300,width:2)),
        child: imageData != null ? entryImage(imageData!) : const Column(mainAxisAlignment: MainAxisAlignment.center, children:[Icon(Icons.camera_alt,size:40,color:Color(0xFF047857)), SizedBox(height:8), Text('Nenhuma foto capturada', style: TextStyle(fontWeight:FontWeight.w600)), Padding(padding: EdgeInsets.symmetric(horizontal:24), child: Text('Tire uma foto agora com a cÃ¢mera ou escolha uma imagem do seu dispositivo.', textAlign: TextAlign.center, style: TextStyle(fontSize:12,color:Colors.grey)))])),
      const SizedBox(height:8),
      Row(children:[
        Expanded(child: OutlinedButton.icon(onPressed: ()=>_pick(ImageSource.camera), icon: const Icon(Icons.photo_camera), label: const Text('Abrir CÃ¢mera'))),
        const SizedBox(width:8),
        Expanded(child: OutlinedButton.icon(onPressed: ()=>_pick(ImageSource.gallery), icon: const Icon(Icons.upload), label: Text(imageData!=null?'Trocar Arquivo':'Escolher Foto'))),
      ]),
    ]);
  }
}

class LocationCaptureWidget extends StatefulWidget {
  final LocationDataResult? location; final ValueChanged<LocationDataResult?> onChanged;
  const LocationCaptureWidget({super.key, required this.location, required this.onChanged});
  @override State<LocationCaptureWidget> createState() => _LocationCaptureWidgetState();
}
class _LocationCaptureWidgetState extends State<LocationCaptureWidget> {
  bool loading=false; String? error; bool showManual=false;
  final latCtrl = TextEditingController(text:'-23.550520'); final lngCtrl = TextEditingController(text:'-46.633308');
  Future<void> _capture() async {
    setState((){loading=true; error=null;});
    try {
      if (!await Geolocator.isLocationServiceEnabled()) { setState((){error='ServiÃ§o de localizaÃ§Ã£o desativado.'; loading=false;}); return; }
      var p = await Geolocator.checkPermission();
      if (p==LocationPermission.denied) p = await Geolocator.requestPermission();
      if (p==LocationPermission.denied || p==LocationPermission.deniedForever){ setState((){error='PermissÃ£o de GPS negada.'; loading=false;}); return; }
      final pos = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high));
      final addr = await GeocodingService.reverseGeocode(pos.latitude, pos.longitude);
      widget.onChanged(LocationDataResult(latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy, address: addr));
      latCtrl.text='${pos.latitude}'; lngCtrl.text='${pos.longitude}';
    } catch(_){ setState(()=>error='Falha ao obter localizaÃ§Ã£o. Verifique o GPS e as permissÃµes.'); }
    finally { if(mounted) setState(()=>loading=false); }
  }
  Future<void> _applyManual() async {
    final lat = double.tryParse(latCtrl.text), lng = double.tryParse(lngCtrl.text);
    if (lat==null||lng==null) return; setState(()=>loading=true);
    final addr = await GeocodingService.reverseGeocode(lat,lng);
    widget.onChanged(LocationDataResult(latitude: lat, longitude: lng, accuracy: 10, address: addr));
    if(mounted) setState((){loading=false; showManual=false;});
  }
  @override Widget build(BuildContext context){
    final loc = widget.location;
    return Card(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children:[
      Row(children:[
        CircleAvatar(backgroundColor: loc!=null?const Color(0xFFECFDF5):Colors.grey.shade200, child: Icon(loc!=null?Icons.check_circle:Icons.navigation, color: loc!=null?const Color(0xFF047857):Colors.grey)),
        const SizedBox(width:10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children:[
          Text(loc!=null?'LocalizaÃ§Ã£o Capturada':'LocalizaÃ§Ã£o nÃ£o capturada', style: const TextStyle(fontWeight:FontWeight.w600)),
          Text(loc!=null?'Lat: ${loc.latitude.toStringAsFixed(6)} | Lng: ${loc.longitude.toStringAsFixed(6)}':'Obtenha as coordenadas GPS atuais para associar Ã  foto.', style: const TextStyle(fontSize:11,color:Colors.black54)),
          if (loc?.address!=null) Text(loc!.address!, maxLines:1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize:11,color:Colors.grey)),
        ])),
        IconButton(icon: const Icon(Icons.edit,size:18), onPressed: ()=>setState(()=>showManual=!showManual)),
      ]),
      if (error!=null) Padding(padding: const EdgeInsets.only(top:8), child: Text(error!, style: const TextStyle(color:Colors.orange,fontSize:12))),
      if (showManual) Padding(padding: const EdgeInsets.only(top:8), child: Column(children:[
        Row(children:[
          Expanded(child: TextField(controller: latCtrl, decoration: const InputDecoration(labelText:'Latitude'), keyboardType: const TextInputType.numberWithOptions(decimal:true,signed:true))),
          const SizedBox(width:8),
          Expanded(child: TextField(controller: lngCtrl, decoration: const InputDecoration(labelText:'Longitude'), keyboardType: const TextInputType.numberWithOptions(decimal:true,signed:true))),
        ]),
        Row(mainAxisAlignment: MainAxisAlignment.end, children:[TextButton(onPressed: ()=>setState(()=>showManual=false), child: const Text('Cancelar')), FilledButton(onPressed: _applyManual, style: FilledButton.styleFrom(backgroundColor: const Color(0xFF047857)), child: const Text('Aplicar'))]),
      ])),
      const SizedBox(height:8),
    ])));
  }
}
