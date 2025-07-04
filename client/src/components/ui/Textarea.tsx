/* eslint-disable */
import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { cn } from '../../utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex h-20 w-full resize-none rounded-md border border-meld-graysmoke bg-transparent px-3 py-2 text-sm placeholder:text-meld-ink/40 focus:outline-none focus:ring-2 focus:ring-meld-sage/50 focus:border-meld-sage disabled:cursor-not-allowed disabled:opacity-50 text-meld-ink',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
