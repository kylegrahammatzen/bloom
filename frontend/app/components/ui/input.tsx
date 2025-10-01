import * as React from "react";
import { Input as BaseInput } from "@base-ui-components/react/input";

import { cn } from "~/lib/utils";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">,
    React.ComponentProps<typeof BaseInput> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, trailingIcon, ...props }, ref) => {
    return (
      <div
        className="group relative w-full data-[disabled]:pointer-events-none"
        data-disabled={props.disabled}
      >
        {leadingIcon && (
          <span className="text-muted-foreground absolute top-1/2 left-3 shrink-0 -translate-y-1/2 [&_svg]:shrink-0 [&_svg:not([class*='pointer-events-'])]:pointer-events-none [&_svg:not([class*='size-'])]:size-4">
            {leadingIcon}
          </span>
        )}
        <BaseInput
          ref={ref}
          className={cn(
            "placeholder:text-muted-foreground selection:bg-primary group-hover:border-ring/70 selection:text-primary-foreground bg-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none disabled:pointer-events-none disabled:opacity-50 md:text-sm",
            "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/50 aria-invalid:border-destructive",
            leadingIcon && "pl-10",
            trailingIcon && "pr-10"
          )}
          {...props}
        />
        {trailingIcon && (
          <span className="text-muted-foreground absolute top-1/2 right-3 shrink-0 -translate-y-1/2 [&_svg]:shrink-0 [&_svg:not([class*='pointer-events-'])]:pointer-events-none [&_svg:not([class*='size-'])]:size-4">
            {trailingIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
