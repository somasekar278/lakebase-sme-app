import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
export const cn=(...inputs:ClassValue[])=>clsx(inputs);
const buttonVariants=cva('btn',{
 variants:{
  variant:{default:'btn-primary',outline:'btn-outline',ghost:'btn-ghost',destructive:'btn-destructive'},
  size:{default:'btn-default',sm:'btn-sm',icon:'btn-icon'}
 },
 defaultVariants:{variant:'default',size:'default'}
});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{asChild?:boolean}
export const Button=React.forwardRef<HTMLButtonElement,ButtonProps>(({className,variant,size,asChild=false,...props},ref)=>{const Comp=asChild?Slot:'button';return <Comp className={cn(buttonVariants({variant,size,className}))} ref={ref} {...props}/>;});Button.displayName='Button';
