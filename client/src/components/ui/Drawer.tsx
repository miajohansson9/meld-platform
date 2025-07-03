import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '~/utils';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerPortal = DialogPrimitive.Portal;
export const DrawerOverlay = DialogPrimitive.Overlay;

export const DrawerContent = ({ className, ...props }: DialogPrimitive.DialogContentProps) => (
  <DialogPrimitive.Content
    className={cn(
      'fixed bottom-0 left-0 right-0 z-[1000] mx-auto w-full rounded-t-2xl bg-white p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-10',
      'dark:bg-gray-800',
      className,
    )}
    {...props}
  />
);

export const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 flex flex-col space-y-2 text-left', className)} {...props} />
);

export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description; 