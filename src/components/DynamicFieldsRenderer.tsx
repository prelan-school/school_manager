import type { DynamicFieldDefinition, Role } from '../ecs/types';

interface DynamicFieldInputsProps {
  fields: DynamicFieldDefinition[];
  values: Record<string, string | number | boolean>;
  role: Role;
  onChange: (key: string, value: string | number | boolean) => void;
}

export function DynamicFieldInputs({
  fields,
  values,
  role,
  onChange,
}: DynamicFieldInputsProps) {
  const editableFields = fields.filter(
    (f) => role === 'admin' || f.editableBy.includes(role)
  );

  if (editableFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">
          Dynamic ECS Fields
        </span>
        <span className="text-xs text-slate-500">
          Rendered from Component Registry
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {editableFields.map((field) => {
          const inputId = `dyn_${field.id}`;
          const val = values[field.key];

          if (field.fieldType === 'boolean') {
            return (
              <label
                key={field.id}
                htmlFor={inputId}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
              >
                <span className="font-medium">
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </span>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={Boolean(val)}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                />
              </label>
            );
          }

          if (field.fieldType === 'select') {
            return (
              <div key={field.id}>
                <label
                  htmlFor={inputId}
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </label>
                <select
                  id={inputId}
                  value={String(val ?? '')}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  <option value="">Select {field.label}</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div key={field.id}>
              <label
                htmlFor={inputId}
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                {field.label}
                {field.required && <span className="text-red-600"> *</span>}
              </label>
              <input
                id={inputId}
                type={
                  field.fieldType === 'number'
                    ? 'number'
                    : field.fieldType === 'date'
                      ? 'date'
                      : 'text'
                }
                value={val === undefined ? '' : String(val)}
                onChange={(e) =>
                  onChange(
                    field.key,
                    field.fieldType === 'number'
                      ? e.target.value === ''
                        ? ''
                        : Number(e.target.value)
                      : e.target.value
                  )
                }
                placeholder={field.description}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DynamicFieldReadoutProps {
  fields: DynamicFieldDefinition[];
  values: Record<string, string | number | boolean>;
  role: Role;
}

export function DynamicFieldReadout({
  fields,
  values,
  role,
}: DynamicFieldReadoutProps) {
  const visibleFields = fields.filter(
    (f) => role === 'admin' || f.visibleTo.includes(role)
  );
  const populated = visibleFields.filter((f) => {
    const v = values[f.key];
    return v !== undefined && v !== null && String(v).trim() !== '';
  });

  if (populated.length === 0) {
    return null;
  }

  return (
    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
      {populated.map((field) => {
        const raw = values[field.key];
        const formatted =
          typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : String(raw);
        return (
          <div key={field.id} className="flex items-baseline justify-between gap-2 text-xs">
            <dt className="font-medium text-slate-500">{field.label}</dt>
            <dd className="font-mono text-slate-900 tabular-nums">{formatted}</dd>
          </div>
        );
      })}
    </dl>
  );
}
