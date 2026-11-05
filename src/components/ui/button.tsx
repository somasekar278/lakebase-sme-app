import { Button as AppKitButton } from '@databricks/appkit-ui/react';
import type { ComponentProps } from 'react';
export function Button({variant='default',size='default',className='',...props}:ComponentProps<typeof AppKitButton>){
 return <AppKitButton variant={variant} size={size} className={`btn btn-${variant==='default'?'primary':variant} btn-${size} ${className}`} {...props}/>;
}
