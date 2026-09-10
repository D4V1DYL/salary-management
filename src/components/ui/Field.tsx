import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { angka, parseAngka } from "@/lib/format";

function Shell({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-muted">
          {label}
          {required && <span className="ml-0.5 text-neg">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-neg">{error}</p>
      ) : (
        hint && <p className="text-[12px] text-subtle">{hint}</p>
      )}
    </div>
  );
}

const baseInput =
  "h-9 w-full rounded-[6px] border border-border-input bg-surface px-3 text-[13.5px] text-text " +
  "placeholder:text-subtle transition-colors duration-150 " +
  "focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-subtle";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapClass?: string;
  addonRight?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, wrapClass, required, className, addonRight, id, ...props },
  ref
) {
  const gen = useId();
  const fid = id ?? gen;
  return (
    <Shell label={label} hint={hint} error={error} required={required} htmlFor={fid} className={wrapClass}>
      <div className="relative">
        <input
          ref={ref}
          id={fid}
          required={required}
          className={cn(baseInput, error && "border-neg focus:border-neg focus:ring-neg/15", addonRight && "pr-10", className)}
          {...props}
        />
        {addonRight && (
          <span className="absolute inset-y-0 right-3 grid place-items-center text-subtle [&_svg]:size-4">
            {addonRight}
          </span>
        )}
      </div>
    </Shell>
  );
});

export interface NumberFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  wrapClass?: string;
  required?: boolean;
  value: number;
  onValue: (n: number) => void;
  prefix?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function NumberField({
  label,
  hint,
  error,
  wrapClass,
  required,
  value,
  onValue,
  prefix = "Rp",
  disabled,
  placeholder = "0",
}: NumberFieldProps) {
  const gen = useId();
  return (
    <Shell label={label} hint={hint} error={error} required={required} htmlFor={gen} className={wrapClass}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-[13px] font-medium text-subtle">
            {prefix}
          </span>
        )}
        <input
          id={gen}
          inputMode="numeric"
          disabled={disabled}
          value={value ? angka(value) : ""}
          placeholder={placeholder}
          onChange={(e) => onValue(parseAngka(e.target.value))}
          className={cn(
            baseInput,
            "tnum text-right",
            prefix && "pl-10",
            error && "border-neg focus:border-neg focus:ring-neg/15"
          )}
        />
      </div>
    </Shell>
  );
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapClass?: string;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, wrapClass, required, className, options, id, ...props },
  ref
) {
  const gen = useId();
  const fid = id ?? gen;
  return (
    <Shell label={label} hint={hint} error={error} required={required} htmlFor={fid} className={wrapClass}>
      <div className="relative">
        <select
          ref={ref}
          id={fid}
          className={cn(baseInput, "appearance-none pr-9", error && "border-neg", className)}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-subtle" />
      </div>
    </Shell>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapClass?: string;
}>(function TextArea({ label, hint, error, wrapClass, required, className, id, ...props }, ref) {
  const gen = useId();
  const fid = id ?? gen;
  return (
    <Shell label={label} hint={hint} error={error} required={required} htmlFor={fid} className={wrapClass}>
      <textarea
        ref={ref}
        id={fid}
        className={cn(baseInput, "h-auto min-h-20 py-2.5 leading-relaxed", error && "border-neg", className)}
        {...props}
      />
    </Shell>
  );
});
