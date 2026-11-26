import 'package:flutter/material.dart';
import 'school_entity.dart';

class DynamicFieldInputs extends StatelessWidget {
  const DynamicFieldInputs({
    super.key,
    required this.fields,
    required this.values,
    required this.role,
    required this.onChanged,
  });

  final List<DynamicFieldDefinition> fields;
  final Map<String, dynamic> values;
  final PortalRole role;
  final void Function(String key, dynamic value) onChanged;

  @override
  Widget build(BuildContext context) {
    final visibleFields =
        fields.where((f) => !f.archived && f.isVisibleTo(role)).toList();
    if (visibleFields.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Dynamic ECS Fields',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 10),
          ...visibleFields.map((field) {
            final editable = field.isEditableBy(role);
            final current = values[field.key];

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: switch (field.fieldType) {
                DynamicFieldType.boolean => SwitchListTile.adaptive(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: Text(field.label, style: const TextStyle(fontSize: 13)),
                    subtitle: Text(
                      field.description,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                    value: current == true,
                    onChanged: editable ? (v) => onChanged(field.key, v) : null,
                  ),
                DynamicFieldType.select => DropdownButtonFormField<String>(
                    value: field.options.contains(current) ? current as String : null,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: '${field.label}${field.required ? ' *' : ''}',
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: field.options
                        .map(
                          (o) => DropdownMenuItem(
                            value: o,
                            child: Text(o, overflow: TextOverflow.ellipsis),
                          ),
                        )
                        .toList(),
                    onChanged: editable ? (v) => onChanged(field.key, v ?? '') : null,
                  ),
                DynamicFieldType.number => TextFormField(
                    initialValue: current?.toString() ?? '',
                    enabled: editable,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: '${field.label}${field.required ? ' *' : ''}',
                      hintText: field.description,
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                    onChanged: (v) => onChanged(field.key, num.tryParse(v) ?? 0),
                  ),
                DynamicFieldType.date || DynamicFieldType.text => TextFormField(
                    initialValue: current?.toString() ?? '',
                    enabled: editable,
                    decoration: InputDecoration(
                      labelText: '${field.label}${field.required ? ' *' : ''}',
                      hintText: field.fieldType == DynamicFieldType.date
                          ? 'YYYY-MM-DD'
                          : field.description,
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                    onChanged: (v) => onChanged(field.key, v),
                  ),
              },
            );
          }),
        ],
      ),
    );
  }
}

class DynamicFieldReadout extends StatelessWidget {
  const DynamicFieldReadout({
    super.key,
    required this.fields,
    required this.values,
    required this.role,
  });

  final List<DynamicFieldDefinition> fields;
  final Map<String, dynamic> values;
  final PortalRole role;

  @override
  Widget build(BuildContext context) {
    final populated = fields.where((f) {
      if (!f.isVisibleTo(role)) return false;
      final v = values[f.key];
      return v != null && v.toString().isNotEmpty;
    }).toList();

    if (populated.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.only(top: 8),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Wrap(
        spacing: 16,
        runSpacing: 6,
        children: populated.map((f) {
          final raw = values[f.key];
          final formatted = f.fieldType == DynamicFieldType.boolean
              ? (raw == true ? 'Yes' : 'No')
              : raw.toString();
          return Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: '${f.label}: ',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                TextSpan(
                  text: formatted,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
