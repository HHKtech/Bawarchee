type Option = {
  value: string;
  label: string;
};

type MultiSelectChipsProps = {
  label: string;
  description?: string;
  options: readonly Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  exclusiveNone?: boolean;
};

export function MultiSelectChips({
  label,
  description,
  options,
  selected,
  onChange,
  exclusiveNone = false
}: MultiSelectChipsProps) {
  function toggle(value: string) {
    const isSelected = selected.includes(value);

    if (exclusiveNone && value === 'none') {
      onChange(isSelected ? [] : ['none']);
      return;
    }

    const withoutNone = exclusiveNone ? selected.filter((item) => item !== 'none') : selected;
    onChange(isSelected ? withoutNone.filter((item) => item !== value) : [...withoutNone, value]);
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-950">{label}</legend>
      {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                  : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
