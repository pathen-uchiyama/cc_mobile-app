import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      offset={16}
      className="toaster group"
      style={
        {
          // Token bridge so Sonner's internals pick up brand colors.
          "--normal-bg": "hsl(var(--card))",
          "--normal-text": "hsl(var(--foreground))",
          "--normal-border": "hsl(var(--gold) / 0.4)",
          "--success-bg": "hsl(var(--card))",
          "--success-text": "hsl(var(--foreground))",
          "--success-border": "hsl(var(--gold) / 0.6)",
          "--error-bg": "hsl(var(--card))",
          "--error-text": "hsl(var(--destructive))",
          "--error-border": "hsl(var(--destructive) / 0.5)",
        } as React.CSSProperties
      }
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast font-sans !rounded-2xl !border !shadow-boutique !px-4 !py-3 !bg-card !text-foreground",
          title: "font-display !text-[14px] !leading-tight !font-normal",
          description: "!font-sans !text-[11px] !text-muted-foreground !mt-0.5",
          actionButton:
            "!bg-primary !text-primary-foreground !rounded-xl !px-3 !py-1.5 !font-sans !text-[11px] !font-semibold",
          cancelButton:
            "!bg-transparent !text-muted-foreground !rounded-xl !px-3 !py-1.5 !font-sans !text-[11px]",
          success: "!border-l-4 !border-l-[hsl(var(--gold))]",
          error: "!border-l-4 !border-l-[hsl(var(--destructive))]",
          info: "!border-l-4 !border-l-[hsl(var(--gold)_/_0.5)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
